import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const DAY = 24 * 3600_000;

/**
 * Indicateurs du tableau de bord (mêmes définitions que la démo du site, apps/web/src/lib/demo/stats.ts) :
 * à traiter / en retard (> 24 h), en cours, taux de confirmation, volume 7 j vs 7 j précédents,
 * demandes par jour sur 30 jours, répartition par type et par source, file prioritaire, activité récente,
 * demandes ouvertes de l'agent connecté, délai médian de prise en charge (30 j), options de vol et devis (30 j).
 */
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(now = new Date(), meId?: string) {
    const t = now.getTime();
    const since14 = new Date(t - 29 * DAY);
    since14.setUTCHours(0, 0, 0, 0);
    const since30 = new Date(t - 30 * DAY);
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
        where: { kind: { in: ["received", "status_changed", "assigned", "note", "flight_hold"] } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { kind: true, status: true, createdAt: true, lead: { select: { reference: true, fullName: true } } },
      }),
    ]);

    const [bySource, mineOpen, handled, holds, dueSoon, quotes] = await this.prisma.$transaction([
      this.prisma.lead.groupBy({ by: ["source"], orderBy: { source: "asc" }, _count: { _all: true } }),
      this.prisma.lead.count({ where: { assignedToId: meId ?? "00000000-0000-0000-0000-000000000000", status: { in: ["new", "in_progress"] } } }),
      // Première prise en charge (attribution ou changement de statut) des demandes reçues sur 30 jours.
      this.prisma.lead.findMany({
        where: { createdAt: { gte: since30 } },
        select: { createdAt: true, events: { where: { kind: { in: ["assigned", "status_changed"] } }, orderBy: { createdAt: "asc" }, take: 1, select: { createdAt: true } } },
      }),
      this.prisma.flightBooking.count({ where: { status: "held" } }),
      this.prisma.flightBooking.count({ where: { status: "held", payBefore: { not: null, lte: new Date(t + DAY) } } }),
      this.prisma.quote.groupBy({ by: ["currency"], where: { createdAt: { gte: since30 } }, orderBy: { currency: "asc" }, _count: { _all: true }, _sum: { totalAmount: true } }),
    ]);
    const delays = handled.flatMap((l) => (l.events[0] ? [(l.events[0].createdAt.getTime() - l.createdAt.getTime()) / 3600_000] : [])).sort((a, b) => a - b);
    const median = delays.length ? delays[Math.floor((delays.length - 1) / 2)]! : null;

    const statusCounts: Record<string, number> = Object.fromEntries(byStatus.map((r) => [r.status, (r._count as { _all?: number })._all ?? 0]));
    const status = (s: string) => statusCounts[s] ?? 0;
    const confirmed = status("confirmed");
    const cancelled = status("cancelled");

    const perDay = new Map<string, number>();
    for (const r of recent) {
      const key = r.createdAt.toISOString().slice(0, 10);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }
    const daily = Array.from({ length: 30 }, (_, i) => {
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
        mineOpen,
        medianHandlingHours: median === null ? null : Math.round(median * 10) / 10,
        handledShare: handled.length ? delays.length / handled.length : null,
      },
      byStatus: { new: status("new"), in_progress: status("in_progress"), confirmed, cancelled },
      bySource: Object.fromEntries(bySource.map((r) => [r.source, (r._count as { _all?: number })._all ?? 0])),
      flights: { held: holds, dueSoon },
      quotes30: quotes.map((q) => ({ currency: q.currency, count: (q._count as { _all?: number })._all ?? 0, total: (q._sum as { totalAmount?: bigint | null }).totalAmount?.toString() ?? "0" })),
      daily,
      byType: Object.fromEntries(byType.map((r) => [r.type, (r._count as { _all?: number })._all ?? 0])),
      priorityQueue: queue,
      activity: events.map((e) => ({ kind: e.kind, status: e.status, at: e.createdAt, reference: e.lead.reference, name: e.lead.fullName })),
    };
  }
}
