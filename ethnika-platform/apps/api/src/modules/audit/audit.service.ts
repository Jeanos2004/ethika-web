import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export const auditCategories = ["auth", "user", "lead", "quote", "payment", "content", "flight", "maintenance"] as const;
export type AuditCategory = (typeof auditCategories)[number];

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
  | "lead.created"
  | "lead.status_changed"
  | "lead.assigned"
  | "lead.exported"
  | "lead.pdf"
  | "quote.created"
  | "payment.created"
  | "payment.paid"
  | "payment.failed"
  | "payment.cancelled"
  | "content.created"
  | "content.updated"
  | "content.deleted"
  | "flight.hold"
  | "flight.cancelled"
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

  /** Recherche paginée : catégorie (préfixe de l'action) et auteur facultatifs, total pour la pagination. */
  async search(q: { page: number; pageSize: number; category?: AuditCategory; actorId?: string }) {
    const where: Prisma.AuditLogWhereInput = { ...(q.category && { action: { startsWith: `${q.category}.` } }), ...(q.actorId && { actorId: q.actorId }) };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    ]);
    return { total, page: q.page, pageSize: q.pageSize, items };
  }

  /** Volumes des dernières 24 h et des 7 derniers jours par catégorie (indicateurs du journal). */
  async summary(now = new Date()) {
    const day = new Date(now.getTime() - 24 * 3600_000);
    const week = new Date(now.getTime() - 7 * 24 * 3600_000);
    const count = (action: string, since: Date) => this.prisma.auditLog.count({ where: { action, createdAt: { gte: since } } });
    const [logins, failed, locked, recent] = await this.prisma.$transaction([
      count("auth.login", day),
      count("auth.login_failed", day),
      count("auth.locked", week),
      this.prisma.auditLog.findMany({ where: { createdAt: { gte: week } }, select: { action: true } }),
    ]);
    const byCategory = Object.fromEntries(auditCategories.map((c) => [c, recent.filter((r) => r.action.startsWith(`${c}.`)).length]));
    return { last24h: { logins, failedLogins: failed }, last7d: { locked, total: recent.length, byCategory } };
  }
}
