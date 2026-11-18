"use server";

import { z } from "zod";
import { api, ApiError } from "@/lib/api/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";

/** Résultat d'une confirmation ou d'une désinscription ; `error` est une clé (newsletter.token.errors). */
export type TokenState = { done?: boolean; error?: "rateLimited" | "invalid" | "unavailable" };

const input = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{30,100}$/), action: z.enum(["confirm", "unsubscribe"]) });

/**
 * Lien reçu par e-mail : l'action n'est déclenchée que par un clic sur le bouton de la page, jamais à l'ouverture
 * du lien (les antivirus de messagerie ouvrent les liens et confirmeraient ou désinscriraient à la place de la personne).
 */
export async function applyNewsletterToken(_prev: TokenState, formData: FormData): Promise<TokenState> {
  if (!rateLimit(`newsletter-token:${await getClientIp()}`, { limit: 10, windowMs: 10 * 60 * 1000 }).ok) return { error: "rateLimited" };
  const parsed = input.safeParse({ token: formData.get("token"), action: formData.get("action") });
  if (!parsed.success) return { error: "invalid" };
  try {
    await api(`/v1/newsletter/${parsed.data.action}`, { method: "POST", body: { token: parsed.data.token } });
    return { done: true };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return { error: "invalid" };
    console.error("[newsletter] lien e-mail non traité", e instanceof Error ? e.message : "inconnu");
    return { error: "unavailable" };
  }
}
