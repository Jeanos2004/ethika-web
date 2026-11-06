import "server-only";
import { env } from "@/lib/env";
import type { LeadInput } from "@/lib/schemas/lead";

/**
 * Transmission au back-end des données validées.
 * - Phase 1 (pas d'API) : journalise un résumé SANS données personnelles et renvoie une référence.
 * - Phase 2 : POST vers l'API NestJS avec une clé interne, timeout et sans suivre les redirections.
 */

/** Demande validée, sans le pot de miel (Omit distributif : chaque variante garde ses champs). */
export type LeadPayload = LeadInput extends infer T ? (T extends unknown ? Omit<T, "website"> : never) : never;

function devReference() {
  return `ETH-DEV-${Date.now().toString(36).toUpperCase()}`;
}

async function postToApi(path: string, body: unknown): Promise<{ reference: string }> {
  if (!env.API_BASE_URL) throw new Error("API_BASE_URL absent");
  const res = await fetch(new URL(path, env.API_BASE_URL), {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-key": env.API_INTERNAL_KEY ?? "" },
    body: JSON.stringify(body),
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`API ${path}: HTTP ${res.status}`);
  const data = (await res.json()) as { reference?: unknown };
  if (typeof data.reference !== "string") throw new Error(`API ${path}: réponse invalide`);
  return { reference: data.reference };
}

export async function submitLead(lead: LeadPayload): Promise<{ reference: string }> {
  if (!env.API_BASE_URL) {
    const reference = devReference();
    console.info("[lead] reçu (mode sans API)", { reference, type: lead.type });
    return { reference };
  }
  return postToApi("/v1/leads", lead);
}

/** Inscription aux alertes promo. L'adresse n'est jamais journalisée. */
export async function submitNewsletter(input: { email: string }): Promise<{ reference: string }> {
  if (!env.API_BASE_URL) {
    const reference = devReference();
    console.info("[newsletter] inscription reçue (mode sans API)", { reference });
    return { reference };
  }
  return postToApi("/v1/newsletter", input);
}
