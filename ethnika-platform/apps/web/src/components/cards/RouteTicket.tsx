import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";

/**
 * Billet de route « CKY → XXX » avec talon or (Home2 § bande billetterie).
 * Mène au formulaire de billetterie prérempli avec la destination.
 */
export function RouteTicket({
  from = { code: "CKY", city: "Conakry" },
  to,
  price,
  compact,
  tone = "dark",
  className,
}: {
  from?: { code: string; city: string };
  to: { code: string; city: string };
  price?: string;
  compact?: boolean;
  /** « light » : billet blanc à talon nuit (Billetterie § ROUTES). */
  tone?: "dark" | "light";
  className?: string;
}) {
  const light = tone === "light";
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const shownPrice = price ?? tc("priceShort");
  return (
    <Link
      href={`/billetterie?vers=${to.code}#demande`}
      aria-label={t("routeLabel", { from: from.city, to: to.city, price: shownPrice })}
      className={clsx(
        "flex overflow-hidden rounded-[var(--radius-panel)] transition-transform motion-safe:hover:-translate-y-0.5",
        light ? "bg-white text-night shadow-md" : "bg-night text-white shadow-[0_20px_40px_rgb(18_24_21/0.2)]",
        compact && "rounded-2xl",
        className,
      )}
    >
      <span className={clsx("flex flex-1 items-center justify-between gap-2.5", compact ? "p-3.5" : light ? "p-5" : "px-5 py-[18px]")}>
        <span className="flex flex-col">
          <span className={clsx("font-mono", compact ? "text-[22px]" : "text-[26px]")}>{from.code}</span>
          {!compact && <span className={clsx(light ? "text-xs text-subtle" : "text-[11px] text-on-dark-muted")}>{from.city}</span>}
        </span>
        {!compact && (
          <svg width="60" height="20" viewBox="0 0 60 20" aria-hidden="true" className="shrink-0 stroke-brand-gold">
            <path d="M2 16 Q30 -4 58 16" fill="none" strokeWidth="2" strokeDasharray="2 4" strokeLinecap="round" />
          </svg>
        )}
        <span className="flex flex-col items-end">
          <span className={clsx("font-mono", compact ? "text-[22px]" : "text-[26px]")}>{to.code}</span>
          {!compact && <span className={clsx(light ? "text-xs text-subtle" : "text-[11px] text-on-dark-muted")}>{to.city}</span>}
        </span>
      </span>
      <span
        className={clsx(
          "flex shrink-0 flex-col justify-center border-l-2 border-dashed p-3",
          light ? "w-24 border-cream bg-night text-white" : "w-[92px] border-night bg-brand-gold text-ink",
        )}
      >
        <span className={clsx("text-[10px]", light && "text-on-dark")}>{tc("from")}</span>
        <strong className={clsx("text-[13px]", light && "text-brand-gold")}>{shownPrice}</strong>
      </span>
    </Link>
  );
}
