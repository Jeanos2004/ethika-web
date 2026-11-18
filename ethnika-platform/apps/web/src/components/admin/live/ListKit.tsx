import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/ui/Icon";

/*
 * Briques communes des pages de liste du back-office (circuits, offres, utilisateurs, journal) :
 * en-tête, indicateurs, barre de filtres en GET, puces de filtre, lignes, pagination numérotée, état vide.
 * Tout est rendu côté serveur ; les filtres et la page vivent dans l'URL (partageable, bouton Retour fiable).
 */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex max-w-2xl flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{title}</h1>
        {subtitle && <p className="text-sm leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</ul>;
}

export function KpiTile({ label, value, note, icon, href, tone = "default" }: { label: string; value: ReactNode; note?: string; icon: IconName; href?: string; tone?: "default" | "alert" | "good" }) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2 text-[13px] text-muted">
        {label}
        <span className={clsx("flex size-8 items-center justify-center rounded-lg", tone === "alert" ? "bg-red-50 text-red-700" : tone === "good" ? "bg-green-50 text-green-700" : "bg-sand text-night")}>
          <Icon name={icon} size={15} />
        </span>
      </span>
      <strong className="text-[28px] leading-none font-semibold tracking-tight text-night tabular-nums">{value}</strong>
      {note && <span className={clsx("text-xs", tone === "alert" ? "font-semibold text-red-700" : "text-muted")}>{note}</span>}
    </>
  );
  const cls = "flex h-full flex-col gap-2.5 rounded-2xl border border-line bg-white px-4 py-4";
  return <li>{href ? <Link href={href} className={clsx(cls, "transition-shadow hover:border-line-strong hover:shadow-sm")}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
}

/** Barre de recherche (formulaire GET) ; les autres filtres actifs sont conservés en champs cachés. */
export async function SearchBar({ action, query, keep, placeholder, children }: { action: string; query: string; keep: Record<string, string | undefined>; placeholder: string; children?: ReactNode }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.list" });
  return (
    <form method="get" action={action} role="search" className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{placeholder}</span>
          <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle" />
          <input name="q" defaultValue={query} maxLength={80} placeholder={placeholder} className="h-11 w-full rounded-xl border border-line-strong bg-white pr-3.5 pl-10 text-[15px] outline-none focus:border-night" />
        </label>
        <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-night px-5 text-sm font-semibold text-white hover:bg-night-2">
          {t("search")}
        </button>
      </div>
      {children && <div className="flex flex-wrap items-center gap-1.5">{children}</div>}
    </form>
  );
}

/** Puce de filtre (lien) : active = fond nuit. */
export function FilterChip({ href, active, children, count }: { href: string; active: boolean; children: ReactNode; count?: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={clsx(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold",
        active ? "border-night bg-night text-white" : "border-line-strong bg-white text-night hover:border-night",
      )}
    >
      {children}
      {count !== undefined && <span className={clsx("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-white/20" : "bg-sand")}>{count}</span>}
    </Link>
  );
}

export function ListCard({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      {children}
      {footer && <div className="border-t border-line bg-cream/60 px-4 py-3 sm:px-5">{footer}</div>}
    </section>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-sand text-night">
        <Icon name={icon} size={22} />
      </span>
      <strong className="text-night">{title}</strong>
      {text && <p className="max-w-sm text-sm text-muted">{text}</p>}
      {action}
    </div>
  );
}

/** Pagination numérotée : première, dernière, voisines de la page courante ; résumé « 11–20 sur 47 ». */
export async function Pager({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (p: number) => string }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.list" });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...keep].sort((a, b) => a - b);
  const items = sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1]! > 1 ? [null, p] : [p]));
  return (
    <nav aria-label={t("pagination")} className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted tabular-nums">{t("range", { from, to, total })}</span>
      {pages > 1 && (
        <span className="flex items-center gap-1">
          <PagerLink href={page > 1 ? hrefFor(page - 1) : undefined} label={t("previous")} icon="chevronLeft" />
          {items.map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1 text-muted">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={hrefFor(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={t("page", { page: p, pages })}
                className={clsx("flex size-9 items-center justify-center rounded-full text-sm font-semibold tabular-nums", p === page ? "bg-night text-white" : "text-night hover:bg-sand")}
              >
                {p}
              </Link>
            ),
          )}
          <PagerLink href={page < pages ? hrefFor(page + 1) : undefined} label={t("next")} icon="chevronRight" />
        </span>
      )}
    </nav>
  );
}

function PagerLink({ href, label, icon }: { href?: string; label: string; icon: IconName }) {
  return href ? (
    <Link href={href} aria-label={label} className="flex size-9 items-center justify-center rounded-full text-night hover:bg-sand">
      <Icon name={icon} size={16} />
    </Link>
  ) : (
    <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full text-line-strong">
      <Icon name={icon} size={16} />
    </span>
  );
}

/** Paramètres d'URL → valeur simple ; page bornée. */
export function readParams(params: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string).slice(0, 80) : "");
  const page = Number(one("page"));
  return { one, page: Number.isInteger(page) && page > 1 && page <= 10_000 ? page : 1 };
}

/** Construit une URL de liste en ne gardant que les paramètres non vides. */
export function listHref(base: string, params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams(Object.entries(params).flatMap(([k, v]) => (v === undefined || v === "" || (k === "page" && v === 1) ? [] : [[k, String(v)]])));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}
