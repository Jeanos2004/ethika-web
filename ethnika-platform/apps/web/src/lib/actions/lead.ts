"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { z } from "zod";
import { leadFormFields, leadSchema, proLeadType } from "@/lib/schemas/lead";
import { proRequestTypes } from "@/lib/schemas/search";
import { extractIata } from "@/content/airports";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { submitLead } from "@/lib/leads";

export type LeadFormState =
  | { status: "idle" }
  /** `message` et `fieldErrors` sont des clés de traduction (messages, espace « errors »). */
  | { status: "error"; message: "rateLimited" | "fixFields" | "sendFailed"; fieldErrors?: Record<string, string[] | undefined> }
  | { status: "success"; reference: string };

/** Vols supplémentaires d'un multi-destinations : champs répétés legFrom / legTo / legDate (4 au plus lus). */
function readLegs(formData: FormData) {
  const text = (k: string) => formData.getAll(k).slice(0, 5).map((v) => (typeof v === "string" ? v.trim() : ""));
  const [froms, tos, dates] = [text("legFrom"), text("legTo"), text("legDate")];
  return froms
    .map((from, i) => ({ from: extractIata(from) ?? from, to: extractIata(tos[i] ?? "") ?? tos[i] ?? "", date: dates[i] ?? "" }))
    .filter((leg) => leg.from || leg.to || leg.date);
}

/** Lit uniquement les champs connus ; une chaîne vide vaut « non renseigné ». */
function readForm(formData: FormData) {
  const raw: Record<string, unknown> = {};
  for (const key of leadFormFields) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") raw[key] = value;
  }
  raw.consent = formData.get("consent") === "on";
  // Billet : « Paris (CDG) » → « CDG » (la validation stricte reste celle du schéma).
  for (const key of ["from", "to"] as const) {
    if (typeof raw[key] === "string") raw[key] = extractIata(raw[key]) ?? raw[key];
  }
  if (raw.trip === "multi") raw.legs = readLegs(formData);
  // Demande professionnelle : le type enregistré découle de la catégorie choisie, pas d'un champ caché.
  if (typeof raw.request === "string" && Object.hasOwn(proRequestTypes, raw.request)) {
    raw.type = proLeadType(raw.request as keyof typeof proRequestTypes);
  }
  return raw;
}

/**
 * Server Action de référence pour TOUS les formulaires du site.
 * Ordre : limitation de débit → parsing strict → pot de miel → (Turnstile) → envoi → réponse sans fuite d'info.
 * Une Server Action est un endpoint public : ne jamais faire confiance au client.
 */
export async function sendLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const ip = await getClientIp();
  const limited = rateLimit(`lead:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return { status: "error", message: "rateLimited" };
  }

  const raw = readForm(formData);

  // Robot (pot de miel rempli) : on répond comme un succès pour ne pas l'aider.
  if (typeof raw.website === "string" && raw.website.length > 0) {
    return { status: "success", reference: "ETH-OK" };
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "fixFields", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // TODO(Turnstile) : vérifier le jeton côté serveur avec TURNSTILE_SECRET_KEY avant d'aller plus loin.

  let reference: string;
  try {
    const { website: _honeypot, ...lead } = parsed.data;
    void _honeypot;
    ({ reference } = await submitLead(lead));
  } catch (err) {
    console.error("[lead] échec d'envoi", err instanceof Error ? err.message : "inconnu");
    return { status: "error", message: "sendFailed" };
  }

  // Page de remerciement : valeur en liste blanche, chemin interne fixe (jamais d'URL fournie par le client).
  if (formData.get("after") === "merci") {
    redirect({ href: `/merci?ref=${encodeURIComponent(reference)}&type=${parsed.data.type}`, locale: await getLocale() });
  }
  return { status: "success", reference };
}
