import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { toCsv } from "../../common/csv";
import { newReference } from "./reference";
import { leadSummary } from "./summary";
import { ENV, type Env } from "../../config/env";
import { MailService, type OutboxItem } from "../mail/mail.service";
import { splitLead, type LeadInput, type LeadQuery } from "./lead.schemas";

const statusLabels = { new: "Nouvelle", in_progress: "En cours", confirmed: "Confirmée", cancelled: "Annulée" } as const;
const typeLabels = { contact: "Contact", billet: "Billetterie", circuit: "Circuit", groupe: "Groupe", pelerinage: "Pèlerinage", pro: "Entreprise / ONG" } as const;

@Injectable()
export class LeadsService {
  private readonly logger = new Logger("Leads");

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Enregistre une demande et son historique initial. La référence est retirée en cas (rarissime) de collision. */
  async create(input: LeadInput, source = "site") {
    const data = splitLead(input);
    for (let attempt = 0; attempt < 5; attempt++) {
      const reference = newReference();
      try {
        const lead = await this.prisma.$transaction(async (tx) => {
          const created = await tx.lead.create({
          data: {
            reference,
            source,
            type: data.type,
            fullName: data.fullName,
            phone: data.phone,
            email: data.email,
            locale: data.locale,
            message: data.message,
            details: data.details as Prisma.InputJsonValue,
            events: { create: [{ kind: "received", actor: source }] },
          },
          select: { reference: true, type: true },
          });
          await this.mail.enqueue(tx, this.notifications(created.reference, data));
          return created;
        });
        // Journal sans donnée personnelle : référence et type uniquement.
        this.logger.log(`demande ${lead.reference} (${lead.type})`);
        return { reference: lead.reference };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
        throw e;
      }
    }
    throw new ConflictException("reference_exhausted");
  }

  /** E-mails déclenchés par une nouvelle demande : accusé au client (s'il a donné un e-mail) et notification à l'agence. */
  private notifications(reference: string, data: ReturnType<typeof splitLead>): OutboxItem[] {
    const locale = data.locale === "en" ? "en" : "fr";
    const { summary, route } = leadSummary(data.type, data.details as Record<string, unknown>, locale);
    const items: OutboxItem[] = [];
    if (data.email) {
      items.push({ to: data.email, template: "ack", payload: { reference, firstName: data.fullName.split(/\s+/)[0] ?? data.fullName, locale, summary, route: route?.from && route.to ? route : undefined, siteUrl: this.env.SITE_URL } });
    }
    if (this.env.AGENCY_NOTIFY_EMAIL) {
      items.push({ to: this.env.AGENCY_NOTIFY_EMAIL, template: "agency", payload: { reference, type: typeLabels[data.type], summary: leadSummary(data.type, data.details as Record<string, unknown>, "fr").summary, backOfficeUrl: `${this.env.SITE_URL}/admin/demandes?ref=${reference}` } });
    }
    return items;
  }

  private where(q: Omit<LeadQuery, "page" | "pageSize">, meId?: string): Prisma.LeadWhereInput {
    const text = q.q?.trim();
    const assignee = q.assignee === "me" ? meId : q.assignee === "none" ? null : q.assignee;
    return {
      ...(q.assignee !== undefined && { assignedToId: assignee ?? null }),
      ...(q.status && { status: q.status }),
      ...(q.type && { type: q.type }),
      ...(text && {
        OR: [
          { reference: { contains: text.toUpperCase() } },
          { fullName: { contains: text, mode: "insensitive" } },
          { phone: { contains: text } },
          { email: { contains: text, mode: "insensitive" } },
        ],
      }),
    };
  }

  async list(q: LeadQuery, meId?: string) {
    const where = this.where(q, meId);
    const [total, items, counts] = await this.prisma.$transaction([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: { reference: true, type: true, status: true, source: true, fullName: true, phone: true, email: true, details: true, createdAt: true, assignedTo: { select: { id: true, name: true } } },
      }),
      this.prisma.lead.groupBy({ by: ["status"], orderBy: { status: "asc" }, _count: { _all: true } }),
    ]);
    const byStatus = Object.fromEntries(counts.map((c) => [c.status, typeof c._count === "object" ? (c._count._all ?? 0) : 0]));
    return { total, page: q.page, pageSize: q.pageSize, byStatus, items };
  }

  async get(reference: string) {
    const lead = await this.prisma.lead.findUnique({ where: { reference }, include: { events: { orderBy: { createdAt: "asc" } }, assignedTo: { select: { id: true, name: true } } } });
    if (!lead) throw new NotFoundException();
    return lead;
  }

  async setStatus(reference: string, status: (typeof statusKeys)[number], actor: string, note?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { reference }, select: { id: true, status: true } });
    if (!lead) throw new NotFoundException();
    if (lead.status === status && !note) return this.get(reference);
    await this.prisma.lead.update({
      where: { id: lead.id },
      data: { status, events: { create: { kind: "status_changed", status, actor, note } } },
    });
    return this.get(reference);
  }

  /** Attribue la demande à un agent actif (ou la libère avec null) ; historisé. */
  async assign(reference: string, userId: string | null, actor: string) {
    const lead = await this.prisma.lead.findUnique({ where: { reference }, select: { id: true } });
    if (!lead) throw new NotFoundException();
    let label = "Non attribuée";
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, disabled: true } });
      if (!user || user.disabled) throw new BadRequestException({ error: "assignee_invalid" });
      label = user.name;
    }
    await this.prisma.lead.update({ where: { id: lead.id }, data: { assignedToId: userId, events: { create: { kind: "assigned", actor, note: label } } } });
    return this.get(reference);
  }

  /** Note interne (jamais visible du client) ; historisée. */
  async addNote(reference: string, note: string, actor: string) {
    const lead = await this.prisma.lead.findUnique({ where: { reference }, select: { id: true } });
    if (!lead) throw new NotFoundException();
    await this.prisma.leadEvent.create({ data: { leadId: lead.id, kind: "note", actor, note } });
    return this.get(reference);
  }

  /** Export CSV des demandes filtrées (5 000 lignes maximum) ; l'appelant journalise l'export (audit). */
  async exportCsv(q: Omit<LeadQuery, "page" | "pageSize">, meId?: string) {
    const items = await this.prisma.lead.findMany({ where: this.where(q, meId), orderBy: { createdAt: "desc" }, take: 5000 });
    const csv = toCsv(
      ["Référence", "Reçue le", "Statut", "Type", "Client", "Téléphone", "E-mail", "Détails", "Message", "Source"],
      items.map((l) => [l.reference, l.createdAt.toISOString(), statusLabels[l.status], typeLabels[l.type], l.fullName, l.phone, l.email ?? "", JSON.stringify(l.details), l.message ?? "", l.source]),
    );
    return { csv, count: items.length };
  }


}

const statusKeys = ["new", "in_progress", "confirmed", "cancelled"] as const;
