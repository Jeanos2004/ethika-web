import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { PhotoForm } from "@/components/admin/live/PhotoForm";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiPhoto } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Modifier la photo" };

export default async function AdminEditPhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, session } = await requireAdmin();
  const photo = (await api<ApiPhoto[]>("/v1/admin/gallery", { session })).find((p) => p.id === id);
  if (!photo) notFound();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.gallery" });
  return (
    <AdminShell section="gallery" title={photo.i18n.fr.alt} live={await liveAccount(user, session)}>
      <Link href="/admin/galerie" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("title")}
      </Link>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("edit")}</h1>
      <PhotoForm photo={photo} />
    </AdminShell>
  );
}
