import { clsx } from "clsx";
import { useTranslations } from "next-intl";

export type Airport = { code: string; city: string };

/** Largeurs des barres du code-barres décoratif (maquette Billetterie.dc.html). */
const widths = [3, 1.5, 4, 1.5, 3, 1.5, 2, 4, 1.5, 3, 1.5, 4, 2, 1.5, 3, 1.5, 4, 1.5];
const GAP = 2.5;
const bars = widths.map((w, i) => ({ w, x: widths.slice(0, i).reduce((sum, prev) => sum + prev + GAP, 0) }));

function Barcode() {
  return (
    <svg width="88" height="36" viewBox="0 0 88 36" aria-hidden="true" className="shrink-0 fill-sand">
      {bars.map(({ w, x }) => (
        <rect key={x} x={x} width={w} height="36" />
      ))}
    </svg>
  );
}

/**
 * Récapitulatif « carte d'embarquement » de la demande de billet (Billetterie.dc.html).
 * Présentationnel : la page Billetterie (lot 5) le met à jour en direct depuis le formulaire.
 */
export function BoardingPass({
  tripLabel,
  from,
  to,
  passengers,
  cabin,
  fare,
  className,
}: {
  tripLabel: string;
  from: Airport;
  to?: Airport;
  passengers: string;
  cabin: string;
  fare?: string;
  className?: string;
}) {
  const t = useTranslations("cards");
  return (
    <section aria-label={t("summary")} className={clsx("overflow-hidden rounded-[var(--radius-lg)] bg-night text-white shadow-ticket", className)}>
      <div className="flex flex-col gap-[22px] p-[26px]">
        <div className="flex justify-between font-mono text-xs text-on-dark">
          <span>{t("summaryTitle")}</span>
          <span>{tripLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 flex-col">
            <span className="font-mono text-[46px] leading-none">{from.code}</span>
            <span className="truncate text-[13px] text-on-dark">{from.city}</span>
          </div>
          <svg width="96" height="30" viewBox="0 0 96 30" aria-hidden="true" className="shrink-0 stroke-brand-gold">
            <path d="M4 24 Q48 -6 92 24" fill="none" strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" />
          </svg>
          <div className="flex min-w-0 flex-col items-end">
            <span className="font-mono text-[46px] leading-none text-brand-gold">{to?.code ?? "???"}</span>
            <span className="truncate text-[13px] text-on-dark">{to?.city ?? t("yourDestination")}</span>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <dt className="font-mono text-[11px] text-on-dark-muted">{t("passengers")}</dt>
            <dd className="font-bold">{passengers}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-mono text-[11px] text-on-dark-muted">{t("cabin")}</dt>
            <dd className="font-bold">{cabin}</dd>
          </div>
        </dl>
      </div>
      <div aria-hidden="true" className="border-t-2 border-dashed border-night-muted" />
      <div className="flex items-center justify-between gap-3 bg-night-deep px-[26px] py-5">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] text-on-dark-muted">{t("fare")}</span>
          <strong>{fare ?? t("fareOnQuote")}</strong>
        </div>
        <Barcode />
      </div>
    </section>
  );
}
