import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ENV, type Env } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

const HOUR = 3600_000;

/**
 * Tâches de fond horaires (docs/SECURITY.md : durées de conservation et purge automatique) :
 * - sessions et défis de connexion expirés ;
 * - e-mails envoyés de plus de 90 jours ;
 * - demandes clôturées (confirmées ou annulées) plus anciennes que LEAD_RETENTION_DAYS.
 */
@Injectable()
export class MaintenanceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger("Maintenance");
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onModuleInit() {
    if (this.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => void this.run().catch((e) => this.logger.error(e instanceof Error ? e.message : "erreur")), HOUR);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run(now = new Date()) {
    const sessions = await this.prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
    const challenges = await this.prisma.loginChallenge.deleteMany({ where: { expiresAt: { lt: now } } });
    const emails = await this.prisma.emailOutbox.deleteMany({ where: { status: "sent", sentAt: { lt: new Date(now.getTime() - 90 * 24 * HOUR) } } });
    const cutoff = new Date(now.getTime() - this.env.LEAD_RETENTION_DAYS * 24 * HOUR);
    const leads = await this.prisma.lead.deleteMany({ where: { status: { in: ["confirmed", "cancelled"] }, updatedAt: { lt: cutoff } } });
    if (leads.count) await this.audit.log("maintenance.purge", { meta: { leads: leads.count, before: cutoff.toISOString() } });
    return { sessions: sessions.count, challenges: challenges.count, emails: emails.count, leads: leads.count };
  }
}
