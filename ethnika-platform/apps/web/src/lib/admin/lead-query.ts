import { leadTypes } from "@/lib/schemas/lead";
import type { ApiLeadStatus } from "@/lib/admin/types";

const statuses: ApiLeadStatus[] = ["new", "in_progress", "confirmed", "cancelled"];
const assignees = ["me", "none"] as const;

/** Paramètres d'URL → requête API, en liste blanche (rien d'autre n'est transmis). */
export function leadListQuery(params: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const q = new URLSearchParams({ pageSize: "25" });
  if ((statuses as string[]).includes(one("status"))) q.set("status", one("status"));
  if ((leadTypes as readonly string[]).includes(one("type"))) q.set("type", one("type"));
  if ((assignees as readonly string[]).includes(one("assignee"))) q.set("assignee", one("assignee"));
  const text = one("q").trim().slice(0, 80);
  if (text) q.set("q", text);
  const page = Number(one("page"));
  if (Number.isInteger(page) && page > 1 && page <= 10_000) q.set("page", String(page));
  return q;
}
