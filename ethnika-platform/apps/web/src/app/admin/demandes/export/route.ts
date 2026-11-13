import { apiFetch } from "@/lib/api/server";
import { requireUser } from "@/lib/admin/session";
import { leadListQuery } from "@/lib/admin/lead-query";

const formats = {
  xlsx: { path: "export.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  csv: { path: "export.csv", type: "text/csv; charset=utf-8" },
} as const;

/** Export des demandes filtrées (Excel mis en forme ou CSV), relayé depuis l'API qui l'audite. */
export async function GET(req: Request) {
  const { session } = await requireUser();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const format = params.format === "csv" ? formats.csv : formats.xlsx;
  const query = leadListQuery(params);
  query.delete("page");
  query.delete("pageSize");
  const res = await apiFetch(`/v1/leads/${format.path}?${query.toString()}`, { session, timeoutMs: 60_000 });
  return new Response(res.body, {
    headers: {
      "content-type": format.type,
      "content-disposition": res.headers.get("content-disposition") ?? `attachment; filename="ethnika-demandes.${format === formats.csv ? "csv" : "xlsx"}"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
