"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { api } from "@/lib/api/server";
import { site } from "@/lib/site";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";

/*
 * Page de paiement publique (lien reçu par le client) : limitation de débit → Zod → API (clé interne) → redirection.
 * Le résultat d'un paiement n'est jamais déduit du retour du navigateur : la page relit l'état en base.
 */

const input = z.object({
  reference: z.string().regex(/^PAY-[A-HJ-NP-Z2-9]{6}$/),
  token: z.string().regex(/^[A-Za-z0-9_-]{30,100}$/),
  locale: z.enum(["fr", "en"]),
});

function read(formData: FormData) {
  return input.parse({ reference: formData.get("reference"), token: formData.get("token"), locale: formData.get("locale") });
}

function backTo(p: { reference: string; token: string; locale: string }, extra = "") {
  return `${p.locale === "en" ? "/en" : ""}/paiement/${p.reference}?t=${encodeURIComponent(p.token)}${extra}`;
}

/** « Payer maintenant » : demande l'adresse de paiement au prestataire puis y redirige (HTTPS ou ce site uniquement). */
export async function startCheckout(formData: FormData) {
  const p = read(formData);
  if (!rateLimit(`pay:${await getClientIp()}`, { limit: 20, windowMs: 10 * 60_000 }).ok) redirect(backTo(p, "&e=rate"));
  let url: URL;
  try {
    const res = await api<{ checkoutUrl: string }>(`/v1/public/payments/${p.reference}/checkout`, { method: "POST", body: { token: p.token }, timeoutMs: 20_000 });
    url = new URL(res.checkoutUrl);
  } catch {
    redirect(backTo(p, "&e=checkout"));
  }
  // Redirection autorisée vers un prestataire en HTTPS ou vers ce site (simulation), jamais ailleurs.
  if (url.protocol !== "https:" && url.origin !== new URL(site.url).origin) redirect(backTo(p, "&e=checkout"));
  redirect(url.toString());
}

/** Simulation du prestataire (recette uniquement : l'API la refuse si un vrai prestataire est configuré). */
export async function simulatePayment(formData: FormData) {
  const p = read(formData);
  const outcome = z.enum(["paid", "failed"]).parse(formData.get("outcome"));
  if (!rateLimit(`pay-sim:${await getClientIp()}`, { limit: 20, windowMs: 10 * 60_000 }).ok) redirect(backTo(p, "&e=rate"));
  await api(`/v1/public/payments/${p.reference}/simulate`, { method: "POST", body: { token: p.token, outcome } }).catch(() => undefined);
  redirect(backTo(p));
}
