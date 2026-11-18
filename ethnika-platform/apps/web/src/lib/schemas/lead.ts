import { z } from "zod";
import { cabins, proRequestTypes, tripTypes } from "@/lib/schemas/search";

/**
 * Schéma d'une demande (contact, devis circuit, billet, groupe, pèlerinage, professionnel).
 * Partagé client/serveur. La validation serveur est la seule qui fasse foi.
 * Les messages d'erreur sont des CLÉS (messages/*.json, espace « errors ») traduites à l'affichage.
 * Phase 2 : déplacer dans packages/shared pour que l'API NestJS réutilise le même contrat.
 */

const phone = z
  .string()
  .trim()
  .min(8, "phoneShort")
  .max(20, "phoneLong")
  .regex(/^\+?[0-9 ().-]+$/, "phoneFormat");

const email = z.email("emailInvalid").max(200, "tooLong");
const fullName = z.string().trim().min(2, "nameRequired").max(120, "tooLong");
const consent = z.literal(true, { error: "consentRequired" });
// Pot de miel : doit rester vide (les robots le remplissent).
const website = z.string().max(0).optional();
const optionalMessage = z.string().trim().max(3000, "messageTooLong").optional();
const requiredMessage = z.string().trim().min(10, "messageTooShort").max(3000, "messageTooLong");

/** Date AAAA-MM-JJ, pas dans le passé. */
const futureDate = z.iso.date("dateInvalid").refine((d) => d >= new Date().toISOString().slice(0, 10), "datePast");

const iata = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "airportInvalid");

/** Entier borné ; `key` = préfixe de la clé d'erreur (ex. « travellers » → travellersRange). */
const intIn = (min: number, max: number, key: string) =>
  z.coerce.number({ error: `${key}Range` }).int(`${key}Range`).min(min, `${key}Range`).max(max, `${key}Range`);

export const leadTypes = ["contact", "billet", "circuit", "groupe", "pelerinage", "pro"] as const;
export type LeadType = (typeof leadTypes)[number];

const base = { fullName, phone, consent, website };

const contactLead = z.object({
  ...base,
  type: z.literal("contact"),
  email,
  subject: z.string().trim().max(160, "tooLong").optional(),
  message: requiredMessage,
});

const circuitLead = z.object({
  ...base,
  type: z.literal("circuit"),
  email,
  // Slug seulement : les circuits publiés depuis le back-office ne sont pas connus à la compilation.
  circuit: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "circuitUnknown").max(80),
  travellers: intIn(1, 12, "travellers"),
  travelDate: futureDate.optional(),
  message: optionalMessage,
});

const flightLead = z
  .object({
    ...base,
    type: z.literal("billet"),
    email,
    trip: z.enum(Object.keys(tripTypes) as [keyof typeof tripTypes, ...(keyof typeof tripTypes)[]], { error: "choiceInvalid" }),
    from: iata,
    to: iata,
    departDate: futureDate,
    returnDate: futureDate.optional(),
    adults: intIn(1, 9, "adults"),
    children: intIn(0, 8, "children"),
    infants: intIn(0, 8, "infants"),
    cabin: z.enum(Object.keys(cabins) as [keyof typeof cabins, ...(keyof typeof cabins)[]], { error: "choiceInvalid" }),
    /** Vols suivants d'un multi-destinations (le premier vol = from/to/departDate). */
    legs: z.array(z.object({ from: iata, to: iata, date: futureDate })).max(4, "legsMax").optional(),
    message: optionalMessage,
  })
  .superRefine((v, ctx) => {
    if (v.from === v.to) ctx.addIssue({ code: "custom", path: ["to"], message: "sameAirport" });
    if (v.trip === "rt" && !v.returnDate) ctx.addIssue({ code: "custom", path: ["returnDate"], message: "returnRequired" });
    if (v.returnDate && v.returnDate < v.departDate) ctx.addIssue({ code: "custom", path: ["returnDate"], message: "returnBeforeDepart" });
    if (v.infants > v.adults) ctx.addIssue({ code: "custom", path: ["infants"], message: "infantsMax" });
    if (v.trip === "multi" && !v.legs?.length) ctx.addIssue({ code: "custom", path: ["legs"], message: "legsRequired" });
    let previous = v.departDate;
    for (const leg of v.legs ?? []) {
      if (leg.date < previous) ctx.addIssue({ code: "custom", path: ["legs"], message: "legsOrder" });
      previous = leg.date;
    }
  });

const proLead = z.object({
  ...base,
  type: z.enum(["groupe", "pelerinage", "pro"]),
  email: email.optional(),
  request: z.enum(Object.keys(proRequestTypes) as [keyof typeof proRequestTypes, ...(keyof typeof proRequestTypes)[]], { error: "choiceInvalid" }),
  organisation: z.string().trim().max(120, "tooLong").optional(),
  travellers: intIn(1, 999, "travellers"),
  period: z.string().trim().max(60, "tooLong").optional(),
  message: requiredMessage,
});

export const leadSchema = z.discriminatedUnion("type", [contactLead, circuitLead, flightLead, proLead]);

export type LeadInput = z.infer<typeof leadSchema>;

/** Champs attendus dans le FormData (liste blanche : tout autre champ est ignoré). */
export const leadFormFields = [
  "type",
  "fullName",
  "email",
  "phone",
  "subject",
  "message",
  "website",
  "circuit",
  "travellers",
  "travelDate",
  "trip",
  "from",
  "to",
  "departDate",
  "returnDate",
  "adults",
  "children",
  "infants",
  "cabin",
  "request",
  "organisation",
  "period",
] as const;

/** Type de demande enregistré pour une demande professionnelle, selon la catégorie choisie. */
export function proLeadType(request: keyof typeof proRequestTypes): "groupe" | "pelerinage" | "pro" {
  return request === "groupe" ? "groupe" : request === "pelerinage" ? "pelerinage" : "pro";
}
