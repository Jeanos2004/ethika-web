import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const DAY = 24 * 3600_000;

/**
 * Indicateurs du tableau de bord (mêmes définitions que la démo du site, apps/web/src/lib/demo/stats.ts) :
 * à traiter / en retard (> 24 h), en cours, taux de confirmation, volume 7 j vs 7 j précédents,
 * demandes par jour sur 14 jours, répartition par type, file prioritaire, activité récente.
 */
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(now = new Date()) {
    const t = now.getTime();
    const since14 = new Date(t - 13 * DAY);
    since14.setUTCHours(0, 0, 0, 0);
    const [byStatus, byType, overdue, last7, prev7, recent, queue, events] = await this.prisma.$transaction([
      this.prisma.lead.groupBy({ by: ["status"], orderBy: { status: "asc" }, _count: { _all: true } }),
      this.prisma.lead.groupBy({ by: ["type"], orderBy: { type: "asc" }, _count: { _all: true } }),
      this.prisma.lead.count({ where: { status: "new", createdAt: { lt: new Date(t - DAY) } } }),
      this.prisma.lead.count({ where: { createdAt: { gte: new Date(t - 7 * DAY) } } }),
      this.prisma.lead.count({ where: { createdAt: { gte: new Date(t - 14 * DAY), lt: new Date(t - 7 * DAY) } } }),
      this.prisma.lead.findMany({ where: { createdAt: { gte: since14 } }, select: { createdAt: true } }),
      this.prisma.lead.findMany({
        where: { status: { in: ["new", "in_progress"] } },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        take: 5,
        select: { reference: true, fullName: true, type: true, status: true, createdAt: true, assignedTo: { select: { name: true } } },
      }),
      this.prisma.leadEvent.findMany({
        where: { kind: { in: ["received", "status_changed", "assigned", "note"] } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { kind: true, status: true, createdAt: true, lead: { select: { reference: true, fullName: true } } },
      }),
    ]);

    const statusCounts: Record<string, number> = Object.fromEntries(byStatus.map((r) => [r.status, (r._count as { _all?: number })._all ?? 0]));
    const status = (s: string) => statusCounts[s] ?? 0;
    const confirmed = status("confirmed");
    const cancelled = status("cancelled");

    const perDay = new Map<string, number>();
    for (const r of recent) {
      const key = r.createdAt.toISOString().slice(0, 10);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }
    const daily = Array.from({ length: 14 }, (_, i) => {
      const key = new Date(since14.getTime() + i * DAY).toISOString().slice(0, 10);
      return { date: key, count: perDay.get(key) ?? 0 };
    });

    return {
      kpis: {
        toTreat: status("new"),
        overdue,
        inProgress: status("in_progress"),
        confirmationRate: confirmed + cancelled > 0 ? confirmed / (confirmed + cancelled) : null,
        last7,
        prev7,
      },
      daily,
      byType: Object.fromEntries(byType.map((r) => [r.type, (r._count as { _all?: number })._all ?? 0])),
      priorityQueue: queue,
      activity: events.map((e) => ({ kind: e.kind, status: e.status, at: e.createdAt, reference: e.lead.reference, name: e.lead.fullName })),
    };
  }
}
