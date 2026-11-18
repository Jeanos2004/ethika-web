"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";
import { quoteCurrencies, toMinorUnits, type QuoteCurrency } from "@/lib/admin/money";

export type QuoteState = { error?: string; created?: string };

const ref = z.string().regex(/^ETH-[A-HJ-NP-Z2-9]{6}$/);

/** Nouveau devis pour une demande : lignes libellé × quantité × prix unitaire, total calculé par l'API (BigInt). */
export async function createQuote(_prev: QuoteState, formData: FormData): Promise<QuoteState> {
  const { session } = await requireUser();
  const reference = ref.safeParse(formData.get("ref"));
  const currency = z.enum(Object.keys(quoteCurrencies) as [QuoteCurrency, ...QuoteCurrency[]]).safeParse(formData.get("currency"));
  const validUntil = z.iso.date().safeParse(formData.get("validUntil"));
  const notes = String(formData.get("notes") ?? "").trim();
  if (!reference.success || !currency.success || !validUntil.success || notes.length > 2000) return { error: "quoteForm" };

  const labels = formData.getAll("label").slice(0, 30).map((v) => String(v).trim());
  const quantities = formData.getAll("quantity").map((v) => Number(v));
  const prices = formData.getAll("unitPrice").map((v) => String(v));
  const lines = [];
  for (const [i, label] of labels.entries()) {
    if (!label && !prices[i]) continue; // ligne laissée vide
    const quantity = quantities[i] ?? 0;
    const unitAmount = toMinorUnits(prices[i] ?? "", currency.data);
    if (label.length < 2 || label.length > 160 || !Number.isInteger(quantity) || quantity < 1 || quantity > 999 || unitAmount === null) return { error: "quoteForm" };
    lines.push({ label, quantity, unitAmount });
  }
  if (lines.length === 0) return { error: "quoteForm" };

  let quote: { number: string };
  try {
    quote = await api<{ number: string }>(`/v1/leads/${reference.data}/quotes`, {
      method: "POST",
      session,
      body: { currency: currency.data, lines, validUntil: validUntil.data, ...(notes && { notes }) },
    });
  } catch (e) {
    return { error: e instanceof ApiError && e.status === 400 ? "quoteForm" : "unavailable" };
  }
  revalidatePath(`/admin/demandes/${reference.data}`);
  return { created: quote.number };
}
