import { apiFetch } from "@/lib/api/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";

/** Reçu PDF d'un paiement encaissé, pour le client (jeton du lien de paiement), relayé depuis l'API. */
export async function GET(req: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!/^PAY-[A-HJ-NP-Z2-9]{6}$/.test(reference) || !/^[A-Za-z0-9_-]{30,100}$/.test(token)) return new Response("Introuvable", { status: 404 });
  if (!rateLimit(`receipt:${await getClientIp()}`, { limit: 20, windowMs: 10 * 60_000 }).ok) return new Response("Trop de demandes", { status: 429 });
  try {
    const res = await apiFetch(`/v1/public/payments/${reference}/receipt`, { method: "POST", body: { token }, timeoutMs: 60_000 });
    return new Response(res.body, {
      headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="recu-${reference}.pdf"`, "cache-control": "no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" },
    });
  } catch {
    return new Response("Reçu indisponible", { status: 404 });
  }
}
