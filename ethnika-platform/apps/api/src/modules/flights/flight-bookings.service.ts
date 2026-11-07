import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma, type FlightBookingStatus } from "../../generated/prisma/client";
import { ENV, type Env } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { MailService } from "../mail/mail.service";
import type { Passenger, PricedOffer } from "./flight-provider";
import { FlightsService } from "./flights.service";

const DAY = 24 * 3600_000;

/** Résumé du trajet stocké avec l'option : sans donnée personnelle. */
function itinerary(offer: PricedOffer) {
  return {
    airline: offer.owner.name,
    slices: offer.slices.map((s) => ({ origin: s.origin, destination: s.destination, departAt: s.departAt, arriveAt: s.arriveAt, stops: s.stops })),
    conditions: offer.conditions,
    baggage: offer.baggage,
  };
}

/**
 * Options de vol (PNR) posées par les agents, tracées dans notre base : rattachement à la demande du client,
 * synchronisation avec le fournisseur, annulation, alerte d'échéance de paiement. Aucune émission de billet ici :
 * l'émission se fera après paiement et validation humaine (hors périmètre tant que le paiement n'est pas choisi).
 */
@Injectable()
export class FlightBookingsService {
  private readonly logger = new Logger("FlightBookings");

  constructor(
    private readonly prisma: PrismaService,
    private readonly flights: FlightsService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async hold(offerId: string, passengers: Passenger[], ctx: { userId: string; leadRef?: string }) {
    const lead = ctx.leadRef ? await this.prisma.lead.findUnique({ where: { reference: ctx.leadRef }, select: { id: true } }) : null;
    if (ctx.leadRef && !lead) throw new NotFoundException({ error: "lead_not_found" });

    const priced = await this.flights.price(offerId);
    const order = await this.flights.hold(offerId, passengers);
    const booking = await this.prisma.flightBooking.create({
      data: {
        provider: this.flights.providerName,
        providerOrderId: order.id,
        bookingReference: order.bookingReference,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        payBefore: order.payBefore ? new Date(order.payBefore) : null,
        itinerary: itinerary(priced) as Prisma.InputJsonValue,
        passengerCount: passengers.length,
        leadId: lead?.id ?? null,
        createdBy: ctx.userId,
      },
    });
    if (lead) {
      await this.prisma.leadEvent.create({ data: { leadId: lead.id, kind: "flight_hold", actor: ctx.userId, note: `Option ${order.bookingReference ?? ""} · ${order.totalAmount} ${order.currency}`.trim() } });
    }
    await this.audit.log("flight.hold", { actorId: ctx.userId, target: booking.id, meta: { pnr: order.bookingReference, lead: ctx.leadRef } });
    return booking;
  }

  list(filter: { status?: FlightBookingStatus; leadRef?: string }) {
    return this.prisma.flightBooking.findMany({
      where: { ...(filter.status && { status: filter.status }), ...(filter.leadRef && { lead: { reference: filter.leadRef } }) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { lead: { select: { reference: true, fullName: true } } },
    });
  }

  /** Détail, resynchronisé avec le fournisseur (statut, échéance) : la compagnie peut avoir annulé l'option. */
  async get(id: string) {
    const booking = await this.prisma.flightBooking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException();
    if (booking.status === "cancelled") return booking;
    const order = await this.flights.getOrder(booking.providerOrderId);
    if (order.status !== booking.status || (order.payBefore ?? null) !== (booking.payBefore?.toISOString() ?? null)) {
      return this.prisma.flightBooking.update({ where: { id }, data: { status: order.status, payBefore: order.payBefore ? new Date(order.payBefore) : null, bookingReference: order.bookingReference } });
    }
    return booking;
  }

  async cancel(id: string, userId: string) {
    const booking = await this.prisma.flightBooking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException();
    if (booking.status !== "cancelled") {
      await this.flights.cancel(booking.providerOrderId);
      await this.audit.log("flight.cancelled", { actorId: userId, target: id, meta: { pnr: booking.bookingReference } });
    }
    return this.prisma.flightBooking.update({ where: { id }, data: { status: "cancelled" } });
  }

  /**
   * Options dont l'échéance de paiement arrive dans moins de 24 h : une alerte par option à l'agence.
   * Appelé par la maintenance horaire.
   */
  async alertDeadlines(now = new Date()) {
    const due = await this.prisma.flightBooking.findMany({
      where: { status: "held", deadlineNotifiedAt: null, payBefore: { not: null, lte: new Date(now.getTime() + DAY) } },
      include: { lead: { select: { reference: true } } },
    });
    if (!this.env.AGENCY_NOTIFY_EMAIL) return 0;
    for (const b of due) {
      await this.prisma.$transaction(async (tx) => {
        await this.mail.enqueue(tx, [
          {
            to: this.env.AGENCY_NOTIFY_EMAIL!,
            template: "agency",
            payload: {
              reference: b.bookingReference ?? b.providerOrderId,
              type: "Option à payer sous 24 h",
              summary: `${b.totalAmount} ${b.currency} · échéance ${b.payBefore?.toISOString().slice(0, 16).replace("T", " ")} UTC${b.lead ? ` · demande ${b.lead.reference}` : ""}`,
              backOfficeUrl: `${this.env.SITE_URL}/admin/demandes${b.lead ? `?ref=${b.lead.reference}` : ""}`,
            },
          },
        ]);
        await tx.flightBooking.update({ where: { id: b.id }, data: { deadlineNotifiedAt: now } });
      });
    }
    if (due.length) this.logger.log(`${due.length} alerte(s) d'échéance d'option envoyée(s)`);
    return due.length;
  }
}
