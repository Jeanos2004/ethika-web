import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Dashboard } from "@/components/admin/Dashboard";
import { LiveDashboard } from "@/components/admin/live/LiveDashboard";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { adminMode, requireUser } from "@/lib/admin/session";
import type { ApiStats } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Tableau de bord" };

/** Démo : boîte locale du navigateur. Connecté : session vérifiée par l'API à chaque requête. */
export default async function AdminHomePage() {
  if (adminMode === "off") notFound();
  if (adminMode === "demo") {
    return (
      <AdminShell section="dashboard" title="Tableau de bord">
        <Dashboard />
      </AdminShell>
    );
  }
  const { user, session } = await requireUser();
  const stats = await api<ApiStats>("/v1/stats", { session });
  return (
    <AdminShell section="dashboard" title="Tableau de bord" live={await liveAccount(user, session, stats.kpis.toTreat)}>
      <LiveDashboard stats={stats} name={user.name} role={user.role} />
    </AdminShell>
  );
}
