import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDemo } from "@/lib/demo/mode";
import { AdminShell } from "@/components/admin/AdminShell";
import { Dashboard } from "@/components/admin/Dashboard";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function AdminHomePage() {
  // Phase 1 : démonstration seulement. Phase 2 : session vérifiée côté serveur à chaque requête.
  if (!isDemo) notFound();
  return (
    <AdminShell section="dashboard" title="Tableau de bord">
      <Dashboard />
    </AdminShell>
  );
}
