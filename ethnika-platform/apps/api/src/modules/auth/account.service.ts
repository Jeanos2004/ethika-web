import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ENV, type Env } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { sha256 } from "../../common/security/crypto";
import { AuditService } from "../audit/audit.service";
import type { AuthContext } from "./auth.types";

/**
 * Compte connecté : profil, sessions actives (révocation), état du système pour les administrateurs.
 * Les sessions sont exposées sous un identifiant dérivé (empreinte de l'empreinte du jeton) : jamais le jeton
 * ni la clé stockée.
 */
@Injectable()
export class AccountService {
  private readonly startedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async profile(me: AuthContext) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: me.userId },
      select: { name: true, email: true, role: true, totpEnabled: true, lastLoginAt: true, createdAt: true },
    });
    return { ...u, mfaVerified: me.mfaVerified };
  }

  async rename(me: AuthContext, name: string) {
    await this.prisma.user.update({ where: { id: me.userId }, data: { name } });
    await this.audit.log("user.updated", { actorId: me.userId, target: me.userId, meta: { fields: ["name"], self: true } });
    return this.profile(me);
  }

  async sessions(me: AuthContext) {
    const rows = await this.prisma.session.findMany({ where: { userId: me.userId, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } });
    return rows.map((s) => ({
      handle: handle(s.id),
      current: s.id === me.sessionId,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      expiresAt: s.expiresAt,
      ip: s.ip,
      device: device(s.userAgent),
    }));
  }

  async revoke(me: AuthContext, target: string) {
    const rows = await this.prisma.session.findMany({ where: { userId: me.userId }, select: { id: true } });
    const found = rows.find((s) => handle(s.id) === target);
    if (!found) throw new NotFoundException();
    if (found.id === me.sessionId) throw new BadRequestException({ error: "current_session" });
    await this.prisma.session.delete({ where: { id: found.id } });
    await this.audit.log("auth.logout", { actorId: me.userId, meta: { revoked: 1 } });
    return { ok: true };
  }

  async revokeOthers(me: AuthContext) {
    const { count } = await this.prisma.session.deleteMany({ where: { userId: me.userId, id: { not: me.sessionId } } });
    await this.audit.log("auth.logout", { actorId: me.userId, meta: { revoked: count } });
    return { revoked: count };
  }

  /** État de fonctionnement (administrateurs) : configuration, file d'e-mails, volumes. Aucun secret. */
  async system() {
    const day = new Date(Date.now() - 24 * 3600_000);
    const [users, leads, subscribers, pending, failed, sent24h, holds] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { disabled: false } }),
      this.prisma.lead.count(),
      this.prisma.subscriber.count({ where: { confirmedAt: { not: null }, unsubscribedAt: null } }),
      this.prisma.emailOutbox.count({ where: { status: "pending" } }),
      this.prisma.emailOutbox.count({ where: { status: "failed" } }),
      this.prisma.emailOutbox.count({ where: { status: "sent", sentAt: { gte: day } } }),
      this.prisma.flightBooking.count({ where: { status: "held" } }),
    ]);
    return {
      version: process.env.npm_package_version ?? "0.1.0",
      environment: this.env.NODE_ENV,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      siteUrl: this.env.SITE_URL,
      flightProvider: this.env.FLIGHT_PROVIDER,
      mailProvider: this.env.RESEND_API_KEY ? "resend" : this.env.SMTP_URL ? "smtp" : "none",
      paymentProvider: this.env.PAYMENT_PROVIDER,
      agencyNotifyConfigured: Boolean(this.env.AGENCY_NOTIFY_EMAIL),
      pdfConfigured: Boolean(this.env.CHROME_PATH),
      sessionIdleMinutes: this.env.SESSION_IDLE_MINUTES,
      sessionMaxMinutes: this.env.SESSION_MAX_MINUTES,
      leadRetentionDays: this.env.LEAD_RETENTION_DAYS,
      counts: { users, leads, subscribers, holds },
      mail: { pending, failed, sent24h },
    };
  }
}

function handle(storedId: string) {
  return sha256(`session:${storedId}`).slice(0, 16);
}

/** « Chrome · Windows » à partir du User-Agent (rien d'autre n'est exposé). */
function device(ua: string | null) {
  if (!ua) return null;
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navigateur";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} · ${os}` : browser;
}
