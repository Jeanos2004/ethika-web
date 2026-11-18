import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContentList } from "@/components/admin/live/ContentList";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiCircuit } from "@/lib/admin/types";
import { getCircuits } from "@/content/circuits";

export const metadata: Metadata = { title: "Circuits" };

export default async function AdminCircuitsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  const circuits = await api<ApiCircuit[]>("/v1/admin/circuits", { session });
  const rows = circuits.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.i18n.fr.title,
    subtitle: `${c.i18n.fr.place} · ${c.i18n.fr.durationLabel}`,
    category: c.theme,
    categoryLabel: t(`themes.${c.theme}`),
    noDeparture: c.departures.length === 0,
    updatedAt: c.updatedAt,
    published: c.published,
    position: c.position,
    amount: c.priceFrom,
    currency: c.currency,
    image: c.imageUrl,
  }));
  return (
    <AdminShell section="circuits" title={t("circuitsTitle")} live={await liveAccount(user, session)}>
      <ContentList kind="circuits" rows={rows} newHref="/admin/circuits/nouveau" params={await searchParams} importable={getCircuits("fr").filter((c) => !circuits.some((x) => x.slug === c.slug)).length} />
    </AdminShell>
  );
}
