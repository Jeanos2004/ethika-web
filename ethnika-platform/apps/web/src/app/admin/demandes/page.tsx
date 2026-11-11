import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { LeadsBoard } from "@/components/admin/LeadsBoard";
import { LiveLeads, leadListQuery } from "@/components/admin/live/LiveLeads";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { adminMode, requireUser } from "@/lib/admin/session";
import type { ApiLeadList } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Demandes" };

/* Back-office — demandes. Référence : design/maquettes/AdminDemandes.dc.html */
export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (adminMode === "off") notFound();
  if (adminMode === "demo") {
    return (
      <AdminShell section="leads" title="Demandes">
        {/* useSearchParams (?ref=) : rendu client sous Suspense. */}
        <Suspense>
          <LeadsBoard />
        </Suspense>
      </AdminShell>
    );
  }
  const { user, session } = await requireUser();
  const query = leadListQuery(await searchParams);
  const list = await api<ApiLeadList>(`/v1/leads?${query.toString()}`, { session });
  return (
    <AdminShell section="leads" title="Demandes" live={await liveAccount(user, session, list.byStatus.new ?? 0)}>
      <LiveLeads list={list} query={query} />
    </AdminShell>
  );
}
