import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.locked"
  | "auth.logout"
  | "auth.mfa_enabled"
  | "auth.mfa_reset"
  | "auth.password_changed"
  | "user.created"
  | "user.updated"
  | "user.disabled"
  | "lead.status_changed"
  | "lead.assigned"
  | "lead.exported"
  | "lead.pdf"
  | "quote.created"
  | "content.created"
  | "content.updated"
  | "content.deleted"
  | "maintenance.purge";

/**
 * Journal d'audit des actions sensibles. Ne contient jamais de donnée personnelle de client
 * (références et identifiants seulement). Une panne d'écriture ne bloque pas l'action, mais est signalée.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger("Audit");

  constructor(private readonly prisma: PrismaService) {}

  async log(action: AuditAction, input: { actorId?: string | null; target?: string; ip?: string | null; meta?: Record<string, unknown> } = {}) {
    try {
      await this.prisma.auditLog.create({
        data: { action, actorId: input.actorId ?? null, target: input.target, ip: input.ip ?? null, meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined },
      });
    } catch (e) {
      this.logger.error(`écriture du journal impossible (${action}) : ${e instanceof Error ? e.message : "erreur"}`);
    }
  }

  list(page: number, pageSize: number) {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize });
  }
}
