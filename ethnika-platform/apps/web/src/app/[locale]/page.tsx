import Image from "next/image";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { metadataFor } from "@/content/pages";
import { siteCircuits, siteHomePosts } from "@/lib/content-source";
import { getHomeContent, type MosaicItem } from "@/content/home";
import { site, whatsappLink } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HeroSlider } from "@/components/home/HeroSlider";
import { HomeSearch } from "@/components/home/HomeSearch";
import { ScrollRow } from "@/components/home/ScrollRow";
import { VideoButton } from "@/components/home/VideoButton";
import { CircuitFeatureCard } from "@/components/cards/CircuitFeatureCard";
import { RouteTicket } from "@/components/cards/RouteTicket";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

export const generateMetadata = metadataFor("home");

/* Accueil — références : design/maquettes/Home2.dc.html (1440px) et HomeMobile.dc.html (390px). */

const photoGradient = "absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgb(18_24_21/0.85)_100%)]";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tSearch = await getTranslations("search");
  const tc = await getTranslations("common");
  const c = getHomeContent(locale);
  const circuits = await siteCircuits(locale);
  const posts = await siteHomePosts(locale);

  return (
    <>
      <HeroSlider slides={c.heroSlides} />

      {/* RECHERCHE EN CHEVAUCHEMENT */}
      <section aria-label={tSearch("label")} className="relative z-10 mx-3 -mt-[92px] sm:container-site sm:-mt-[96px]">
        <HomeSearch />
      </section>

      {/* CONFIANCE */}
      <section aria-label={t("trustLabel")} className="sm:container-site">
        <ul className="flex flex-wrap gap-2 px-4 pt-[22px] sm:hidden">
          {c.trust.map((item) => (
            <li key={item.icon} className={clsx("shrink-0 rounded-full px-3.5 py-2.5 text-[13px] font-semibold", item.tint)}>
              {item.chip}
            </li>
          ))}
        </ul>
        <ul className="hidden grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-6 border-b border-line pt-10 pb-6 sm:grid">
          {c.trust.map((item) => (
            <li key={item.icon} className="flex items-center gap-3.5">
              <span className={clsx("flex size-[52px] shrink-0 items-center justify-center rounded-[26px_26px_10px_10px]", item.tint)}>
                <Icon name={item.icon} size={22} />
              </span>
              <span className="flex flex-col">
                <strong className="text-base text-ink">{item.title}</strong>
                <span className="text-sm text-subtle">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* DESTINATIONS PHARES */}
      <section className="container-site flex flex-col gap-4 pt-12 sm:gap-11 sm:pt-24">
        <SectionHeading kicker={t("explore")} title={t("destinationsTitle")} intro={t("destinationsIntro")} className="max-sm:items-start max-sm:text-left" />
        <div className="flex flex-wrap gap-3 sm:gap-5">
          <article className={clsx("group relative h-[380px] min-w-0 flex-[1_1_520px] overflow-hidden rounded-[var(--radius-card)] text-white sm:h-[600px] sm:rounded-[var(--radius-lg)]", cardFocus)}>
            <Image src={c.mosaicFeature.image} alt={c.mosaicFeature.alt} fill sizes="(min-width: 1100px) 50vw, 100vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(18_24_21/0.85)_100%)]" />
            <span className="absolute top-3.5 left-3.5 rounded-full bg-brand-gold px-3 py-1.5 text-xs font-bold text-ink sm:top-[22px] sm:left-[22px] sm:px-3.5 sm:py-2 sm:text-[13px]">{c.mosaicFeature.badge}</span>
            <div className="absolute right-[18px] bottom-4 left-[18px] flex items-end justify-between gap-4 sm:right-8 sm:bottom-[30px] sm:left-8">
              <div className="flex flex-col gap-0.5 sm:gap-1.5">
                <span className="font-serif text-[19px] text-brand-gold italic sm:text-2xl">{c.mosaicFeature.eyebrow}</span>
                <h3 className="text-[28px] leading-none font-bold tracking-tight sm:text-[44px]">
                  <Link href={c.mosaicFeature.href} className={stretchedLink}>
                    {c.mosaicFeature.title}
                  </Link>
                </h3>
                <span className="hidden text-[15px] text-on-dark-2 sm:block">{c.mosaicFeature.sub}</span>
              </div>
              <span aria-hidden="true" className="hidden size-14 shrink-0 items-center justify-center rounded-full bg-white text-night sm:flex">
                <Icon name="arrowUpRight" size={22} strokeWidth={2.2} />
              </span>
            </div>
          </article>
          <div className="grid min-w-0 flex-[1_1_520px] grid-cols-2 gap-3 sm:gap-5">
            {c.mosaicGrid.map((m) => (
              <MosaicTile key={m.href} item={m} />
            ))}
          </div>
        </div>
        <div className="hidden grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5 sm:grid">
          {c.mosaicRow.map((m) => (
            <article key={m.href} className={clsx("group relative h-60 overflow-hidden rounded-3xl text-white", cardFocus)}>
              <Image src={m.image} alt={m.alt} fill sizes="(min-width: 1100px) 33vw, 50vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
              <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgb(18_24_21/0.8)_0%,transparent_70%)]" />
              <div className="absolute top-1/2 left-6 flex -translate-y-1/2 flex-col gap-1">
                <span className="font-serif text-[19px] text-brand-gold italic">{m.eyebrow}</span>
                <h3 className="text-[26px] font-bold tracking-tight">
                  <Link href={m.href} className={stretchedLink}>
                    {m.title}
                  </Link>
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* NOTRE FAÇON DE VOYAGER */}
      <section className="container-site flex flex-wrap items-center gap-10 pt-16 sm:gap-16 sm:pt-[120px]">
        <div className="relative h-[420px] min-w-0 flex-[1_1_520px] sm:h-[600px]">
          <div className="absolute top-0 left-0 h-[360px] w-[64%] overflow-hidden rounded-[999px_999px_28px_28px] sm:h-[520px]">
            <Image src="/images/voyageur-panorama.jpg" alt={t("panoramaAlt")} fill sizes="(min-width: 1100px) 32vw, 64vw" className="object-cover" />
          </div>
          <div className="absolute right-0 bottom-0 h-[220px] w-[48%] overflow-hidden rounded-[var(--radius-lg)] border-8 border-cream sm:h-[330px]">
            <Image src="/images/4x4-cote.jpg" alt={t("fourByFourAlt")} fill sizes="(min-width: 1100px) 24vw, 48vw" className="object-cover" />
          </div>
          <div className="absolute top-10 right-[8%] flex items-center gap-3 rounded-[var(--radius-md)] bg-night px-5 py-[18px] text-white shadow-[0_20px_40px_rgb(18_24_21/0.25)]">
            <span className="font-mono text-[34px] text-brand-gold">4×4</span>
            <span className="text-[13px] leading-snug">
              {t("badge4x4Line1")}
              <br />
              {t("badge4x4Line2")}
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-5">
          <span className="kicker text-brand-red">{t("wayKicker")}</span>
          <h2 className="text-[clamp(36px,4vw,54px)] leading-[1.02] font-bold tracking-[-0.035em] text-night">{t("wayTitle")}</h2>
          <p className="text-[17px] leading-[1.7] text-muted">{t("wayText")}</p>
          <ul className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
            {c.experiencePoints.map((p) => (
              <li key={p} className="flex items-center gap-3 font-semibold">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-red text-white">
                  <Icon name="check" size={14} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <ButtonLink href="/circuits" variant="secondary" className="h-14 px-7">
              {tc("seeCircuits")} <Icon name="arrowRight" size={18} strokeWidth={2.2} />
            </ButtonLink>
            <VideoButton className="inline-flex items-center gap-3 font-semibold text-night hover:text-brand-red">
              <span className="flex size-[52px] items-center justify-center rounded-full bg-red-50 text-brand-red">
                <Icon name="play" size={18} />
              </span>
              {t("watchVideo")}
            </VideoButton>
          </div>
        </div>
      </section>

      {/* TYPES DE VOYAGE */}
      <section className="mt-12 bg-sand py-10 sm:mt-[120px] sm:py-24">
        <div className="container-site flex flex-col gap-4 sm:gap-11">
          <SectionHeading kicker={t("typesKicker")} title={t("typesTitle")} className="max-sm:items-start max-sm:text-left" />
          <ul className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pt-1 pb-2.5 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] sm:gap-[18px] sm:overflow-visible sm:p-0">
            {c.travelTypes.map((type) => (
              <li key={type.href} className="w-[120px] shrink-0 sm:w-auto">
                <Link
                  href={type.href}
                  className="group flex h-full flex-col items-center gap-2.5 rounded-[var(--radius-panel)] bg-white px-3 py-[18px] text-center shadow-[0_8px_22px_rgb(22_33_28/0.08)] transition-transform motion-safe:hover:-translate-y-1 sm:gap-3.5 sm:rounded-3xl sm:px-5 sm:py-[30px] sm:shadow-sm"
                >
                  <span className="flex size-[52px] items-center justify-center rounded-full border-[1.5px] border-dashed border-brand-red text-brand-red sm:size-[72px]">
                    <Icon name={type.icon} size={30} strokeWidth={1.8} className="size-6 sm:size-[30px]" />
                  </span>
                  <strong className="text-sm text-night sm:text-lg">{type.title}</strong>
                  <span className="hidden text-[13px] text-subtle sm:block">{type.text}</span>
                  <span aria-hidden="true" className="hidden rounded-full bg-brand-red px-3.5 py-[7px] text-xs font-bold text-white group-hover:bg-brand-red-dark sm:block">
                    {t("see")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CIRCUITS */}
      <section className="container-site pt-10 sm:pt-[110px]">
        <ScrollRow
          label={t("circuitsLabel")}
          heading={
            <div className="flex w-full items-end justify-between gap-2 sm:w-auto sm:flex-col sm:items-start">
              <span className="kicker hidden text-brand-red sm:block">{t("circuitsKicker")}</span>
              <h2 className="h-section text-[30px] text-night sm:text-[clamp(36px,4.2vw,56px)]">
                <span className="sm:hidden">{t("circuitsTitleShort")}</span>
                <span className="hidden sm:inline">{t("circuitsTitle")}</span>
              </h2>
              <Link href="/circuits" className="text-sm font-bold text-brand-red sm:hidden">
                {t("seeAll")}
              </Link>
            </div>
          }
        >
          {circuits.map((circuit) => (
            <CircuitFeatureCard key={circuit.slug} circuit={circuit} cta="link" imageHeight="h-[190px] sm:h-[300px]" className="h-full" sizes="(min-width: 640px) 33vw, 82vw" />
          ))}
        </ScrollRow>
      </section>

      {/* BANDE BILLETTERIE */}
      <section className="relative mt-9 overflow-hidden bg-brand-red text-white sm:mt-[120px]">
        <div className="relative h-[200px] sm:absolute sm:inset-y-0 sm:right-0 sm:h-auto sm:w-[46%] sm:min-w-[320px]">
          <Image src="/images/avion-ciel.jpg" alt={t("planeAlt")} fill sizes="(min-width: 640px) 46vw, 100vw" className="object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,var(--color-brand-red)_100%)] sm:bg-[linear-gradient(90deg,var(--color-brand-red)_0%,transparent_45%)]" />
        </div>
        <div className="container-site relative -mt-10 flex flex-col gap-3.5 pb-8 sm:mt-0 sm:gap-7 sm:py-[88px]">
          <span className="hidden font-mono text-[13px] tracking-[0.16em] text-red-100 sm:block">{t("flightsEyebrow")}</span>
          <span aria-hidden="true" className="font-serif text-[92px] leading-[0.85] tracking-[-0.03em] italic sm:text-[clamp(110px,15vw,220px)]">
            {t("everywhere")}
          </span>
          <h2 className="max-w-[560px] text-[22px] leading-[1.15] font-bold sm:text-[clamp(30px,3.2vw,44px)] sm:leading-[1.05] sm:tracking-[-0.03em]">{t("flightsTitle")}</h2>
          <p className="hidden max-w-[520px] text-[17px] leading-relaxed text-red-25 sm:block">{t("flightsText")}</p>
          <RouteTicket to={{ code: "CDG", city: c.promoRoutes[0]?.city ?? "Paris" }} compact className="sm:hidden" />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/billetterie" variant="light" className="h-[54px] w-full px-[30px] sm:h-[58px] sm:w-auto">
              {t("requestTicket")} <Icon name="arrowRight" size={18} strokeWidth={2.2} />
            </ButtonLink>
            <span className="hidden sm:contents">
              <ButtonLink href={whatsappLink(t("whatsappFlight"))} variant="outline-light" className="h-[58px] px-[26px]">
                <Icon name="whatsapp" size={20} /> {t("byWhatsapp")}
              </ButtonLink>
            </span>
          </div>
        </div>
      </section>
      <section aria-label={t("routesLabel")} className="container-site relative z-10 -mt-14 hidden sm:block">
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4">
          {c.promoRoutes.map((r) => (
            <li key={r.to}>
              <RouteTicket from={{ code: "CKY", city: "Conakry" }} to={{ code: r.to, city: r.city }} />
            </li>
          ))}
        </ul>
      </section>

      {/* VIDÉO + CHIFFRES */}
      <section className="relative mt-[120px] hidden min-h-[560px] items-center justify-center overflow-hidden text-white sm:flex">
        <Image src="/images/cote-verte-aerien.jpg" alt={t("coastAlt")} fill sizes="100vw" className="object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
        <div className="relative flex max-w-[820px] flex-col items-center gap-[22px] px-6 pt-20 pb-[140px] text-center">
          <span className="kicker text-brand-gold">{t("adventureKicker")}</span>
          <h2 className="text-[clamp(38px,4.8vw,64px)] leading-none font-bold tracking-[-0.035em]">{t("adventureTitle")}</h2>
          <VideoButton
            ariaLabel={t("playVideo")}
            className="mt-2.5 flex size-24 items-center justify-center rounded-full bg-brand-gold text-ink shadow-[0_0_0_14px_rgb(227_169_53/0.25),0_0_0_28px_rgb(227_169_53/0.12)] transition-transform motion-safe:hover:scale-105"
          >
            <Icon name="play" size={32} />
          </VideoButton>
          {!site.videoId && <span className="text-[13px] text-on-dark-2">{t("videoPlaceholder")}</span>}
        </div>
      </section>
      <section aria-label={t("factsLabel")} className="relative z-10 mx-auto max-w-[1200px] px-4 pt-10 sm:-mt-20 sm:px-6 sm:pt-0">
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] sm:gap-0 sm:rounded-[var(--radius-lg)] sm:bg-white sm:shadow-[0_24px_60px_rgb(18_24_21/0.15)]">
          {c.facts.map((f, i) => (
            <li
              key={f.icon + i}
              className={clsx(
                "flex gap-1 rounded-[18px] bg-white p-4 shadow-[0_8px_22px_rgb(22_33_28/0.07)] sm:flex-row-reverse sm:items-center sm:justify-end sm:gap-4 sm:rounded-none sm:bg-transparent sm:p-8 sm:shadow-none",
                i < c.facts.length - 1 && "sm:border-r sm:border-line",
              )}
            >
              <span className="flex flex-col">
                <strong className="font-mono text-[22px] font-medium whitespace-nowrap text-night sm:text-[30px]">{f.value}</strong>
                <span className="text-xs text-subtle sm:text-[13px]">{f.label}</span>
              </span>
              <span aria-hidden="true" className={clsx("hidden size-14 shrink-0 items-center justify-center rounded-full sm:flex", f.tint)}>
                <Icon name={f.icon} size={24} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* POURQUOI NOUS */}
      <section className="container-site flex flex-wrap items-center gap-10 pt-16 sm:pt-[120px]">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-[18px]">
          <span className="kicker text-brand-red">{t("whyKicker")}</span>
          <h2 className="text-[clamp(34px,3.8vw,50px)] leading-[1.02] font-bold tracking-[-0.035em] text-night">{t("whyTitle")}</h2>
          <p className="leading-[1.7] text-muted">{t("whyText")}</p>
          <ButtonLink href="/a-propos" className="h-[54px] self-start px-[26px]">
            {t("learnMore")}
          </ButtonLink>
        </div>
        <div className="relative hidden h-[520px] min-w-0 flex-[1_1_340px] overflow-hidden rounded-[999px_999px_28px_28px] sm:block">
          <Image src="/images/voyageuse.jpg" alt={t("whyImageAlt")} fill sizes="(min-width: 1100px) 33vw, 50vw" className="object-cover" />
        </div>
        <ul className="flex min-w-0 flex-[1_1_340px] flex-col gap-[26px]">
          {c.whyUs.map((w) => (
            <li key={w.icon} className="flex gap-4">
              <span className={clsx("flex size-14 shrink-0 items-center justify-center rounded-[18px]", w.tint)}>
                <Icon name={w.icon} size={24} />
              </span>
              <span className="flex flex-col gap-1">
                <strong className="text-[19px] text-night">{w.title}</strong>
                <span className="text-[15px] leading-relaxed text-muted">{w.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="relative mt-10 overflow-hidden bg-night text-white sm:mt-[120px]">
        <Image src="/images/promeneurs-reflet.jpg" alt="" fill sizes="100vw" className="object-cover opacity-[0.18]" />
        <div className="relative mx-auto flex max-w-[900px] flex-col items-center gap-3.5 px-5 py-11 text-center sm:gap-[26px] sm:px-6 sm:py-[100px]">
          <span className="kicker text-brand-gold">{t("trustKicker")}</span>
          <h2 className="hidden text-[clamp(34px,4vw,52px)] leading-[1.02] font-bold tracking-[-0.035em] sm:block">{t("testimonialsTitle")}</h2>
          {c.testimonials.map((item) => (
            <figure key={item.name} className="flex flex-col items-center gap-3.5 sm:gap-[22px]">
              <span aria-hidden="true" className="font-serif text-[70px] leading-[0.4] text-brand-gold sm:text-[96px]">
                “
              </span>
              <blockquote className="text-lg leading-normal sm:text-[clamp(20px,2vw,26px)]">{item.quote}</blockquote>
              <figcaption className="flex flex-col items-center gap-2">
                <span aria-hidden="true" className="size-[52px] rounded-full border-[3px] border-brand-gold bg-night-muted sm:size-16" />
                <strong className="text-[15px] sm:text-[17px]">{item.name}</strong>
                <span className="hidden text-sm text-on-dark sm:block">{item.origin}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* BLOG */}
      <section className="container-site flex flex-col gap-3.5 pt-10 sm:gap-11 sm:pt-[110px]">
        <SectionHeading kicker={t("blogKicker")} title={t("blogTitle")} className="max-sm:items-start max-sm:text-left" />
        <ul className="grid gap-3.5 sm:grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] sm:gap-7">
          {posts.map((p) => (
            <li key={p.slug}>
              <article className={clsx("group relative flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-4", cardFocus)}>
                <div className="relative h-[90px] w-[110px] shrink-0 overflow-hidden rounded-2xl sm:h-[260px] sm:w-auto sm:rounded-3xl">
                  <Image src={p.image} alt={p.imageAlt} fill sizes="(min-width: 640px) 33vw, 110px" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
                </div>
                <div className="flex flex-col gap-1 sm:gap-4">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-brand-red uppercase sm:text-xs">{p.tag}</span>
                  <h3 className="text-base leading-tight font-bold text-night sm:text-[22px]">
                    <Link href={`/blog/${p.slug}`} className={stretchedLink}>
                      {p.title}
                    </Link>
                  </h3>
                  <span aria-hidden="true" className="hidden items-center gap-1.5 font-semibold text-night group-hover:text-brand-red sm:inline-flex">
                    {tc("readArticle")} <Icon name="arrowRight" size={16} strokeWidth={2.2} />
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* BANDE INSTAGRAM */}
      <section aria-label={t("instagram")} className="relative mt-10 hidden grid-cols-[repeat(auto-fit,minmax(min(200px,50%),1fr))] sm:mt-[110px] sm:grid">
        {c.instagramImages.map((img) => (
          <div key={img.src} className="relative h-60">
            <Image src={img.src} alt={img.alt} fill sizes="17vw" className="object-cover" />
          </div>
        ))}
        <a
          href={site.social.instagram}
          className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full bg-white px-[26px] py-4 font-bold whitespace-nowrap text-night shadow-[0_20px_40px_rgb(18_24_21/0.3)] hover:text-brand-red"
        >
          <Icon name="instagram" size={20} className="text-brand-red" />
          {site.social.instagramHandle}
        </a>
      </section>
      <div className="h-10 sm:hidden" />
    </>
  );
}

function MosaicTile({ item }: { item: MosaicItem }) {
  return (
    <article className={clsx("group relative h-[200px] overflow-hidden rounded-[var(--radius-panel)] text-white sm:h-[290px] sm:rounded-3xl", cardFocus)}>
      <Image src={item.image} alt={item.alt} fill sizes="(min-width: 1100px) 25vw, 50vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
      <div aria-hidden="true" className={photoGradient} />
      <div className="absolute right-3.5 bottom-3 left-3.5 flex flex-col gap-0.5 sm:right-5 sm:bottom-[18px] sm:left-5">
        <span className="hidden font-serif text-[19px] text-brand-gold italic sm:block">{item.eyebrow}</span>
        <h3 className="text-lg font-bold tracking-tight sm:text-2xl">
          <Link href={item.href} className={stretchedLink}>
            {item.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}
