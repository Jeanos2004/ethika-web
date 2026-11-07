import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { User } from "../../generated/prisma/client";
import { ENV, type Env } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { FieldCipher, randomToken, sha256 } from "../../common/security/crypto";
import { RateLimiter } from "../../common/security/rate-limit";
import { generateTotpSecret, totpUri, verifyTotp } from "../../common/security/totp";
import { AuditService } from "../audit/audit.service";
import { PasswordService } from "./password.service";
import type { AuthContext } from "./auth.types";

/** Au-delà de 5 échecs consécutifs : verrouillage de 15 min, doublé à chaque récidive (24 h maximum). */
const MAX_FAILURES = 5;
const BASE_LOCK_MS = 15 * 60_000;
const MAX_LOCK_MS = 24 * 60 * 60_000;
const CHALLENGE_MS = 5 * 60_000;
const TOUCH_INTERVAL_MS = 60_000;

export type LoginResult =
  | { status: "ok"; session: string; expiresAt: Date }
  | { status: "mfa_required"; challenge: string }
  | { status: "mfa_setup_required"; session: string; expiresAt: Date };

type ClientInfo = { ip?: string | null; userAgent?: string | null };

@Injectable()
export class AuthService {
  private readonly cipher: FieldCipher;
  private readonly ipLimiter = new RateLimiter(20, 15 * 60_000);
  private readonly accountLimiter = new RateLimiter(10, 15 * 60_000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {
    this.cipher = new FieldCipher(env.DATA_ENCRYPTION_KEY);
  }

  /** Étape 1 : e-mail + mot de passe. Réponse identique que le compte existe ou non. */
  async login(email: string, password: string, client: ClientInfo): Promise<LoginResult> {
    const normalized = email.trim().toLowerCase();
    this.ipLimiter.consume(`ip:${client.ip ?? "?"}`);
    this.accountLimiter.consume(`acct:${normalized}`);

    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    const valid = await this.passwords.verify(user?.passwordHash ?? null, password);
    const now = new Date();

    if (!user || user.disabled) {
      await this.audit.log("auth.login_failed", { ip: client.ip, meta: { reason: user ? "disabled" : "unknown" } });
      throw invalid();
    }
    if (user.lockedUntil && user.lockedUntil > now) {
      await this.audit.log("auth.login_failed", { actorId: user.id, ip: client.ip, meta: { reason: "locked" } });
      throw invalid();
    }
    if (!valid) {
      await this.registerFailure(user, client);
      throw invalid();
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lockedUntil: null } });

    if (user.totpEnabled && user.totpSecret) {
      const challenge = randomToken();
      await this.prisma.loginChallenge.create({ data: { id: sha256(challenge), userId: user.id, expiresAt: new Date(now.getTime() + CHALLENGE_MS) } });
      return { status: "mfa_required", challenge };
    }

    // Sans 2FA : un admin doit la configurer avant tout accès ; un agent est connecté directement.
    const mfaVerified = user.role !== "admin";
    const session = await this.createSession(user, mfaVerified, client);
    await this.afterLogin(user, client);
    return mfaVerified ? { status: "ok", ...session } : { status: "mfa_setup_required", ...session };
  }

  /** Étape 2 : code TOTP (usage unique, 5 essais par défi). */
  async verifyMfa(challenge: string, code: string, client: ClientInfo): Promise<LoginResult> {
    this.ipLimiter.consume(`ip:${client.ip ?? "?"}`);
    const row = await this.prisma.loginChallenge.findUnique({ where: { id: sha256(challenge) } });
    if (!row || row.expiresAt < new Date() || row.attempts >= 5) throw invalid();
    const user = await this.prisma.user.findUnique({ where: { id: row.userId } });
    if (!user || user.disabled || !user.totpSecret) throw invalid();

    const step = verifyTotp(this.cipher.decrypt(user.totpSecret), code, user.totpLastStep ?? null);
    if (step === null) {
      await this.prisma.loginChallenge.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
      await this.registerFailure(user, client);
      throw invalid();
    }
    await this.prisma.$transaction([this.prisma.loginChallenge.delete({ where: { id: row.id } }), this.prisma.user.update({ where: { id: user.id }, data: { totpLastStep: step } })]);
    const session = await this.createSession(user, true, client);
    await this.afterLogin(user, client);
    return { status: "ok", ...session };
  }

  /** Vérifie une session : expiration absolue, inactivité, compte actif. Prolonge l'activité au plus une fois par minute. */
  async validateSession(token: string): Promise<AuthContext | null> {
    const session = await this.prisma.session.findUnique({ where: { id: sha256(token) }, include: { user: true } });
    if (!session) return null;
    const now = Date.now();
    const idleLimit = session.lastSeenAt.getTime() + this.env.SESSION_IDLE_MINUTES * 60_000;
    if (session.expiresAt.getTime() <= now || idleLimit <= now || session.user.disabled) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
      await this.prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date(now) } }).catch(() => undefined);
    }
    const u = session.user;
    return { userId: u.id, email: u.email, name: u.name, role: u.role, sessionId: session.id, mfaVerified: session.mfaVerified, mustChangePassword: u.mustChangePassword };
  }

  async logout(auth: AuthContext, client: ClientInfo) {
    await this.prisma.session.delete({ where: { id: auth.sessionId } }).catch(() => undefined);
    await this.audit.log("auth.logout", { actorId: auth.userId, ip: client.ip });
  }

  /** Configuration de la 2FA : nouveau secret chiffré en base, à confirmer par un premier code. */
  async setupMfa(auth: AuthContext) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: auth.userId } });
    if (user.totpEnabled) throw new BadRequestException({ error: "mfa_already_enabled" });
    const secret = generateTotpSecret();
    await this.prisma.user.update({ where: { id: user.id }, data: { totpSecret: this.cipher.encrypt(secret), totpLastStep: null } });
    return { secret, otpauthUri: totpUri(secret, user.email) };
  }

  /** Active la 2FA après vérification d'un code, puis fait tourner la session (nouveau jeton, 2FA validée). */
  async enableMfa(auth: AuthContext, code: string, client: ClientInfo) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: auth.userId } });
    if (!user.totpSecret || user.totpEnabled) throw new BadRequestException({ error: "mfa_setup_missing" });
    const step = verifyTotp(this.cipher.decrypt(user.totpSecret), code, null);
    if (step === null) throw new BadRequestException({ error: "mfa_code_invalid" });
    await this.prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true, totpLastStep: step } });
    await this.audit.log("auth.mfa_enabled", { actorId: user.id, ip: client.ip });
    return this.rotate(user, true, client);
  }

  /** Changement de mot de passe : vérifie l'actuel, applique la politique, ferme les autres sessions et fait tourner celle-ci. */
  async changePassword(auth: AuthContext, current: string, next: string, client: ClientInfo) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: auth.userId } });
    if (!(await this.passwords.verify(user.passwordHash, current))) throw new BadRequestException({ error: "password_invalid" });
    const problem = this.passwords.validate(next);
    if (problem) throw new BadRequestException({ error: problem });
    if (await this.passwords.verify(user.passwordHash, next)) throw new BadRequestException({ error: "password_reused" });
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await this.passwords.hash(next), mustChangePassword: false } });
    await this.audit.log("auth.password_changed", { actorId: user.id, ip: client.ip });
    return this.rotate(user, auth.mfaVerified, client);
  }

  /** Nouveau jeton après un changement de privilège ; toutes les autres sessions du compte sont fermées. */
  private async rotate(user: User, mfaVerified: boolean, client: ClientInfo) {
    await this.prisma.session.deleteMany({ where: { userId: user.id } });
    return this.createSession(user, mfaVerified, client);
  }

  private async createSession(user: User, mfaVerified: boolean, client: ClientInfo) {
    const token = randomToken();
    const expiresAt = new Date(Date.now() + this.env.SESSION_MAX_MINUTES * 60_000);
    await this.prisma.session.create({
      data: { id: sha256(token), userId: user.id, mfaVerified, expiresAt, ip: client.ip?.slice(0, 64) ?? null, userAgent: client.userAgent?.slice(0, 255) ?? null },
    });
    return { session: token, expiresAt };
  }

  private async afterLogin(user: User, client: ClientInfo) {
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.log("auth.login", { actorId: user.id, ip: client.ip });
  }

  private async registerFailure(user: User, client: ClientInfo) {
    const failures = user.failedAttempts + 1;
    if (failures >= MAX_FAILURES) {
      const lockCount = user.lockCount + 1;
      const lockedUntil = new Date(Date.now() + Math.min(BASE_LOCK_MS * 2 ** (lockCount - 1), MAX_LOCK_MS));
      await this.prisma.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lockCount, lockedUntil } });
      await this.audit.log("auth.locked", { actorId: user.id, ip: client.ip, meta: { until: lockedUntil.toISOString() } });
    } else {
      await this.prisma.user.update({ where: { id: user.id }, data: { failedAttempts: failures } });
      await this.audit.log("auth.login_failed", { actorId: user.id, ip: client.ip, meta: { reason: "password" } });
    }
  }
}

function invalid() {
  return new UnauthorizedException({ error: "invalid_credentials" });
}
