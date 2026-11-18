import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ManualLeadForm } from "@/components/admin/live/ManualLeadForm";
import { Icon } from "@/components/ui/Icon";
import { liveAccount } from "@/lib/admin/account";
import { adminMode, requireUser } from "@/lib/admin/session";
import { siteCircuits } from "@/lib/content-source";

export const metadata: Metadata = { title: "Nouvelle demande" };

/** Demande reçue hors du site (téléphone, WhatsApp, agence), saisie par un agent. */
export default async function AdminNewLeadPage() {
  if (adminMode !== "live") notFound();
  const { user, session } = await requireUser();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.manual" });
  const circuits = (await siteCircuits("fr")).map((c) => ({ slug: c.slug, title: c.title }));
  return (
    <AdminShell section="leads" title={t("title")} live={await liveAccount(user, session)}>
      <Link href="/admin/demandes" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("back")}
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>
      <ManualLeadForm circuits={circuits} />
    </AdminShell>
  );
}
