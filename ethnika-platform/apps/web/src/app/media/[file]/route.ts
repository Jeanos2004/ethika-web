import { env } from "@/lib/env";

/*
 * Images envoyées depuis le back-office (stockées par l'API), servies sous /media/<id>.<ext>.
 * Identifiant en liste blanche (UUID), clé interne côté serveur uniquement, cache long : une image ne change jamais
 * (un nouvel envoi crée un nouvel identifiant).
 */

const FILE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp)$/;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const match = FILE.exec((await params).file);
  if (!match || !env.API_BASE_URL) return new Response(null, { status: 404 });
  try {
    const res = await fetch(new URL(`/v1/public/media/${match[1]}`, env.API_BASE_URL), {
      headers: { "x-internal-key": env.API_INTERNAL_KEY ?? "" },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !TYPES.has(type)) return new Response(null, { status: res.status === 404 ? 404 : 502 });
    return new Response(res.body, {
      headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
