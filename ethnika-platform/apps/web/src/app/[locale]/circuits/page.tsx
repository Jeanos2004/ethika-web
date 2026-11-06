import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localePrefix, type Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { circuitLabels, getCircuits, type Circuit, type CircuitTheme } from "@/content/circuits";
import { circuitSorts, circuitsHref, parseCircuitFilters, type CircuitFilters } from "@/lib/schemas/search";
import { whatsappLink } from "@/lib/site";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { CircuitFeatureCard } from "@/components/cards/CircuitFeatureCard";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { AutoSubmitSelect } from "@/components/forms/AutoSubmitSelect";

export const generateMetadata = metadataFor("circuits");

/* Circuits & séjours — référence : design/maquettes/Circuits.dc.html. Filtres reflétés dans l'URL et validés (lib/schemas/search.ts). */

const PAGE_SIZE = 6;

function applyFilters(all: Circuit[], f: CircuitFilters) {
  const durationRank = { "1": 1, "2-4": 2, "5+": 3 } as const;
  return all
    .filter((c) => (!f.theme || c.theme === f.theme) && (!f.region || c.region === f.region) && (!f.duree || c.durationBucket === f.duree))
    .sort((a, b) => (f.tri === "duree" ? durationRank[a.durationBucket] - durationRank[b.durationBucket] || a.rank - b.rank : a.rank - b.rank));
}

const cell = "flex min-w-0 flex-col gap-1 px-5 py-3.5 font-mono text-[11px] tracking-[0.1em] text-subtle uppercase";
const control = "w-full min-w-0 bg-transparent py-1 font-sans text-[17px] font-bold tracking-normal text-ink normal-case focus:outline-none disabled:text-faint";

function FilterField({ label, children, divider = true }: { label: string; children: ReactNode; divider?: boolean }) {
  return (
    <label className={`${cell} rounded-[10px] focus-within:bg-cream ${divider ? "border-b border-line sm:border-r sm:border-b-0" : ""}`}>
      {label}
      {children}
    </label>
  );
}

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CircuitsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("circuits");
  const tc = await getTranslations("common");
  const pageEntry = await getPage("circuits", locale);
  const labels = circuitLabels(locale);
  const prefix = localePrefix(locale);
  const filters = parseCircuitFilters(await searchParams);
  const results = applyFilters(getCircuits(locale), filters);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const themeLinks: { value?: CircuitTheme; label: string }[] = [{ label: t("all") }, ...(Object.entries(labels.themes) as [CircuitTheme, string][]).map(([value, label]) => ({ value, label }))];

  return (
    <>
      <PageHero page={pageEntry} crumbs={[{ href: "/", label: tc("home") }, { label: pageEntry.title }]} bottomClassName="pb-[120px]" />

      {/* BARRE DE FILTRES */}
      <section aria-label={t("searchLabel")} className="relative z-10 mx-auto -mt-[70px] max-w-[1200px] px-4 sm:px-6">
        <form method="get" action={`${prefix}/circuits`} className="grid items-stretch rounded-3xl bg-white p-2.5 shadow-[0_30px_70px_rgb(18_24_21/0.18)] sm:grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))]">
          {filters.theme && <input type="hidden" name="theme" value={filters.theme} />}
          <FilterField label={t("region")}>
            <select name="region" defaultValue={filters.region ?? ""} className={control}>
              <option value="">{t("allRegions")}</option>
              {Object.entries(labels.regions).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label={t("duration")}>
            <select name="duree" defaultValue={filters.duree ?? ""} className={control}>
              <option value="">{t("allDurations")}</option>
              {Object.entries(labels.durations).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label={t("budget")} divider={false}>
            {/* Tranches de prix à définir avec l'agence : filtre inactif tant que les prix sont des placeholders. */}
            <select disabled aria-describedby="budget-note" className={control}>
              <option>{t("allBudgets")}</option>
            </select>
            <span id="budget-note" className="font-sans text-xs tracking-normal text-subtle normal-case">
              {t("budgetNote")}
            </span>
          </FilterField>
          <button type="submit" className="m-1.5 flex min-h-[60px] items-center justify-center gap-2.5 rounded-2xl bg-brand-red px-6 text-base font-bold text-white hover:bg-brand-red-dark">
            <Icon name="search" size={20} strokeWidth={2.2} />
            {t("search")}
          </button>
        </form>
      </section>

      {/* LISTE */}
      <section className="container-site flex flex-col gap-7 pt-14 sm:pt-[72px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label={t("themeFilter")}>
            <ul className="flex flex-wrap gap-2">
              {themeLinks.map((th) => (
                <li key={th.label}>
                  <Chip href={circuitsHref({ ...filters, theme: th.value, page: 1 })} active={filters.theme === th.value} className="h-[46px] px-5 text-[15px]">
                    {th.label}
                  </Chip>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-wrap items-center gap-4 text-[15px] text-muted">
            <p aria-live="polite">{t.rich("count", { count: results.length })}</p>
            <form method="get" action={`${prefix}/circuits`} className="flex items-center gap-2">
              {filters.theme && <input type="hidden" name="theme" value={filters.theme} />}
              {filters.region && <input type="hidden" name="region" value={filters.region} />}
              {filters.duree && <input type="hidden" name="duree" value={filters.duree} />}
              <label htmlFor="tri">{t("sort")}</label>
              <AutoSubmitSelect id="tri" name="tri" defaultValue={filters.tri} className="h-11 rounded-xl border-[1.5px] border-line-strong bg-white px-3 text-sm font-semibold text-night">
                {(Object.keys(circuitSorts) as (keyof typeof circuitSorts)[]).map((v) => (
                  <option key={v} value={v}>
                    {t(`sorts.${v}`)}
                  </option>
                ))}
              </AutoSubmitSelect>
              <noscript>
                <button type="submit" className="h-11 rounded-xl bg-night px-3 text-sm font-semibold text-white">
                  {t("apply")}
                </button>
              </noscript>
            </form>
          </div>
        </div>

        {shown.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(360px,100%),1fr))] gap-[26px]">
            {shown.map((c) => (
              <li key={c.slug}>
                <CircuitFeatureCard circuit={c} className="h-full" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={t("emptyTitle")}
            action={
              <ButtonLink href="/circuits" variant="outline" size="sm">
                {t("reset")}
              </ButtonLink>
            }
          >
            {t("emptyText")}
          </EmptyState>
        )}

        <Pagination page={page} totalPages={totalPages} hrefFor={(p) => circuitsHref({ ...filters, page: p })} className="mt-3 flex justify-center" />
      </section>

      <CtaBanner
        image="/images/4x4-cote.jpg"
        imageAlt={t("ctaImageAlt")}
        kicker={t("ctaKicker")}
        title={t("ctaTitle")}
        actions={
          <>
            <ButtonLink href="/contact" variant="gold" className="h-14 px-7">
              {t("ctaButton")}
            </ButtonLink>
            <ButtonLink href={whatsappLink(t("ctaWhatsapp"))} variant="outline-light" className="h-14 px-6">
              {tc("whatsapp")}
            </ButtonLink>
          </>
        }
      >
        {t("ctaText")}
      </CtaBanner>
    </>
  );
}
