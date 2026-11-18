import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { OfferForm } from "@/components/admin/live/OfferForm";
import { Icon } from "@/components/ui/Icon";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Nouvelle offre" };

export default async function AdminNewOfferPage() {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  return (
    <AdminShell section="offers" title={t("offersNew")} live={await liveAccount(user, session)}>
      <Link href="/admin/offres" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("offersTitle")}
      </Link>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("offersNew")}</h1>
      <OfferForm />
    </AdminShell>
  );
}
