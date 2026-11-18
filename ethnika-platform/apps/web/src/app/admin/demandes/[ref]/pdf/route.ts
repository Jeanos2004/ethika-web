import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";

/** Récapitulatif PDF (Puppeteer, côté API) relayé au navigateur : la session reste dans le cookie HttpOnly. */
export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  if (!/^ETH-[A-HJ-NP-Z2-9]{6}$/.test(ref)) notFound();
  const { session } = await requireUser();
  const res = await apiFetch(`/v1/leads/${ref}/pdf`, { session, timeoutMs: 60_000 });
  return new Response(res.body, {
    headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${ref}.pdf"`, "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
