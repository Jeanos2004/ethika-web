import { z } from "zod";

/*
 * Contrat de POST /v1/leads : la demande déjà validée par le site (apps/web/src/lib/schemas/lead.ts), revalidée ici —
 * l'API ne fait confiance à aucun appelant. Schémas `strict` : tout champ inconnu est refusé.
 */

const phone = z.string().trim().min(8).max(20).regex(/^\+?[0-9 ().-]+$/);
const email = z.email().max(200);
const fullName = z.string().trim().min(2).max(120);
const isoDate = z.iso.date();
const iata = z.string().regex(/^[A-Z]{3}$/);
const message = z.string().trim().max(3000);
const int = (min: number, max: number) => z.number().int().min(min).max(max);

const base = { fullName, phone, consent: z.literal(true), locale: z.enum(["fr", "en"]).optional() };

export const leadInput = z.discriminatedUnion("type", [
  z.strictObject({ ...base, type: z.literal("contact"), email, subject: z.string().trim().max(160).optional(), message: message.min(10) }),
  z.strictObject({
    ...base,
    type: z.literal("circuit"),
    email,
    circuit: z.string().regex(/^[a-z0-9-]{3,80}$/),
    travellers: int(1, 12),
    travelDate: isoDate.optional(),
    message: message.optional(),
  }),
  z
    .strictObject({
      ...base,
      type: z.literal("billet"),
      email,
      trip: z.enum(["rt", "ow", "multi"]),
      from: iata,
      to: iata,
      departDate: isoDate,
      returnDate: isoDate.optional(),
      adults: int(1, 9),
      children: int(0, 8),
      infants: int(0, 8),
      cabin: z.enum(["eco", "business", "first"]),
      legs: z.array(z.strictObject({ from: iata, to: iata, date: isoDate })).max(4).optional(),
      message: message.optional(),
    })
    .refine((v) => v.from !== v.to, { path: ["to"], message: "sameAirport" })
    .refine((v) => v.infants <= v.adults, { path: ["infants"], message: "infantsMax" }),
  z.strictObject({
    ...base,
    type: z.enum(["groupe", "pelerinage", "pro"]),
    email: email.optional(),
    request: z.enum(["groupe", "pelerinage", "entreprise", "ong"]),
    organisation: z.string().trim().max(120).optional(),
    travellers: int(1, 999),
    period: z.string().trim().max(60).optional(),
    message: message.min(10),
  }),
]);

export type LeadInput = z.infer<typeof leadInput>;

export const leadStatuses = ["new", "in_progress", "confirmed", "cancelled"] as const;

/** Liste du back-office : filtres et pagination bornée. */
export const leadQuery = z.strictObject({
  status: z.enum(leadStatuses).optional(),
  type: z.enum(["contact", "billet", "circuit", "groupe", "pelerinage", "pro"]).optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type LeadQuery = z.infer<typeof leadQuery>;

export const statusChange = z.strictObject({
  status: z.enum(leadStatuses),
  note: z.string().trim().max(1000).optional(),
});

export const newsletterInput = z.strictObject({ email, locale: z.enum(["fr", "en"]).optional() });

/** Sépare les colonnes communes des détails propres au type (stockés en JSON). */
export function splitLead(input: LeadInput) {
  const { type, fullName, phone, consent: _consent, locale, message, ...rest } = input;
  const email = "email" in rest ? rest.email : undefined;
  const { email: _email, ...details } = rest as typeof rest & { email?: string };
  return { type, fullName, phone, email, locale: locale ?? "fr", message, details };
}
