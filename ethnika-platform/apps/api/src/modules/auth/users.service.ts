import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Role } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { PasswordService } from "./password.service";

/** Champs exposés d'un compte : jamais d'empreinte ni de secret. */
const publicUser = { id: true, email: true, name: true, role: true, totpEnabled: true, disabled: true, mustChangePassword: true, lastLoginAt: true, lockedUntil: true, createdAt: true } as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly audit: AuditService,
  ) {}

  list(page: number, pageSize: number) {
    return this.prisma.user.findMany({ select: publicUser, orderBy: { createdAt: "asc" }, skip: (page - 1) * pageSize, take: pageSize });
  }

  /** Crée un compte avec un mot de passe temporaire, renvoyé une seule fois (à changer à la première connexion). */
  async create(input: { email: string; name: string; role: Role }, actorId: string | null) {
    const temporaryPassword = this.passwords.temporary();
    try {
      const user = await this.prisma.user.create({
        data: { email: input.email.trim().toLowerCase(), name: input.name, role: input.role, passwordHash: await this.passwords.hash(temporaryPassword), mustChangePassword: true },
        select: publicUser,
      });
      await this.audit.log("user.created", { actorId, target: user.id, meta: { role: user.role } });
      return { user, temporaryPassword };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new ConflictException({ error: "email_taken" });
      throw e;
    }
  }

  async update(id: string, input: { name?: string; role?: Role; disabled?: boolean }, actorId: string) {
    if (id === actorId && (input.disabled || input.role === "agent")) throw new BadRequestException({ error: "cannot_demote_self" });
    await this.mustExist(id);
    const user = await this.prisma.user.update({ where: { id }, data: input, select: publicUser });
    // Désactivation : toutes les sessions du compte sont fermées immédiatement.
    if (input.disabled) await this.prisma.session.deleteMany({ where: { userId: id } });
    await this.audit.log(input.disabled ? "user.disabled" : "user.updated", { actorId, target: id, meta: { fields: Object.keys(input) } });
    return user;
  }

  /** Réinitialise la 2FA (téléphone perdu) : le compte devra la reconfigurer ; sessions fermées. */
  async resetMfa(id: string, actorId: string) {
    await this.mustExist(id);
    await this.prisma.user.update({ where: { id }, data: { totpEnabled: false, totpSecret: null, totpLastStep: null } });
    await this.prisma.session.deleteMany({ where: { userId: id } });
    await this.audit.log("auth.mfa_reset", { actorId, target: id });
    return { ok: true };
  }

  /** Nouveau mot de passe temporaire (déverrouille le compte) ; sessions fermées. */
  async resetPassword(id: string, actorId: string) {
    await this.mustExist(id);
    const temporaryPassword = this.passwords.temporary();
    await this.prisma.user.update({ where: { id }, data: { passwordHash: await this.passwords.hash(temporaryPassword), mustChangePassword: true, failedAttempts: 0, lockedUntil: null } });
    await this.prisma.session.deleteMany({ where: { userId: id } });
    await this.audit.log("user.updated", { actorId, target: id, meta: { fields: ["password"] } });
    return { temporaryPassword };
  }

  private async mustExist(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException();
  }
}
