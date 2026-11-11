import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { Prisma, type PaymentStatus } from "../../generated/prisma/client";
import { ENV, type Env } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { randomToken, safeEqual, sha256 } from "../../common/security/crypto";
import { AuditService } from "../audit/audit.service";
import { MailService } from "../mail/mail.service";
import { formatMoney, type Currency } from "../quotes/money";
import { newPaymentReference } from "../leads/reference";
import { PAYMENT_PROVIDER, type PaymentProvider, type PaymentResult } from "./payment-provider";

const LINK_TTL_MS = 7 * 24 * 3600_000;

/** Ce qui peut être montré au client sur la page de paiement (aucune donnée de l'agence ni d'un autre client). */
export type PublicPayment = { reference: string; amount: string; currency: string; label: string; status: PaymentStatus; expiresAt: Date; paidAt: Date | null; leadReference: string; firstName: string; provider: string };

/**
 * Paiements des devis : création d'un lien sécurisé (jeton haché en base, 7 jours), redirection chez le prestataire,
 * prise en compte du résultat (idempotente), historique de la demande, confirmation de la demande une fois le devis
 * soldé, alerte de l'agence. Aucun encaissement n'est déclaré « payé » sans notification du prestataire.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger("Payments");

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    @Inject(ENV) private readonly env: Env,
  ) {}

  get enabled() {
    return this.provider.name !== "none";
  }

  private link(reference: string, token: string) {
    const url = new URL(`/paiement/${reference}`, this.env.SITE_URL);
    url.searchParams.set("t", token);
    return url.toString();
  }

  /** Lien de paiement pour un devis : total restant dû par défaut, ou acompte (montant inférieur). */
  async createForQuote(quoteNumber: string, input: { amount?: number; label?: string }, actorId: string) {
    if (!this.enabled) throw new ServiceUnavailableException({ error: "payments_disabled" });
    const quote = await this.prisma.quote.findUnique({ where: { number: quoteNumber }, include: { lead: { select: { id: true, reference: true } } } });
    if (!quote) throw new NotFoundException();
    const paid = await this.prisma.payment.aggregate({ where: { quoteId: quote.id, status: "paid" }, _sum: { amount: true } });
    const remaining = quote.totalAmount - (paid._sum.amount ?? 0n);
    if (remaining <= 0n) throw new ConflictException({ error: "quote_already_paid" });
    const amount = input.amount === undefined ? remaining : BigInt(input.amount);
    if (amount <= 0n || amount > remaining) throw new BadRequestException({ error: "amount_invalid" });

    const token = randomToken();
    const label = input.label?.trim() || (amount < remaining ? `Acompte · devis ${quote.number}` : `Devis ${quote.number}`);
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const payment = await this.prisma.$transaction(async (tx) => {
          const p = await tx.payment.create({
            data: { reference: newPaymentReference(), leadId: quote.lead.id, quoteId: quote.id, amount, currency: quote.currency, label, provider: this.provider.name, tokenHash: sha256(token), expiresAt: new Date(Date.now() + LINK_TTL_MS), createdBy: actorId },
          });
          await tx.leadEvent.create({ data: { leadId: quote.lead.id, kind: "payment_requested", actor: actorId, note: `${p.reference} · ${formatMoney(amount, quote.currency as Currency)}` } });
          return p;
        });
        await this.audit.log("payment.created", { actorId, target: payment.reference, meta: { quote: quote.number, lead: quote.lead.reference } });
        return { payment: serialize(payment), link: this.link(payment.reference, token) };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
        throw e;
      }
    }
    throw new ConflictException({ error: "reference_exhausted" });
  }

  /** Nouveau lien (jeton remplacé, délai prolongé) pour un paiement en attente : l'ancien lien ne fonctionne plus. */
  async renewLink(id: string, actorId: string) {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException();
    if (p.status !== "pending" && p.status !== "expired") throw new ConflictException({ error: "payment_closed" });
    const token = randomToken();
    await this.prisma.payment.update({ where: { id }, data: { tokenHash: sha256(token), status: "pending", expiresAt: new Date(Date.now() + LINK_TTL_MS) } });
    await this.audit.log("payment.created", { actorId, target: p.reference, meta: { renewed: true } });
    return { link: this.link(p.reference, token) };
  }

  async cancel(id: string, actorId: string) {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException();
    if (p.status !== "pending") throw new ConflictException({ error: "payment_closed" });
    await this.prisma.payment.update({ where: { id }, data: { status: "cancelled" } });
    await this.audit.log("payment.cancelled", { actorId, target: p.reference });
    return { ok: true };
  }

  list(filter: { status?: PaymentStatus; leadRef?: string }) {
    return this.prisma.payment
      .findMany({
        where: { ...(filter.status && { status: filter.status }), ...(filter.leadRef && { lead: { reference: filter.leadRef } }) },
        orderBy: { createdAt: "desc" },
        take: 500,
        include: { lead: { select: { reference: true, fullName: true } } },
      })
      .then((rows) => rows.map(serialize));
  }

  /** Lien client : jeton vérifié (temps constant via l'empreinte), sans quoi « introuvable » (aucune énumération). */
  private async byToken(reference: string, token: string) {
    const p = await this.prisma.payment.findUnique({ where: { reference }, include: { lead: { select: { reference: true, fullName: true } } } });
    if (!p || !safeEqual(p.tokenHash, sha256(token))) throw new NotFoundException();
    if (p.status === "pending" && p.expiresAt < new Date()) {
      await this.prisma.payment.update({ where: { id: p.id }, data: { status: "expired" } });
      p.status = "expired";
    }
    return p;
  }

  async publicView(reference: string, token: string): Promise<PublicPayment> {
    const p = await this.byToken(reference, token);
    return {
      reference: p.reference,
      amount: p.amount.toString(),
      currency: p.currency,
      label: p.label,
      status: p.status,
      expiresAt: p.expiresAt,
      paidAt: p.paidAt,
      leadReference: p.lead.reference,
      firstName: p.lead.fullName.split(/\s+/)[0] ?? "",
      provider: p.provider,
    };
  }

  /** Redirection vers le prestataire (seulement pour un paiement en attente). */
  async checkout(reference: string, token: string) {
    const p = await this.byToken(reference, token);
    if (p.status !== "pending") throw new ConflictException({ error: "payment_closed" });
    const returnUrl = this.link(p.reference, token);
    const { checkoutUrl, providerRef } = await this.provider.createCheckout({ reference: p.reference, amount: p.amount, currency: p.currency, label: p.label, returnUrl, token });
    if (providerRef && providerRef !== p.providerRef) await this.prisma.payment.update({ where: { id: p.id }, data: { providerRef } });
    return { checkoutUrl };
  }

  /**
   * Résultat d'un paiement (notification du prestataire, déjà authentifiée par l'appelant). Idempotent : un paiement
   * déjà clos n'est jamais modifié. Un devis soldé confirme la demande ; l'agence est prévenue par e-mail.
   */
  async applyResult(result: PaymentResult) {
    const p = await this.prisma.payment.findUnique({ where: { reference: result.reference }, include: { lead: { select: { id: true, reference: true, status: true } } } });
    if (!p) throw new NotFoundException();
    if (p.status !== "pending") return { status: p.status, changed: false };

    if (result.outcome === "failed") {
      await this.prisma.payment.update({ where: { id: p.id }, data: { status: "failed", providerRef: result.providerRef ?? p.providerRef, method: result.method } });
      await this.audit.log("payment.failed", { target: p.reference });
      return { status: "failed" as const, changed: true };
    }

    const confirmed = await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: p.id }, data: { status: "paid", paidAt: new Date(), providerRef: result.providerRef ?? p.providerRef, method: result.method } });
      const amount = formatMoney(p.amount, p.currency as Currency);
      await tx.leadEvent.create({ data: { leadId: p.lead.id, kind: "payment_received", actor: "system", note: `${p.reference} · ${amount}` } });
      let leadConfirmed = false;
      if (p.quoteId) {
        const quote = await tx.quote.findUnique({ where: { id: p.quoteId }, select: { totalAmount: true, number: true } });
        const paid = await tx.payment.aggregate({ where: { quoteId: p.quoteId, status: "paid" }, _sum: { amount: true } });
        if (quote && (paid._sum.amount ?? 0n) >= quote.totalAmount && p.lead.status !== "confirmed" && p.lead.status !== "cancelled") {
          await tx.lead.update({ where: { id: p.lead.id }, data: { status: "confirmed", events: { create: { kind: "status_changed", status: "confirmed", actor: "system", note: `Devis ${quote.number} soldé` } } } });
          leadConfirmed = true;
        }
      }
      if (this.env.AGENCY_NOTIFY_EMAIL) {
        await this.mail.enqueue(tx, [
          {
            to: this.env.AGENCY_NOTIFY_EMAIL,
            template: "agency",
            payload: { reference: p.lead.reference, type: "Paiement reçu", summary: `${p.reference} · ${amount} · ${p.label}`, backOfficeUrl: `${this.env.SITE_URL}/admin/demandes?ref=${p.lead.reference}` },
          },
        ]);
      }
      return leadConfirmed;
    });
    await this.audit.log("payment.paid", { target: p.reference, meta: { lead: p.lead.reference, leadConfirmed: confirmed } });
    this.logger.log(`paiement ${p.reference} encaissé${confirmed ? " · demande confirmée" : ""}`);
    return { status: "paid" as const, changed: true };
  }

  /** Simulation : contrôle le jeton du lien comme le ferait la signature d'un vrai prestataire. */
  async simulate(reference: string, token: string, outcome: "paid" | "failed") {
    if (this.provider.name !== "mock") throw new NotFoundException();
    const p = await this.byToken(reference, token);
    return this.applyResult({ reference: p.reference, outcome, providerRef: `MOCK-${p.reference}`, method: "simulation" });
  }

  /** Maintenance : liens en attente expirés. */
  async expire(now = new Date()) {
    const { count } = await this.prisma.payment.updateMany({ where: { status: "pending", expiresAt: { lt: now } }, data: { status: "expired" } });
    return count;
  }
}

function serialize<T extends { amount: bigint; tokenHash?: string }>(p: T) {
  const { tokenHash: _hash, ...rest } = p;
  void _hash;
  return { ...rest, amount: p.amount.toString() };
}
