import Image from "next/image";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { getOffers, offerFilters } from "@/content/offers";
import { offerTypes, OfferCard, type OfferType } from "@/components/cards/OfferCard";
import { PageHero } from "@/components/layout/PageHero";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export const generateMetadata = metadataFor("offres");

/* Offres & promotions — référence : design/maquettes/Offres.dc.html. Filtre ?type= validé par liste blanche. */

function parseType(value: string | string[] | undefined): OfferType | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v !== undefined && Object.hasOwn(offerTypes, v) ? (v as OfferType) : undefined;
}

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function OffresPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("offres");
  const tc = await getTranslations("common");
  const page = await getPage("offres", locale);
  const type = parseType((await searchParams).type);
  const offers = getOffers(locale);
  const shown = offers.filter((o) => !type || o.type === type);

  return (
    <>
      <PageHero page={page} crumbs={[{ href: "/", label: tc("home") }, { label: page.title }]} />

      <section className="container-site flex flex-col gap-8 pt-14 sm:pt-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label={t("filterLabel")}>
            <ul className="flex flex-wrap gap-2 rounded-[var(--radius-md)] bg-sand p-1.5 sm:rounded-full">
              {offerFilters.map((value) => {
                const active = value === type;
                const count = value ? offers.filter((o) => o.type === value).length : offers.length;
                return (
                  <li key={value ?? "all"}>
                    <Link
                      href={value ? `/offres?type=${value}` : "/offres"}
                      scroll={false}
                      aria-current={active ? "true" : undefined}
                      className={clsx("flex h-11 items-center gap-1.5 rounded-full px-5 text-[15px] font-semibold transition-colors", active ? "bg-night text-white" : "text-night hover:bg-line")}
                    >
                      {t(`filters.${value ?? "all"}`)}
                      <span className={clsx("font-mono", active ? "text-brand-gold" : "text-subtle")}>{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <p className="text-sm text-subtle">{t("disclaimer")}</p>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-[22px]">
          {shown.map((o) => (
            <li key={o.href}>
              <OfferCard offer={o} className="h-full" />
            </li>
          ))}
        </ul>
      </section>

      {/* ALERTES PROMO */}
      <section className="container-site pt-16 pb-16 sm:pt-[100px] sm:pb-[110px]">
        <div className="relative flex flex-wrap items-center justify-between gap-7 overflow-hidden rounded-[var(--radius-xl)] bg-brand-red p-[clamp(28px,5vw,56px)] text-white">
          <Image src="/brand/symbole-blanc.svg" alt="" width={340} height={340} className="pointer-events-none absolute -right-[60px] -bottom-20 w-[340px] opacity-[0.12]" />
          <div className="relative flex max-w-[560px] flex-col gap-2.5">
            <span className="kicker text-gold-50">{t("alertsKicker")}</span>
            <h2 className="text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-bold tracking-[-0.03em]">{t("alertsTitle")}</h2>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
