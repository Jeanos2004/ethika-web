import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { languageAlternates, localizedPath } from "@/content/pages";
import { getLocalizedCircuit } from "@/content/circuits";
import { foutaBasePath, foutaSiteIds, foutaSitePath, foutaSites, isFoutaSite, type FoutaSiteId } from "@/content/fouta-sites";
import { isDemo } from "@/lib/demo/mode";
import { PageHero } from "@/components/layout/PageHero";
import { Icon } from "@/components/ui/Icon";
import { SectionNav } from "@/components/sections/SectionNav";
import { DestinationQuote } from "@/components/sections/DestinationQuote";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

/*
 * Site du Fouta Djallon (Mont Loura, chutes de Nguilo, roches de Koumba) : page de détail ouverte depuis les cartes
 * « Les sites à visiter » de Mali & le Fouta Djallon. Mise en page reprise de cette page (Destination.dc.html).
 * Structure : src/content/fouta-sites.ts ; textes : messages, espace « foutaSites ».
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => foutaSiteIds.map((site) => ({ locale, site })));
}

const CIRCUIT = "fouta-djallon-cascades-sommets";
const sectionIds = ["apercu", "voir", "pratique"] as const;
const section = "flex scroll-mt-[calc(var(--header-h)+80px)] flex-col";

type Params = { params: Promise<{ locale: Locale; site: string }> };
type Fact = { label: string; value: string };
type Highlight = { title: string; text: string };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, site } = await params;
  if (!isFoutaSite(site)) return {};
  const t = await getTranslations({ locale, namespace: `foutaSites.sites.${site}` });
  const path = foutaSitePath(site);
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: localizedPath(path, locale), languages: languageAlternates(path) },
    openGraph: { title: t("title"), description: t("description"), url: localizedPath(path, locale) },
    robots: isDemo ? { index: false, follow: false } : undefined,
  };
}

function H2({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="kicker text-brand-red">{kicker}</span>
      <h2 className="text-[clamp(32px,3.4vw,44px)] leading-[1.05] font-bold tracking-[-0.035em] text-night">{children}</h2>
    </div>
  );
}

export default async function FoutaSitePage({ params }: Params) {
  const { locale, site } = await params;
  if (!isFoutaSite(site)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("foutaSites");
  const ts = await getTranslations(`foutaSites.sites.${site}`);
  const tf = await getTranslations("fouta");
  const tc = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const style = foutaSites[site];
  const circuit = getLocalizedCircuit(CIRCUIT, locale);
  const facts = ts.raw("facts") as Fact[];
  const highlights = ts.raw("highlights") as Highlight[];
  const others = foutaSiteIds.filter((id): id is FoutaSiteId => id !== site);
  const path = foutaSitePath(site);

  return (
    <>
      <PageHero
        page={{ path, image: style.image, headerVariant: "transparent", status: "done", design: "Destination.dc.html", title: ts("title"), description: ts("description"), kicker: ts("kicker"), heading: ts("heading"), imageAlt: ts("imageAlt") }}
        crumbs={[{ href: "/", label: tc("home") }, { href: "/decouvrir-la-guinee", label: tNav("guinee") }, { href: foutaBasePath, label: tNav("fouta") }, { label: ts("title") }]}
      >
        <ul className="mt-2 flex flex-wrap gap-2.5 text-sm" aria-label={t("factsLabel")}>
          {facts.slice(0, 2).map((f) => (
            <li key={f.label} className="rounded-full border border-white/30 bg-white/15 px-4 py-2.5 font-semibold">
              {f.value}
            </li>
          ))}
          <li className="rounded-full bg-brand-gold px-4 py-2.5 font-bold text-ink">{tf("idealSeason")}</li>
        </ul>
      </PageHero>

      <SectionNav sections={sectionIds.map((id) => ({ id, label: t(`sections.${id}`) }))} />

      <div className="container-site flex flex-wrap items-start gap-12 pt-14">
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-[72px]">
          <section id="apercu" className={clsx(section, "gap-[22px]")}>
            <H2 kicker={t("overviewKicker")}>{ts("title")}</H2>
            <p className="text-lg leading-[1.7] text-muted">{ts("intro")}</p>
            <p className="text-[17px] leading-[1.7] text-muted">{ts("text")}</p>
            <dl aria-label={t("factsLabel")} className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3.5">
              {facts.map((f) => (
                <div key={f.label} className="flex flex-col gap-1.5 rounded-[var(--radius-panel)] bg-white p-5 shadow-[0_10px_30px_rgb(22_33_28/0.07)]">
                  <dt className="text-[13px] text-subtle">{f.label}</dt>
                  <dd className="text-xl font-bold text-night">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="relative mt-2 h-[clamp(220px,32vw,380px)] overflow-hidden rounded-3xl">
              <Image src={style.photo} alt={ts("photoAlt")} fill sizes="(min-width: 1100px) 760px, 100vw" className="object-cover" />
            </div>
          </section>

          <section id="voir" className={clsx(section, "gap-7")}>
            <H2 kicker={t("highlightsKicker")}>{t("highlightsTitle")}</H2>
            <ul className="grid gap-5 sm:grid-cols-2">
              {highlights.map((h) => (
                <li key={h.title} className="flex gap-4 rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgb(22_33_28/0.07)]">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-brand-green">
                    <Icon name={style.icon} size={22} />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <h3 className="text-lg leading-tight font-bold text-night">{h.title}</h3>
                    <p className="text-[15px] leading-relaxed text-muted">{h.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="pratique" className={clsx(section, "gap-5")}>
            <H2 kicker={t("practicalKicker")}>{t("practicalTitle")}</H2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-5">
              <div className="flex flex-col gap-2.5 rounded-3xl bg-gold-50 p-[26px] text-gold-700">
                <strong className="text-[19px]">{t("accessTitle")}</strong>
                <p className="text-[15px] leading-relaxed">{ts("access")}</p>
              </div>
              <div className="flex flex-col gap-2.5 rounded-3xl bg-brand-green p-[26px] text-white">
                <strong className="text-[19px]">{t("bringTitle")}</strong>
                <p className="text-[15px] leading-relaxed text-green-50">{ts("bring")}</p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-sm text-subtle">
              <Icon name="info" size={16} />
              {t("note")}
            </p>
          </section>
        </div>

        <aside id="reserver" aria-label={tf("asideLabel")} className="sticky top-[calc(var(--header-h)+90px)] flex min-w-0 flex-[1_1_340px] flex-col gap-[18px] lg:max-w-[420px]">
          <DestinationQuote circuit={CIRCUIT} circuitTitle={circuit?.headline ?? tNav("fouta")} durationLabel={tf("durationLabel")} />
          <div className="flex flex-col gap-3 rounded-3xl bg-sand p-[22px]">
            <span className="kicker text-brand-red">{t("circuitKicker")}</span>
            <p className="text-sm leading-relaxed text-muted">{t("circuitText")}</p>
            <Link href={`/circuits/${CIRCUIT}`} className="text-sm font-semibold text-brand-red underline-offset-4 hover:underline">
              {t("circuitCta")} →
            </Link>
            <Link href={foutaBasePath} className="text-sm font-semibold text-night underline-offset-4 hover:underline">
              ← {t("backToFouta")}
            </Link>
          </div>
        </aside>
      </div>

      <section className="container-site flex flex-col gap-9 py-16 sm:py-[110px]">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="kicker text-brand-red">{t("otherKicker")}</span>
          <h2 className="text-[clamp(32px,3.6vw,48px)] leading-[1.02] font-bold tracking-[-0.035em] text-night">{t("otherTitle")}</h2>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {others.map((id) => (
            <OtherSite key={id} id={id} discover={t("discover")} />
          ))}
        </ul>
      </section>
    </>
  );
}

async function OtherSite({ id, discover }: { id: FoutaSiteId; discover: string }) {
  const t = await getTranslations(`foutaSites.sites.${id}`);
  return (
    <li>
      <article className={clsx("group relative h-[340px] overflow-hidden rounded-[var(--radius-card)] text-white", cardFocus)}>
        <Image src={foutaSites[id].image} alt={t("imageAlt")} fill sizes="(min-width: 1100px) 50vw, 100vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(18_24_21/0.85)_100%)]" />
        <div className="absolute right-[22px] bottom-5 left-[22px] flex flex-col gap-0.5">
          <span className="font-serif text-xl text-brand-gold italic">{discover}</span>
          <h3 className="text-[26px] leading-tight font-bold">
            <Link href={foutaSitePath(id)} className={stretchedLink}>
              {t("title")}
            </Link>
          </h3>
        </div>
      </article>
    </li>
  );
}
