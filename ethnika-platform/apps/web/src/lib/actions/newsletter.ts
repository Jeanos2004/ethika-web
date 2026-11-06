"use server";

import { z } from "zod";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { submitNewsletter } from "@/lib/leads";

/** `message` : clé de traduction (messages, espace « errors »). */
export type NewsletterState = { status: "idle" } | { status: "error"; message: "rateLimited" | "emailInvalid" | "subscribeFailed" } | { status: "success" };

const schema = z.object({
  email: z.email("emailInvalid").max(200, "tooLong"),
  website: z.string().max(0).optional(),
});

/**
 * Inscription aux alertes promo (Offres.dc.html § NEWSLETTER).
 * Même patron que sendLead : limitation de débit → parsing strict → pot de miel → envoi → réponse générique.
 */
export async function subscribeNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const ip = await getClientIp();
  if (!rateLimit(`newsletter:${ip}`, { limit: 3, windowMs: 10 * 60 * 1000 }).ok) {
    return { status: "error", message: "rateLimited" };
  }

  const website = formData.get("website");
  if (typeof website === "string" && website.length > 0) return { status: "success" };

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { status: "error", message: "emailInvalid" };

  try {
    await submitNewsletter({ email: parsed.data.email });
    return { status: "success" };
  } catch (err) {
    console.error("[newsletter] échec d'envoi", err instanceof Error ? err.message : "inconnu");
    return { status: "error", message: "subscribeFailed" };
  }
}
