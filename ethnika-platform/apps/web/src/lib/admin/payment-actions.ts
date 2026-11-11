"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";
import { quoteCurrencies, toMinorUnits, type QuoteCurrency } from "@/lib/admin/money";

/** Lien de paiement créé ou renouvelé : affiché une seule fois (le jeton n'est pas conservé en clair). */
export type PaymentLinkState = { error?: string; link?: string; reference?: string };

const quoteNumber = z.string().regex(/^DEV-\d{4}-\d{4,6}$/);
const leadRef = z.string().regex(/^ETH-[A-HJ-NP-Z2-9]{6}$/);

function errorKey(e: unknown) {
  if (e instanceof ApiError) {
    if (e.code === "payments_disabled") return "paymentsDisabled";
    if (e.code === "quote_already_paid") return "quotePaid";
    if (e.code === "amount_invalid" || e.status === 400) return "amountInvalid";
    if (e.code === "payment_closed") return "paymentClosed";
  }
  return "unavailable";
}

/** Lien pour le reste dû du devis, ou pour un acompte si un montant est saisi. */
export async function createPaymentLink(_prev: PaymentLinkState, formData: FormData): Promise<PaymentLinkState> {
  const { session } = await requireUser();
  const number = quoteNumber.safeParse(formData.get("quote"));
  const ref = leadRef.safeParse(formData.get("ref"));
  const currency = String(formData.get("currency"));
  const raw = String(formData.get("amount") ?? "").trim();
  if (!number.success || !ref.success || !(currency in quoteCurrencies)) return { error: "amountInvalid" };
  let amount: number | undefined;
  if (raw) {
    const minor = toMinorUnits(raw, currency as QuoteCurrency);
    if (minor === null || minor <= 0) return { error: "amountInvalid" };
    amount = minor;
  }
  try {
    const res = await api<{ link: string; payment: { reference: string } }>(`/v1/quotes/${number.data}/payments`, { method: "POST", session, body: amount ? { amount } : {} });
    revalidatePath(`/admin/demandes/${ref.data}`);
    revalidatePath("/admin/paiements");
    return { link: res.link, reference: res.payment.reference };
  } catch (e) {
    return { error: errorKey(e) };
  }
}

export async function renewPaymentLink(_prev: PaymentLinkState, formData: FormData): Promise<PaymentLinkState> {
  const { session } = await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "unavailable" };
  try {
    const res = await api<{ link: string }>(`/v1/payments/${id.data}/renew`, { method: "POST", session });
    revalidatePath("/admin/paiements");
    return { link: res.link };
  } catch (e) {
    return { error: errorKey(e) };
  }
}

export async function cancelPayment(formData: FormData) {
  const { session } = await requireUser();
  const id = z.uuid().parse(formData.get("id"));
  await api(`/v1/payments/${id}/cancel`, { method: "POST", session }).catch((e: unknown) => {
    if (!(e instanceof ApiError && e.status === 409)) throw e;
  });
  const ref = leadRef.safeParse(formData.get("ref"));
  if (ref.success) revalidatePath(`/admin/demandes/${ref.data}`);
  revalidatePath("/admin/paiements");
}
