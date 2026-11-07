import { z } from "zod";
import { currencies } from "./money";

const line = z.strictObject({
  label: z.string().trim().min(2).max(160),
  quantity: z.number().int().min(1).max(999),
  /** Prix unitaire en unités entières de la devise (GNF, ou centimes d'euro). */
  unitAmount: z.number().int().min(0).max(1_000_000_000_000),
});

export const quoteInput = z.strictObject({
  currency: z.enum(Object.keys(currencies) as [keyof typeof currencies, ...(keyof typeof currencies)[]]),
  lines: z.array(line).min(1).max(30),
  validUntil: z.iso.date().refine((d) => d >= new Date().toISOString().slice(0, 10), "datePast"),
  notes: z.string().trim().max(2000).optional(),
});

export type QuoteInput = z.infer<typeof quoteInput>;

export const QUOTE_NUMBER = /^DEV-\d{4}-\d{4,6}$/;
