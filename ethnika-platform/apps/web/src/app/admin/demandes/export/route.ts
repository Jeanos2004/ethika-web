import { apiFetch } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";
import { leadListQuery } from "@/lib/admin/lead-query";

/** Export CSV des demandes avec les filtres de la liste (formules neutralisées et export audité par l'API). */
export async function GET(req: Request) {
  const { session } = await requireUser();
  const query = leadListQuery(Object.fromEntries(new URL(req.url).searchParams));
  query.delete("page");
  query.delete("pageSize");
  const res = await apiFetch(`/v1/leads/export.csv?${query.toString()}`, { session, timeoutMs: 60_000 });
  return new Response(res.body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": res.headers.get("content-disposition") ?? 'attachment; filename="ethnika-demandes.csv"',
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
