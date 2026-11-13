import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { CircuitForm } from "@/components/admin/live/CircuitForm";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiCircuit } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Modifier le circuit" };

export default async function AdminEditCircuitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, session } = await requireAdmin();
  const circuit = (await api<ApiCircuit[]>("/v1/admin/circuits", { session })).find((c) => c.id === id);
  if (!circuit) notFound();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  return (
    <AdminShell section="circuits" title={circuit.i18n.fr.title} live={await liveAccount(user, session)}>
      <Link href="/admin/circuits" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("circuitsTitle")}
      </Link>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{circuit.i18n.fr.title}</h1>
      <CircuitForm circuit={circuit} />
    </AdminShell>
  );
}
