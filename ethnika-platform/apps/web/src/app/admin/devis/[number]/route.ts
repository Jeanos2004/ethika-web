import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";

/** Devis PDF (Puppeteer, côté API) relayé au navigateur : /admin/devis/DEV-2026-0001. */
export async function GET(_req: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  if (!/^DEV-\d{4}-\d{4,6}$/.test(number)) notFound();
  const { session } = await requireUser();
  const res = await apiFetch(`/v1/quotes/${number}/pdf`, { session, timeoutMs: 60_000 });
  return new Response(res.body, {
    headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${number}.pdf"`, "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
