import { apiFetch, ApiError } from "@/lib/api/server";
import { requireAdmin } from "@/lib/admin/session";

/*
 * Envoi d'une photo depuis le back-office (administrateurs) : le navigateur poste le fichier brut ici, le serveur du
 * site le relaie à l'API, qui reconnaît le type par son contenu, le borne à 5 Mo et l'enregistre.
 * Route plutôt que Server Action : pas de limite de 1 Mo sur le corps. Même origine exigée (en plus du cookie SameSite=Strict).
 */

const MAX = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Nom du fichier (encodé par le navigateur), à titre indicatif seulement. */
function fileName(header: string | null) {
  try {
    return header ? decodeURIComponent(header).slice(0, 160) : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  const { session } = await requireAdmin();
  const origin = req.headers.get("origin");
  // Derrière le reverse proxy, l'hôte public arrive dans X-Forwarded-Host.
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  if (!origin || new URL(origin).host !== host) return Response.json({ error: "forbidden" }, { status: 403 });
  const type = req.headers.get("content-type") ?? "";
  if (!TYPES.has(type)) return Response.json({ error: "uploadType" }, { status: 415 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX) return Response.json({ error: "uploadTooLarge" }, { status: 413 });
  const data = await req.arrayBuffer();
  if (data.byteLength > MAX) return Response.json({ error: "uploadTooLarge" }, { status: 413 });
  try {
    const res = await apiFetch("/v1/admin/media", { method: "POST", session, raw: { data, type, name: fileName(req.headers.get("x-file-name")) }, timeoutMs: 30_000 });
    const media = (await res.json()) as { url: string; width: number | null; height: number | null };
    return Response.json({ url: media.url, width: media.width, height: media.height }, { status: 201 });
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 502;
    return Response.json({ error: status === 413 ? "uploadTooLarge" : status === 400 ? "uploadType" : "unavailable" }, { status: status === 413 || status === 400 ? status : 502 });
  }
}
