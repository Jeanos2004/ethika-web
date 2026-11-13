import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { OfferForm } from "@/components/admin/live/OfferForm";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiOffer } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Modifier l'offre" };

export default async function AdminEditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, session } = await requireAdmin();
  const offer = (await api<ApiOffer[]>("/v1/admin/offers", { session })).find((o) => o.id === id);
  if (!offer) notFound();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  return (
    <AdminShell section="offers" title={offer.i18n.fr.title} live={await liveAccount(user, session)}>
      <Link href="/admin/offres" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("offersTitle")}
      </Link>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{offer.i18n.fr.title}</h1>
      <OfferForm offer={offer} />
    </AdminShell>
  );
}
