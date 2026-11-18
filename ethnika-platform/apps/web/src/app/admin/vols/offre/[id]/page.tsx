import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { HoldForm } from "@/components/admin/live/HoldForm";
import { OfferSummary } from "@/components/admin/live/OfferSummary";
import { Icon } from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { adminMode, requireUser } from "@/lib/admin/session";
import type { PricedOffer } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Offre de vol" };

const count = (v: unknown, min: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= 9 ? n : min;
};

/** Offre choisie : prix confirmé par le fournisseur, conditions, puis saisie des passagers et pose de l'option. */
export default async function AdminOfferPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (adminMode !== "live") notFound();
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(id)) notFound();
  const { user, session } = await requireUser();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.flights" });
  const tErr = await getTranslations({ locale: "fr", namespace: "admin.live.errors" });
  const sp = await searchParams;
  const lead = typeof sp.lead === "string" && /^ETH-[A-HJ-NP-Z2-9]{6}$/.test(sp.lead) ? sp.lead : "";
  const pax = { adults: count(sp.adults, 1), children: count(sp.children, 0), infants: count(sp.infants, 0) };

  let offer: PricedOffer | undefined;
  let error: string | undefined;
  try {
    offer = await api<PricedOffer>(`/v1/flights/offers/${id}`, { session, timeoutMs: 180_000 });
  } catch (e) {
    error = e instanceof ApiError && e.status === 404 ? "offerExpired" : e instanceof ApiError && e.status === 422 ? "priceRefused" : "unavailable";
  }

  return (
    <AdminShell section="flights" title={t("offerTitle")} live={await liveAccount(user, session)}>
      <Link href="/admin/vols" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("backToSearch")}
      </Link>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("offerTitle")}</h1>
      {offer ? (
        <>
          <OfferSummary offer={offer} />
          {offer.holdable ? <HoldForm offerId={id} leadRef={lead} pax={pax} /> : <p className="rounded-2xl border border-line bg-white px-5 py-4 text-sm text-ink">{t("notHoldableHint")}</p>}
        </>
      ) : (
        <p role="alert" className="rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm text-red-700">
          {tErr(error ?? "unavailable")}
        </p>
      )}
    </AdminShell>
  );
}
