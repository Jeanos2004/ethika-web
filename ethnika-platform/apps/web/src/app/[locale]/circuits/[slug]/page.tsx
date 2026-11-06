import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPage, languageAlternates, localizedPath } from "@/content/pages";
import { circuits, getCircuits, getLocalizedCircuit, type Circuit, type Departure } from "@/content/circuits";
import { site } from "@/lib/site";
import { PageHero, type Crumb } from "@/components/layout/PageHero";
import { Itinerary } from "@/components/sections/Itinerary";
import { CircuitBooking } from "@/components/sections/CircuitBooking";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

/* Fiche circuit — référence : design/maquettes/CircuitDetail.dc.html. Données : src/content/circuits.ts (+ .en.ts). */

/** Une page par circuit ; la langue vient du segment parent [locale]. */
export function generateStaticParams() {
  return circuits.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false; // slug inconnu → 404, pas de rendu à la demande

type Params = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = getLocalizedCircuit(slug, locale);
  if (!c) return {};
  const path = `/circuits/${c.slug}`;
  return {
    title: c.headline,
    description: c.summary,
    alternates: { canonical: localizedPath(path, locale), languages: languageAlternates(path) },
    openGraph: { title: c.headline, description: c.summary, url: localizedPath(path, locale) },
  };
}

const statusTint: Record<Departure["status"], string> = { available: "text-brand-green", last: "text-gold-700", request: "text-muted" };

function similar(all: Circuit[], c: Circuit) {
  return [...all.filter((o) => o.slug !== c.slug && o.theme === c.theme), ...all.filter((o) => o.slug !== c.slug && o.theme !== c.theme)].slice(0, 3);
}

export default async function CircuitPage({ params }: Params) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const c = getLocalizedCircuit(slug, locale);
  if (!c) notFound();
  const t = await getTranslations("circuit");
  const tc = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const listPage = await getPage("circuits", locale);
  const d = c.detail;
  const crumbs: Crumb[] = [{ href: "/", label: tc("home") }, { href: "/circuits", label: tNav("circuits") }, { label: c.headline }];
  const durationLabel = d?.facts.duration.split(" · ")[0] ?? c.durationLabel;
  const url = `${site.url}${localizedPath(`/circuits/${c.slug}`, locale)}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          name: c.headline,
          description: d?.intro ?? c.summary,
          image: `${site.url}${c.image}`,
          url,
          inLanguage: locale,
          touristType: d?.themeLabel ?? c.tag.label,
          provider: { "@type": "TravelAgency", name: site.name, url: site.url },
          ...(d && {
            itinerary: {
              "@type": "ItemList",
              itemListElement: d.days.map((day, i) => ({ "@type": "ListItem", position: i + 1, name: day.title, description: day.text })),
            },
          }),
        }}
      />
      <JsonLd data={breadcrumbJsonLd(site.url, crumbs, localizedPath(`/circuits/${c.slug}`, locale))} />

      <PageHero
        page={{ ...listPage, heading: c.headline, image: c.image, imageAlt: c.imageAlt }}
        crumbs={crumbs}
        eyebrow={
          <ul className="flex flex-wrap gap-2 text-[13px]">
            <li className="rounded-full bg-brand-green px-3.5 py-[7px] font-bold">{d?.themeLabel ?? c.tag.label}</li>
            <li className="rounded-full bg-white/15 px-3.5 py-[7px] font-semibold">{d?.regionLabel ?? c.place}</li>
          </ul>
        }
      >
        <dl className="mt-2 flex flex-wrap gap-7 text-[15px] text-on-dark-2">
          {(d
            ? [
                [t("duration"), d.facts.duration],
                [t("departure"), d.facts.departure],
                [t("level"), d.facts.level],
                [t("group"), d.facts.group],
              ]
            : [
                [t("duration"), c.durationLabel],
                [t("place"), c.place],
              ]
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[11px] tracking-[0.12em] text-on-dark-muted uppercase">{k}</dt>
              <dd className="text-xl font-bold text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      <div className="container-site flex flex-wrap items-start gap-12 pt-14 sm:pt-[72px]">
        <div className="flex min-w-0 flex-[1_1_660px] flex-col gap-16">
          <section className="flex flex-col gap-4">
            <h2 className="kicker text-brand-red">{t("theTrip")}</h2>
            <p className="text-[19px] leading-[1.7] text-night">{d?.intro ?? c.summary}</p>
            {d && (
              <ul className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3">
                {d.gallery.map((g) => (
                  <li key={g.src} className="relative h-[180px] overflow-hidden rounded-[var(--radius-panel)]">
                    <Image src={g.src} alt={g.alt} fill sizes="(min-width: 1100px) 200px, 50vw" className="object-cover" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-[clamp(30px,3.2vw,44px)] font-bold tracking-[-0.03em] text-night">{t("program")}</h2>
            {d ? (
              <Itinerary
                variant="circuit"
                toggleAll
                days={d.days.map((day) => ({
                  title: day.title,
                  meta: day.meta,
                  body: day.text,
                  tags: [
                    { label: t("night", { value: day.night }), tone: "green" as const },
                    { label: t("meals", { value: day.meals }), tone: "gold" as const },
                  ],
                }))}
              />
            ) : (
              <p className="rounded-[var(--radius-md)] border-[1.5px] border-dashed border-line-strong p-6 text-muted">{t("programPending")}</p>
            )}
          </section>

          {d && (
            <section className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-[18px]" aria-label={t("includedLabel")}>
              <div className="flex flex-col gap-3 rounded-3xl bg-green-50 p-[26px]">
                <h3 className="text-[22px] font-bold text-brand-green-dark">{t("included")}</h3>
                <ul className="list-disc pl-[18px] text-[15px] leading-[1.9] text-green-700">
                  {d.included.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3 rounded-3xl bg-red-50 p-[26px]">
                <h3 className="text-[22px] font-bold text-red-700">{t("excluded")}</h3>
                <ul className="list-disc pl-[18px] text-[15px] leading-[1.9] text-red-700">
                  {d.excluded.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {d && (
            <section className="flex flex-col gap-3.5">
              <h2 className="text-[clamp(28px,3vw,38px)] font-bold tracking-[-0.03em] text-night">{t("departures")}</h2>
              <ul className="overflow-hidden rounded-[var(--radius-md)] border border-line bg-white">
                {d.departures.map((dep, i) => (
                  <li key={i} className={clsx("grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] items-center gap-1 px-5 py-4", i < d.departures.length - 1 && "border-b border-line")}>
                    <span className="font-mono">{dep.dates}</span>
                    <span className={clsx("font-bold", statusTint[dep.status])}>{t(`status.${dep.status}`)}</span>
                    <span className="font-bold">{dep.price}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside aria-label={t("bookLabel")} className="sticky top-[calc(var(--header-h)+24px)] min-w-0 flex-[1_1_340px]">
          <CircuitBooking slug={c.slug} title={c.headline} durationLabel={durationLabel} priceBasis={d?.priceBasis ?? tc("perPerson")} />
        </aside>
      </div>

      <section className="container-site flex flex-col gap-7 pt-16 pb-16 sm:pt-[100px] sm:pb-[110px]">
        <h2 className="text-[clamp(30px,3.2vw,42px)] font-bold tracking-[-0.03em] text-night">{t("similar")}</h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {similar(getCircuits(locale), c).map((s) => (
            <li key={s.slug}>
              <article className={clsx("group relative overflow-hidden rounded-3xl bg-white shadow-md", cardFocus)}>
                <div className="relative h-[200px] overflow-hidden">
                  <Image src={s.image} alt={s.imageAlt} fill sizes="(min-width: 1100px) 33vw, 100vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
                </div>
                <div className="flex justify-between gap-3 p-5">
                  <h3 className="text-[19px] font-bold text-night">
                    <Link href={`/circuits/${s.slug}`} className={stretchedLink}>
                      {s.title}
                    </Link>
                  </h3>
                  <span className="shrink-0 font-mono text-brand-red">{s.durationLabel}</span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
