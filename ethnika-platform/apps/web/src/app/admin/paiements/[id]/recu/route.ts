import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";

/** Reçu PDF d'un paiement encaissé, depuis le back-office. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { session } = await requireUser();
  const res = await apiFetch(`/v1/payments/${id}/receipt`, { session, timeoutMs: 60_000 });
  return new Response(res.body, {
    headers: { "content-type": "application/pdf", "content-disposition": res.headers.get("content-disposition") ?? "inline", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
