import "server-only";
import type { DemoLead } from "@/lib/demo/store";
import { digest } from "@/lib/demo/summary";
import { api } from "@/lib/api/server";
import type { LiveAccount } from "@/components/admin/AdminShell";
import type { AdminUser } from "@/lib/admin/session";
import type { ApiLeadList, ApiLeadRow, ApiNotifications } from "@/lib/admin/types";
import { uiStatus } from "@/lib/admin/types";

/** Compte affiché dans la coquille, avec le nombre de nouvelles demandes (pastille de navigation). */
export async function liveAccount(user: AdminUser, session: string, newCount?: number): Promise<LiveAccount> {
  const [count, notifications] = await Promise.all([
    newCount ?? api<ApiLeadList>("/v1/leads?status=new&pageSize=1", { session }).then((l) => l.total),
    // La cloche ne doit jamais empêcher une page de s'afficher.
    api<ApiNotifications>("/v1/notifications", { session }).catch(() => ({ unread: 0, items: [] })),
  ]);
  return { name: user.name, role: user.role, newCount: count, notifications };
}

/** Résumé d'une ligne de l'API avec les mêmes règles que la démo (trajet, circuit, effectif…). */
export function liveDigest(lead: ApiLeadRow & { message?: string | null }) {
  const fields = Object.fromEntries(Object.entries(lead.details ?? {}).flatMap(([k, v]) => (typeof v === "string" || typeof v === "number" ? [[k, String(v)]] : [])));
  return digest({
    ref: lead.reference,
    type: lead.type,
    name: lead.fullName,
    phone: lead.phone,
    email: lead.email ?? undefined,
    fields: { ...fields, ...(lead.message && { message: lead.message }) },
    createdAt: lead.createdAt,
    status: uiStatus[lead.status],
    source: "site",
    history: [],
  } satisfies DemoLead);
}
