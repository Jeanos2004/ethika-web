import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { ENV, type Env } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { AgencyInfo } from "../pdf/templates/lead-summary";

const line = (max: number) => z.string().trim().max(max);

/** Coordonnées modifiables depuis Paramètres > Agence (administrateurs). */
export const agencyInput = z.strictObject({
  address: line(200).min(3),
  phone: line(40).min(6),
  whatsapp: line(40),
  email: z.email().max(200),
  licence: line(80),
  rccm: line(80),
  openingHours: line(200),
  paymentInstructions: line(1200).min(10),
  quoteTerms: line(1200),
});
export type AgencyInput = z.infer<typeof agencyInput>;

/** Coordonnées de l'agence (ligne unique) : lues par les PDF et le back-office, modifiées par un administrateur. */
@Injectable()
export class AgencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Ligne unique, créée avec les valeurs par défaut (placeholders) au premier accès. */
  async get() {
    return this.prisma.agencySettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  }

  async update(input: AgencyInput, actorId: string) {
    const row = await this.prisma.agencySettings.upsert({ where: { id: 1 }, update: { ...input, updatedBy: actorId }, create: { id: 1, ...input, updatedBy: actorId } });
    await this.audit.log("content.updated", { actorId, target: "agency", meta: { fields: Object.keys(input) } });
    return row;
  }

  /** Informations imprimées sur les PDF. */
  async pdfInfo(): Promise<AgencyInfo> {
    const a = await this.get();
    return {
      address: a.address,
      phone: a.phone,
      email: a.email,
      licence: a.licence,
      site: new URL(this.env.SITE_URL).host,
      paymentInstructions: a.paymentInstructions,
      quoteTerms: a.quoteTerms,
    };
  }
}
