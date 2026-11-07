import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { quoteTotal, type Currency } from "./money";
import type { QuoteInput } from "./quotes.schemas";

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Crée un devis pour une demande : numéro DEV-AAAA-NNNN séquentiel par année, total calculé exactement. */
  async create(reference: string, input: QuoteInput, userId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { reference }, select: { id: true } });
    if (!lead) throw new NotFoundException();
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 5; attempt++) {
      const count = await this.prisma.quote.count({ where: { number: { startsWith: `DEV-${year}-` } } });
      const number = `DEV-${year}-${String(count + 1 + attempt).padStart(4, "0")}`;
      try {
        const quote = await this.prisma.quote.create({
          data: {
            number,
            leadId: lead.id,
            currency: input.currency,
            lines: input.lines as unknown as Prisma.InputJsonValue,
            totalAmount: quoteTotal(input.lines),
            validUntil: new Date(`${input.validUntil}T00:00:00Z`),
            notes: input.notes,
            createdBy: userId,
          },
        });
        await this.prisma.leadEvent.create({ data: { leadId: lead.id, kind: "note", actor: userId, note: `Devis ${number}` } });
        await this.audit.log("quote.created", { actorId: userId, target: number, meta: { lead: reference } });
        return serialize(quote);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
        throw e;
      }
    }
    throw new ConflictException({ error: "quote_number_conflict" });
  }

  async listForLead(reference: string) {
    const lead = await this.prisma.lead.findUnique({ where: { reference }, select: { id: true } });
    if (!lead) throw new NotFoundException();
    const quotes = await this.prisma.quote.findMany({ where: { leadId: lead.id }, orderBy: { createdAt: "desc" } });
    return quotes.map(serialize);
  }

  /** Devis + demande + auteur, pour le PDF. */
  async forPdf(number: string) {
    const quote = await this.prisma.quote.findUnique({ where: { number }, include: { lead: { select: { reference: true, fullName: true, phone: true, email: true } } } });
    if (!quote) throw new NotFoundException();
    const author = await this.prisma.user.findUnique({ where: { id: quote.createdBy }, select: { name: true } });
    return {
      number: quote.number,
      currency: quote.currency as Currency,
      lines: quote.lines as { label: string; quantity: number; unitAmount: number }[],
      totalAmount: quote.totalAmount,
      validUntil: quote.validUntil,
      notes: quote.notes,
      createdAt: quote.createdAt,
      lead: quote.lead,
      agentName: author?.name ?? "ETHNIKA",
    };
  }
}

/** BigInt n'est pas sérialisable en JSON : le total part en chaîne. */
function serialize<T extends { totalAmount: bigint }>(q: T) {
  return { ...q, totalAmount: q.totalAmount.toString() };
}
