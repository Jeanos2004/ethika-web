import "server-only";
import { headers } from "next/headers";

/**
 * IP du client derrière le proxy de l'hébergeur.
 * N'utiliser que l'en-tête posé par VOTRE proxy de confiance (ex. Vercel, Cloudflare) :
 * un client peut forger X-Forwarded-For s'il n'y a pas de proxy devant l'app.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
