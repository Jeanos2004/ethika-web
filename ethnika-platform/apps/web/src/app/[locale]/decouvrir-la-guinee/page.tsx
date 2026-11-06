import Image from "next/image";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { ArchImages } from "@/components/sections/ArchImages";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

export const generateMetadata = metadataFor("guinee");

/* Découvrir la Guinée — référence : design/maquettes/Guinee.dc.html. Textes : messages, espace « guinee ». */

type Text = { title: string; text: string };

const reasonStyles: { icon: IconName; tint: string }[] = [
  { icon: "wavesSun", tint: "bg-line text-night" },
  { icon: "mountain", tint: "bg-green-50 text-green-700" },
  { icon: "waterfall", tint: "bg-gold-50 text-gold-700" },
  { icon: "landmark", tint: "bg-red-50 text-red-700" },
];
const regionStyles = [
  { href: "/decouvrir-la-guinee/basse-cote", image: "/images/plage-turquoise.jpg" },
  { href: "/decouvrir-la-guinee/mali-fouta-djallon", image: "/images/collines-brume.jpg" },
];
const upcomingStyles = [
  { tint: "bg-line", eyebrowTint: "text-gold-700", opacity: "opacity-25" },
  { tint: "bg-green-50", eyebrowTint: "text-green-700", opacity: "opacity-20" },
];
const destinationStyles = [
  { href: "/decouvrir-la-guinee/mali-fouta-djallon", image: "/images/fouta-sommets.jpg" },
  { href: "/decouvrir-la-guinee/iles-de-loos", image: "/images/barque-calme.jpg" },
  { href: "/decouvrir-la-guinee/basse-cote", image: "/images/bel-air-cocotiers.jpg" },
  { href: "/decouvrir-la-guinee/basse-cote#dubreka", image: "/images/dubreka-riviere-pirogue.jpg" },
];
const cultureBars = ["bg-brand-green", "bg-brand-gold", "bg-brand-red"];
const essentialStyles = [
  { box: "bg-night text-white", valueTint: "text-brand-gold", textTint: "text-on-dark" },
  { box: "bg-brand-green text-white", valueTint: "text-green-50", textTint: "text-green-50" },
  { box: "bg-white text-night shadow-[0_14px_40px_rgb(22_33_28/0.07)]", valueTint: "text-brand-red", textTint: "text-muted" },
];

export default async function GuineePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guinee");
  const tc = await getTranslations("common");
  const page = await getPage("guinee", locale);
  const reasons = t.raw("reasons") as Text[];
  const regions = t.raw("regions") as (Text & { alt: string; eyebrow: string })[];
  const upcoming = t.raw("upcoming") as { eyebrow: string; title: string }[];
  const destinations = t.raw("destinations") as (Text & { alt: string; eyebrow: string })[];
  const cultures = t.raw("cultures") as Text[];
  const essentials = t.raw("essentials") as (Text & { value: string })[];

  return (
    <>
      <PageHero page={page} crumbs={[{ href: "/", label: tc("home") }, { label: page.title }]}>
        <p className="max-w-[680px] text-lg leading-relaxed text-on-dark-2">{t("intro")}</p>
      </PageHero>

      {/* POURQUOI LA GUINÉE */}
      <section className="container-site flex flex-col gap-8 pt-16 sm:gap-11 sm:pt-[100px]">
        <SectionHeading kicker={t("whyKicker")} title={t("whyTitle")} />
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-5">
          {reasons.map((r, i) => (
            <li key={r.title} className="flex flex-col gap-3.5 rounded-[var(--radius-card)] bg-white p-[30px] shadow-[0_14px_40px_rgb(22_33_28/0.07)]">
              <span className={clsx("flex size-[60px] items-center justify-center rounded-[30px_30px_12px_12px]", reasonStyles[i]?.tint)}>
                <Icon name={reasonStyles[i]?.icon ?? "globe"} size={26} strokeWidth={1.8} />
              </span>
              <h3 className="text-xl font-bold text-night">{r.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{r.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* RÉGIONS */}
      <section className="container-site flex flex-col gap-10 pt-16 sm:pt-[110px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading kicker={t("regionsKicker")} title={t("regionsTitle")} align="left" />
          <p className="max-w-[460px] leading-relaxed text-muted">{t("regionsText")}</p>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(290px,100%),1fr))] gap-5">
          {regions.map((r, i) => (
            <li key={r.title}>
              <article className={clsx("group relative h-[440px] overflow-hidden rounded-[var(--radius-lg)] text-white", cardFocus)}>
                <Image src={regionStyles[i]?.image ?? ""} alt={r.alt} fill sizes="(min-width: 1100px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgb(18_24_21/0.9)_100%)]" />
                <div className="absolute right-6 bottom-[22px] left-6 flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] tracking-[0.14em] text-brand-gold uppercase">{r.eyebrow}</span>
                  <h3 className="text-[28px] font-bold tracking-tight">
                    <Link href={regionStyles[i]?.href ?? "/"} className={stretchedLink}>
                      {r.title}
                    </Link>
                  </h3>
                  <p className="text-sm leading-normal text-on-dark-2">{r.text}</p>
                </div>
              </article>
            </li>
          ))}
          {upcoming.map((u, i) => (
            <li key={u.title} className={clsx("relative flex h-[440px] flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] p-6", upcomingStyles[i]?.tint)}>
              <Image src="/brand/symbole-or.svg" alt="" width={260} height={260} className={clsx("absolute top-5 -right-10 w-[260px]", upcomingStyles[i]?.opacity)} />
              <span className="absolute top-5 left-5 rounded-full bg-night px-3 py-[7px] text-xs font-bold text-white">{t("soon")}</span>
              <span className={clsx("relative font-mono text-[11px] tracking-[0.14em] uppercase", upcomingStyles[i]?.eyebrowTint)}>{u.eyebrow}</span>
              <h3 className="relative text-[28px] font-bold tracking-tight text-night">{u.title}</h3>
              <p className="relative text-sm text-muted">{t("inPreparation")}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* NOS DESTINATIONS */}
      <section className="mt-16 bg-sand px-0 py-16 sm:mt-[110px] sm:py-[100px]">
        <div className="container-site flex flex-col gap-10">
          <SectionHeading kicker={t("destinationsKicker")} title={t("destinationsTitle")} />
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] gap-5">
            {destinations.map((d, i) => (
              <li key={d.title}>
                <article className={clsx("group relative flex h-full overflow-hidden rounded-[var(--radius-card)] bg-white shadow-md", cardFocus)}>
                  <div className="relative min-h-[220px] w-[42%] shrink-0">
                    <Image src={destinationStyles[i]?.image ?? ""} alt={d.alt} fill sizes="(min-width: 1100px) 260px, 42vw" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
                    <span className="font-mono text-[11px] tracking-[0.12em] text-brand-red uppercase">{d.eyebrow}</span>
                    <h3 className="text-[22px] leading-tight font-bold text-night">
                      <Link href={destinationStyles[i]?.href ?? "/"} className={stretchedLink}>
                        {d.title}
                      </Link>
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">{d.text}</p>
                    <span aria-hidden="true" className="mt-auto font-bold text-brand-red">
                      {tc("discover")}
                    </span>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CULTURE VIVANTE */}
      <section className="container-site flex flex-wrap items-center gap-14 pt-16 sm:pt-[110px]">
        <ArchImages main={{ src: "/images/pecheurs-couchant.jpg", alt: t("cultureImageMain") }} secondary={{ src: "/images/promeneurs-reflet.jpg", alt: t("cultureImageSecondary") }} />
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-5">
          <span className="kicker text-brand-red">{t("cultureKicker")}</span>
          <h2 className="text-[clamp(34px,3.8vw,50px)] leading-[1.02] font-bold tracking-[-0.035em] text-night">{t("cultureTitle")}</h2>
          <ul className="flex flex-col gap-4">
            {cultures.map((c, i) => (
              <li key={c.title} className="flex gap-4">
                <span aria-hidden="true" className={clsx("w-1.5 shrink-0 rounded-[3px]", cultureBars[i])} />
                <span className="flex flex-col gap-1">
                  <strong className="text-lg text-night">{c.title}</strong>
                  <span className="text-[15px] leading-relaxed text-muted">{c.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* L'ESSENTIEL À SAVOIR */}
      <section className="container-site flex flex-col gap-9 pt-16 sm:pt-[110px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading kicker={t("essentialsKicker")} title={t("essentialsTitle")} align="left" />
          <ButtonLink href="/decouvrir-la-guinee/infos-pratiques" variant="outline" className="h-[52px]">
            {t("allPracticalInfo")}
          </ButtonLink>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-[18px]">
          {essentials.map((e, i) => (
            <li key={e.title} className={clsx("flex flex-col gap-2.5 rounded-[var(--radius-card)] p-7", essentialStyles[i]?.box)}>
              <span className={clsx("font-mono text-[28px]", essentialStyles[i]?.valueTint)}>{e.value}</span>
              <h3 className="text-[19px] font-bold">{e.title}</h3>
              <p className={clsx("text-[15px] leading-relaxed", essentialStyles[i]?.textTint)}>{e.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <CtaBanner
        image="/images/4x4-cote.jpg"
        imageAlt={t("ctaImageAlt")}
        kicker={t("ctaKicker")}
        title={t("ctaTitle")}
        actions={
          <>
            <ButtonLink href="/circuits" variant="gold" className="h-14 px-7">
              {tc("seeCircuits")}
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline-light" className="h-14 px-[26px]">
              {tc("tailorMade")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
