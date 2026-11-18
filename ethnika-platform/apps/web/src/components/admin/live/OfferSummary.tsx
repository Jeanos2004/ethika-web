import { useTranslations } from "next-intl";
import type { FlightOffer, PricedOffer } from "@/lib/admin/types";

const time = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

/** Heure locale de l'aéroport (les fournisseurs donnent des heures locales sans fuseau : affichées telles quelles). */
export function localTime(iso: string) {
  const local = /Z|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? iso : time.format(d);
}

function duration(minutes: number) {
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

/** Résumé d'une offre : trajets, compagnie, escales, prix ; conditions et bagages une fois le prix confirmé. */
export function OfferSummary({ offer, compact = false }: { offer: FlightOffer | PricedOffer; compact?: boolean }) {
  const t = useTranslations("admin.live.flights");
  const priced = "conditions" in offer ? offer : undefined;
  const yesNo = (v: boolean | null) => (v === null ? t("unknown") : v ? t("yes") : t("no"));
  return (
    <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6"}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-night">
          {offer.owner.name} <span className="font-mono text-xs text-muted">{offer.owner.iata}</span>
        </span>
        <strong className="text-xl font-semibold text-night tabular-nums">
          {offer.totalAmount} <span className="text-sm">{offer.currency}</span>
        </strong>
      </div>
      <ul className="flex flex-col gap-1.5">
        {offer.slices.map((s, i) => (
          <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 text-sm">
            <span className="min-w-0">
              <strong className="font-mono text-night">
                {s.origin} → {s.destination}
              </strong>{" "}
              <span className="text-muted">
                {localTime(s.departAt)} – {localTime(s.arriveAt)}
              </span>
            </span>
            <span className="text-xs whitespace-nowrap text-muted">
              {duration(s.durationMinutes)} · {s.stops === 0 ? t("direct") : t("stops", { count: s.stops })}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>{offer.holdable ? t("holdable") : t("instantOnly")}</span>
        {offer.payBefore && <span>{t("payBefore", { date: localTime(offer.payBefore) })}</span>}
        {priced && (
          <>
            <span>
              {t("refundable")} {yesNo(priced.conditions.refundable)}
            </span>
            <span>
              {t("changeable")} {yesNo(priced.conditions.changeable)}
            </span>
            {priced.baggage && <span>{priced.baggage}</span>}
          </>
        )}
      </div>
    </div>
  );
}
