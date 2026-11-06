import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";

export type PageSlot = number | "gap";

/** Pages à afficher : première, dernière, courante ± 1, avec des ellipses entre les trous. */
export function pageSlots(current: number, total: number): PageSlot[] {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const slots: PageSlot[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev > 1) slots.push("gap");
    slots.push(p);
  });
  return slots;
}

const circle = "flex size-11 items-center justify-center rounded-full font-mono";
const pill = "flex h-11 items-center rounded-full border-[1.5px] border-line-strong px-4 font-semibold hover:border-night";

/**
 * Pagination par liens (`?page=`) : fonctionne sans JS et reste indexable.
 * `hrefFor` construit l'URL d'une page en conservant les autres paramètres (filtre, recherche).
 */
export function Pagination({ page, totalPages, hrefFor, className }: { page: number; totalPages: number; hrefFor: (page: number) => string; className?: string }) {
  return totalPages <= 1 ? null : <PaginationNav page={page} totalPages={totalPages} hrefFor={hrefFor} className={className} />;
}

function PaginationNav({ page, totalPages, hrefFor, className }: { page: number; totalPages: number; hrefFor: (page: number) => string; className?: string }) {
  const t = useTranslations("ui");
  return (
    <nav aria-label={t("pagination")} className={className}>
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <li>
            <Link href={hrefFor(page - 1)} className={pill} rel="prev">
              <span aria-hidden="true">←&nbsp;</span>
              {t("previous")}
            </Link>
          </li>
        )}
        {pageSlots(page, totalPages).map((slot, i) =>
          slot === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 font-mono text-faint">
              …
            </li>
          ) : (
            <li key={slot}>
              {slot === page ? (
                <span aria-current="page" className={clsx(circle, "bg-night text-white")}>
                  <span className="sr-only">{t("page")} </span>
                  {slot}
                </span>
              ) : (
                <Link href={hrefFor(slot)} className={clsx(circle, "border-[1.5px] border-line-strong hover:border-night")}>
                  <span className="sr-only">{t("page")} </span>
                  {slot}
                </Link>
              )}
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <Link href={hrefFor(page + 1)} className={pill} rel="next">
              {t("next")}
              <span aria-hidden="true">&nbsp;→</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
