import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContentList } from "@/components/admin/live/ContentList";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiOffer } from "@/lib/admin/types";
import { getOffers } from "@/content/offers";
import { slugify } from "@/lib/slug";

export const metadata: Metadata = { title: "Offres" };

export default async function AdminOffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  const offers = await api<ApiOffer[]>("/v1/admin/offers", { session });
  const rows = offers.map((o) => ({
    id: o.id,
    slug: o.slug,
    title: o.i18n.fr.title,
    subtitle: `${t(`offerTypes.${o.type}`)} · ${o.i18n.fr.kicker}`,
    published: o.published,
    position: o.position,
    amount: o.priceAmount,
    currency: o.currency,
    image: o.imageUrl,
  }));
  return (
    <AdminShell section="offers" title={t("offersTitle")} live={await liveAccount(user, session)}>
      <ContentList kind="offers" rows={rows} newHref="/admin/offres/nouvelle" saved={(await searchParams).enregistre === "1"} importable={getOffers("fr").filter((o) => !offers.some((x) => x.slug === slugify(`${o.type}-${o.title}`).slice(0, 80))).length} />
    </AdminShell>
  );
}
