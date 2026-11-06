import Image from "next/image";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { getLocalizedCircuit } from "@/content/circuits";
import { PageHero } from "@/components/layout/PageHero";
import { Icon } from "@/components/ui/Icon";
import { SectionNav } from "@/components/sections/SectionNav";
import { PhotoMosaic } from "@/components/sections/PhotoMosaic";
import { Itinerary } from "@/components/sections/Itinerary";
import { DestinationQuote } from "@/components/sections/DestinationQuote";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

export const generateMetadata = metadataFor("fouta");

/* Mali & le Fouta Djallon — référence : design/maquettes/Destination.dc.html. Textes : messages, espace « fouta ». */

const CIRCUIT = "fouta-djallon-cascades-sommets";
const sectionIds = ["apercu", "sites", "itineraire", "inclus", "pratique"] as const;
const galleryImages = ["fouta-sommets", "chutes-nguilo", "vallee-route", "roches-koumba", "fouta-plateau-couchant", "collines-brume", "voyageur-panorama"];
const siteStyles = [
  { id: "loura", image: "/images/fouta-sommets.jpg" },
  { id: "nguilo", image: "/images/chutes-nguilo.jpg" },
  { id: "koumba", image: "/images/roches-koumba.jpg" },
];
const relatedStyles = [
  { href: "/decouvrir-la-guinee/iles-de-loos", image: "/images/barque-calme.jpg" },
  { href: "/decouvrir-la-guinee/basse-cote#bel-air", image: "/images/plage-turquoise.jpg" },
  { href: "/decouvrir-la-guinee/basse-cote#dubreka", image: "/images/dubreka-riviere-pirogue.jpg" },
];

function H2({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="kicker text-brand-red">{kicker}</span>
      <h2 className="text-[clamp(32px,3.4vw,44px)] leading-[1.05] font-bold tracking-[-0.035em] text-night">{children}</h2>
    </div>
  );
}

const section = "flex scroll-mt-[calc(var(--header-h)+80px)] flex-col";

export default async function FoutaPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fouta");
  const tc = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const page = await getPage("fouta", locale);
  const circuit = getLocalizedCircuit(CIRCUIT, locale);
  const chips = t.raw("chips") as string[];
  const alts = t.raw("gallery") as string[];
  const figures = t.raw("figures") as { label: string; value: string; note: string }[];
  const sites = t.raw("sites") as { alt: string; badge: string; title: string; text: string }[];
  const days = t.raw("days") as string[];
  const related = t.raw("related") as { alt: string; eyebrow: string; title: string }[];

  return (
    <>
      <PageHero page={page} crumbs={[{ href: "/", label: tc("home") }, { href: "/decouvrir-la-guinee", label: tNav("guinee") }, { label: tNav("fouta") }]}>
        <ul className="mt-2 flex flex-wrap gap-2.5 text-sm">
          {chips.map((c) => (
            <li key={c} className="rounded-full border border-white/30 bg-white/15 px-4 py-2.5 font-semibold">
              {c}
            </li>
          ))}
          <li className="rounded-full bg-brand-gold px-4 py-2.5 font-bold text-ink">{t("idealSeason")}</li>
        </ul>
      </PageHero>

      <SectionNav sections={sectionIds.map((id) => ({ id, label: t(`sections.${id}`) }))} />

      <div className="container-site flex flex-wrap items-start gap-12 pt-14">
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-[72px]">
          <PhotoMosaic images={galleryImages.map((img, i) => ({ src: `/images/${img}.jpg`, alt: alts[i] ?? "" }))} />

          <section id="apercu" className={clsx(section, "gap-[22px]")}>
            <H2 kicker={t("historyKicker")}>{t("historyTitle")}</H2>
            <p className="text-lg leading-[1.7] text-muted">{t("historyP1")}</p>
            <p className="text-[17px] leading-[1.7] text-muted">{t("historyP2")}</p>
            <dl className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-3.5">
              {figures.map((f, i) => (
                <div key={f.label} className="flex flex-col gap-1.5 rounded-[var(--radius-panel)] bg-white p-5 shadow-[0_10px_30px_rgb(22_33_28/0.07)]">
                  <dt className="text-[13px] text-subtle">{f.label}</dt>
                  <dd className={clsx("text-night", i < 3 ? "font-mono text-2xl font-medium" : "text-xl font-bold")}>{f.value}</dd>
                  <dd className="text-xs text-subtle">{f.note}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="sites" className={clsx(section, "gap-7")}>
            <H2 kicker={t("sitesKicker")}>{t("sitesTitle")}</H2>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-5">
              {sites.map((s, i) => (
                <li key={s.title} id={siteStyles[i]?.id} className="flex scroll-mt-[calc(var(--header-h)+80px)] flex-col overflow-hidden rounded-3xl bg-white shadow-md">
                  <div className="relative h-[220px]">
                    <Image src={siteStyles[i]?.image ?? ""} alt={s.alt} fill sizes="(min-width: 1100px) 260px, 100vw" className="object-cover" />
                    <span className="absolute top-3.5 left-3.5 rounded-full bg-white px-3 py-1.5 font-mono text-xs text-night">{s.badge}</span>
                  </div>
                  <div className="flex flex-col gap-2 p-5">
                    <h3 className="text-[21px] leading-tight font-bold text-night">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="itineraire" className={clsx(section, "gap-6")}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <H2 kicker={t("itineraryKicker")}>{t("itineraryTitle")}</H2>
              <Link href={`/circuits/${CIRCUIT}`} className="text-sm font-semibold text-brand-red underline-offset-4 hover:underline">
                {t("detailedProgram")}
              </Link>
            </div>
            <Itinerary days={days.map((title) => ({ title, body: t("dayPlaceholder") }))} variant="destination" />
          </section>

          <section id="inclus" className={clsx(section, "grid! grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-5")}>
            <h2 className="sr-only">{t("includedTitle")}</h2>
            <IncludedList title={t("included")} items={t.raw("includedItems") as string[]} tone="in" />
            <IncludedList title={t("excluded")} items={t.raw("excludedItems") as string[]} tone="out" />
          </section>

          <section id="pratique" className={clsx(section, "gap-5")}>
            <H2 kicker={t("practicalKicker")}>{t("practicalTitle")}</H2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-5">
              <div className="flex flex-col gap-2.5 rounded-3xl bg-gold-50 p-[26px] text-gold-700">
                <strong className="text-[19px]">{t("accessTitle")}</strong>
                <p className="text-[15px] leading-relaxed">{t("accessText")}</p>
              </div>
              <div className="flex flex-col gap-2.5 rounded-3xl bg-brand-green p-[26px] text-white">
                <strong className="text-[19px]">{t("healthTitle")}</strong>
                <p className="text-[15px] leading-relaxed text-green-50">{t("healthText")}</p>
              </div>
            </div>
            <div className="flex h-[300px] flex-col items-center justify-center gap-2 rounded-3xl border-[1.5px] border-dashed border-line-strong bg-sand text-subtle">
              <Icon name="globe" size={28} />
              <span className="font-semibold">{t("map")}</span>
            </div>
          </section>
        </div>

        <aside id="reserver" aria-label={t("asideLabel")} className="sticky top-[calc(var(--header-h)+90px)] flex min-w-0 flex-[1_1_340px] flex-col gap-[18px] lg:max-w-[420px]">
          <DestinationQuote circuit={CIRCUIT} circuitTitle={circuit?.headline ?? page.title} durationLabel={t("durationLabel")} />
          <div className="flex flex-col gap-3 rounded-3xl bg-sand p-[22px]">
            <strong className="text-night">{t("whyBook")}</strong>
            {(t.raw("whyItems") as string[]).map((item) => (
              <span key={item} className="flex items-center gap-2 text-sm text-muted">
                <Icon name="check" size={16} strokeWidth={2.6} className="text-brand-green" />
                {item}
              </span>
            ))}
          </div>
        </aside>
      </div>

      <section className="container-site flex flex-col gap-9 py-16 sm:py-[110px]">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="kicker text-brand-red">{t("relatedKicker")}</span>
          <h2 className="text-[clamp(32px,3.6vw,48px)] leading-[1.02] font-bold tracking-[-0.035em] text-night">{t("relatedTitle")}</h2>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {related.map((r, i) => (
            <li key={r.title}>
              <article className={clsx("group relative h-[340px] overflow-hidden rounded-[var(--radius-card)] text-white", cardFocus)}>
                <Image src={relatedStyles[i]?.image ?? ""} alt={r.alt} fill sizes="(min-width: 1100px) 33vw, 100vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(18_24_21/0.85)_100%)]" />
                <div className="absolute bottom-5 left-[22px] flex flex-col gap-0.5">
                  <span className="font-serif text-xl text-brand-gold italic">{r.eyebrow}</span>
                  <h3 className="text-[26px] font-bold">
                    <Link href={relatedStyles[i]?.href ?? "/"} className={stretchedLink}>
                      {r.title}
                    </Link>
                  </h3>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function IncludedList({ title, items, tone }: { title: string; items: string[]; tone: "in" | "out" }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-3xl bg-white p-7 shadow-[0_10px_30px_rgb(22_33_28/0.07)]">
      <h3 className="text-xl font-bold text-night">{title}</h3>
      <ul className="flex flex-col gap-3 text-[15px] text-muted">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-3">
            <span className={clsx("flex size-6 shrink-0 items-center justify-center rounded-full", tone === "in" ? "bg-brand-green text-white" : "bg-red-50 text-red-700")}>
              <Icon name={tone === "in" ? "check" : "close"} size={13} strokeWidth={3} />
            </span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
