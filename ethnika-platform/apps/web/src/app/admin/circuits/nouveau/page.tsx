import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { CircuitForm } from "@/components/admin/live/CircuitForm";
import { Icon } from "@/components/ui/Icon";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Nouveau circuit" };

export default async function AdminNewCircuitPage() {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  return (
    <AdminShell section="circuits" title={t("circuitsNew")} live={await liveAccount(user, session)}>
      <Link href="/admin/circuits" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("circuitsTitle")}
      </Link>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("circuitsNew")}</h1>
      <CircuitForm />
    </AdminShell>
  );
}
