"use client";

import { useId, useState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import type { FaqCategory, FaqItem } from "@/content/faq";
import { slugify } from "@/lib/slug";
import { Icon } from "@/components/ui/Icon";

/**
 * FAQ (FAQ.dc.html) : recherche instantanée insensible aux accents, filtre par catégorie, accordéon.
 * Une seule réponse ouverte à la fois ; le nombre de résultats est annoncé.
 */
type Props = { faq: FaqItem[]; categories: Record<FaqCategory, string>; initialQuery?: string; initialCategory?: FaqCategory };

export function FaqExplorer({ faq, categories, initialQuery = "", initialCategory }: Props) {
  const t = useTranslations("faq");
  const uid = useId();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<FaqCategory | undefined>(initialCategory);
  const [open, setOpen] = useState<string | undefined>(faq[0]?.id);

  const words = slugify(query).split("-").filter(Boolean);
  const items = faq.filter((f) => (!category || f.category === category) && words.every((w) => slugify(`${f.question} ${f.answer}`).includes(w)));

  const pick = (c?: FaqCategory) => {
    setCategory(c);
    setOpen(undefined);
  };

  return (
    <>
      <section className="bg-sand px-4 pt-16 pb-14 sm:px-6 sm:pt-[72px] sm:pb-16">
        <div className="mx-auto flex max-w-[860px] flex-col items-center gap-4 text-center">
          <span className="kicker text-brand-red">{t("kicker")}</span>
          <h1 className="text-[clamp(44px,5.6vw,84px)] leading-[0.96] font-bold tracking-[-0.045em] text-night">{t("title")}</h1>
          <div role="search" className="relative mt-2.5 w-full max-w-[620px]">
            <label htmlFor={`${uid}-q`} className="sr-only">
              {t("searchLabel")}
            </label>
            <Icon name="search" size={20} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-subtle" />
            <input
              id={`${uid}-q`}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value.slice(0, 80));
                setOpen(undefined);
              }}
              placeholder={t("placeholder")}
              className="h-[60px] w-full rounded-full bg-white pr-[22px] pl-[54px] text-base font-medium shadow-[0_14px_40px_rgb(22_33_28/0.1)] focus:ring-4 focus:ring-brand-gold/40 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[980px] flex-col gap-6 px-4 pt-14 sm:px-6">
        <div role="group" aria-label={t("categories")} className="flex flex-wrap justify-center gap-2">
          {[undefined, ...(Object.keys(categories) as FaqCategory[])].map((c) => {
            const active = category === c;
            return (
              <button
                key={c ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => pick(c)}
                className={clsx("h-11 rounded-full border-[1.5px] px-[18px] text-[15px] font-semibold transition-colors", active ? "border-night bg-night text-white" : "border-line-strong bg-white text-night hover:border-night")}
              >
                {c ? categories[c] : t("all")}
              </button>
            );
          })}
        </div>
        <p aria-live="polite" className="text-center text-sm text-subtle">
          {t("count", { count: items.length })}
        </p>

        {items.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {items.map((f) => {
              const expanded = open === f.id;
              return (
                <li key={f.id} className="overflow-hidden rounded-[var(--radius-md)] bg-white shadow-[0_10px_30px_rgb(22_33_28/0.06)]">
                  <h2>
                    <button
                      id={`${uid}-b-${f.id}`}
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`${uid}-p-${f.id}`}
                      onClick={() => setOpen(expanded ? undefined : f.id)}
                      className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-6 py-[22px] text-left text-lg font-semibold text-night sm:flex-nowrap"
                    >
                      <span className="min-w-[92px] font-mono text-[11px] tracking-[0.1em] text-brand-red uppercase">{categories[f.category]}</span>
                      <span className="flex-1">{f.question}</span>
                      <span aria-hidden="true" className={clsx("flex size-9 shrink-0 items-center justify-center rounded-full", expanded ? "bg-brand-red text-white" : "bg-sand text-night")}>
                        <Icon name={expanded ? "minus" : "plus"} size={16} strokeWidth={2.4} />
                      </span>
                    </button>
                  </h2>
                  <div id={`${uid}-p-${f.id}`} role="region" aria-labelledby={`${uid}-b-${f.id}`} hidden={!expanded} className="px-6 pb-[22px] leading-[1.7] text-muted sm:pl-[132px]">
                    {f.answer}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2.5 rounded-[var(--radius-md)] border-[1.5px] border-dashed border-line-strong px-6 py-10 text-center">
            <strong className="text-[19px] text-night">{t("emptyTitle")}</strong>
            <p className="text-[15px] text-muted">{t("emptyText")}</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                pick(undefined);
              }}
              className="h-11 rounded-full border-[1.5px] border-night px-[18px] text-sm font-semibold text-night hover:bg-night hover:text-white"
            >
              {t("clear")}
            </button>
          </div>
        )}
      </section>
    </>
  );
}
