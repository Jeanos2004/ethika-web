import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isDemo } from "@/lib/demo/mode";
import { AdminShell } from "@/components/admin/AdminShell";
import { LeadsBoard } from "@/components/admin/LeadsBoard";

export const metadata: Metadata = { title: "Demandes" };

/* Back-office — demandes. Référence : design/maquettes/AdminDemandes.dc.html */
export default function AdminLeadsPage() {
  if (!isDemo) notFound();
  return (
    <AdminShell section="leads" title="Demandes">
      {/* useSearchParams (?ref=) : rendu client sous Suspense. */}
      <Suspense>
        <LeadsBoard />
      </Suspense>
    </AdminShell>
  );
}
