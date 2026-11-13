import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { formatMoney, type Currency } from "../quotes/money";
import type { AuthContext } from "../auth/auth.types";

const DAY = 24 * 3600_000;

export type NotificationKind = "lead_new" | "lead_assigned" | "payment_received" | "payment_failed" | "hold_due";

/** Notification du back-office : texte composé par le site (traduit), à partir du type et des paramètres. */
export type Notification = { id: string; kind: NotificationKind; at: Date; reference: string; name?: string; amount?: string; href: string };

/**
 * Cloche du back-office : événements des 7 derniers jours qui demandent une action, calculés à la volée
 * (aucune table à tenir à jour). Le compteur « non lu » compare la date de chaque élément à la dernière
 * ouverture de la cloche par la personne connectée. Aucune donnée client au-delà du nom et de la référence.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(me: AuthContext, now = new Date()) {
    const since = new Date(now.getTime() - 7 * DAY);
    const [user, received, assigned, paid, failed, holds] = await this.prisma.$transaction([
      this.prisma.user.findUniqueOrThrow({ where: { id: me.userId }, select: { notificationsSeenAt: true } }),
      // Nouvelles demandes encore « nouvelles » (les traitées sortent de la cloche).
      this.prisma.leadEvent.findMany({
        where: { kind: "received", createdAt: { gte: since }, lead: { status: "new" } },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, createdAt: true, lead: { select: { reference: true, fullName: true } } },
      }),
      // Demandes attribuées à la personne connectée par quelqu'un d'autre.
      this.prisma.leadEvent.findMany({
        where: { kind: "assigned", createdAt: { gte: since }, actor: { not: me.userId }, lead: { assignedToId: me.userId } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, createdAt: true, lead: { select: { reference: true, fullName: true } } },
      }),
      this.prisma.payment.findMany({
        where: { status: "paid", paidAt: { gte: since } },
        orderBy: { paidAt: "desc" },
        take: 20,
        select: { id: true, reference: true, paidAt: true, amount: true, currency: true, lead: { select: { reference: true, fullName: true } } },
      }),
      this.prisma.payment.findMany({
        where: { status: "failed", updatedAt: { gte: since } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: { id: true, reference: true, updatedAt: true, lead: { select: { reference: true, fullName: true } } },
      }),
      // Options à payer sous 24 h : restent visibles tant qu'elles sont en option.
      this.prisma.flightBooking.findMany({
        where: { status: "held", payBefore: { not: null, lte: new Date(now.getTime() + DAY) } },
        orderBy: { payBefore: "asc" },
        take: 10,
        select: { id: true, bookingReference: true, payBefore: true, createdAt: true },
      }),
    ]);

    const items: Notification[] = [
      ...holds.map((h) => ({ id: `hold-${h.id}`, kind: "hold_due" as const, at: h.payBefore ?? h.createdAt, reference: h.bookingReference ?? "—", href: `/admin/vols/options/${h.id}` })),
      ...received.map((e) => ({ id: `ev-${e.id}`, kind: "lead_new" as const, at: e.createdAt, reference: e.lead.reference, name: e.lead.fullName, href: `/admin/demandes/${e.lead.reference}` })),
      ...assigned.map((e) => ({ id: `ev-${e.id}`, kind: "lead_assigned" as const, at: e.createdAt, reference: e.lead.reference, name: e.lead.fullName, href: `/admin/demandes/${e.lead.reference}` })),
      ...paid.map((p) => ({
        id: `pay-${p.id}`,
        kind: "payment_received" as const,
        at: p.paidAt ?? now,
        reference: p.lead.reference,
        name: p.lead.fullName,
        amount: formatMoney(p.amount, p.currency as Currency),
        href: `/admin/demandes/${p.lead.reference}`,
      })),
      ...failed.map((p) => ({ id: `fail-${p.id}`, kind: "payment_failed" as const, at: p.updatedAt, reference: p.lead.reference, name: p.lead.fullName, href: `/admin/demandes/${p.lead.reference}` })),
    ];
    // Échéances d'abord (urgentes), puis le reste du plus récent au plus ancien.
    items.sort((a, b) => (a.kind === "hold_due") !== (b.kind === "hold_due") ? (a.kind === "hold_due" ? -1 : 1) : b.at.getTime() - a.at.getTime());
    const seen = user.notificationsSeenAt?.getTime() ?? 0;
    const unread = items.filter((i) => i.kind === "hold_due" || i.at.getTime() > seen).length;
    return { unread, seenAt: user.notificationsSeenAt, items: items.slice(0, 40) };
  }

  async markSeen(me: AuthContext) {
    await this.prisma.user.update({ where: { id: me.userId }, data: { notificationsSeenAt: new Date() } });
    return { ok: true };
  }
}
