import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { PhotoForm } from "@/components/admin/live/PhotoForm";
import { Icon } from "@/components/ui/Icon";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Nouvelle photo" };

export default async function AdminNewPhotoPage() {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.gallery" });
  return (
    <AdminShell section="gallery" title={t("new")} live={await liveAccount(user, session)}>
      <Link href="/admin/galerie" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("title")}
      </Link>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("new")}</h1>
      <PhotoForm />
    </AdminShell>
  );
}
