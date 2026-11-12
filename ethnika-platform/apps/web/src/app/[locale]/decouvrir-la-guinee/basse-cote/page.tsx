import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { SectionNav } from "@/components/sections/SectionNav";

export const generateMetadata = metadataFor("basseCote");

/* La Basse Côte — référence : design/maquettes/BasseCote.dc.html. Textes : messages, espace « basseCote ». */

const tocIds = ["boffa", "bel-air", "sobane", "koba", "dubreka", "conakry"] as const;
const villageStyles = [
  { id: "sobane-village", image: "/images/plage-sable-couchant.jpg" },
  { id: "kitikata", image: "/images/pecheurs-couchant.jpg" },
  { id: "koba", image: "/images/promeneurs-reflet.jpg" },
];
const conakryBeaches = ["Lambanyi", "Rogbané", "Camayenne", "Kipé", "Sogbané", "Milo"];

const anchor = "scroll-mt-[calc(var(--header-h)+24px)]";

export default async function BasseCotePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("basseCote");
  const tc = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const tUi = await getTranslations("ui");
  const page = await getPage("basseCote", locale);
  const villages = t.raw("villages") as { n: string; title: string; alt: string; text: string }[];

  return (
    <>
      <PageHero page={page} crumbs={[{ href: "/", label: tc("home") }, { href: "/decouvrir-la-guinee", label: tNav("guinee") }, { label: tNav("basseCote") }]}>
        <p className="max-w-[660px] text-lg leading-relaxed text-on-dark-2">{t("intro")}</p>
      </PageHero>

      <SectionNav sections={tocIds.map((id) => ({ id, label: t(`toc.${id}`) }))} label={tUi("onThisPage")} variant="pills" />

      {/* BOFFA */}
      <section id="boffa" className={`container-site flex flex-wrap items-center gap-14 pt-16 sm:pt-[100px] ${anchor}`}>
        <div className="relative h-[340px] min-w-0 flex-[1_1_480px] overflow-hidden rounded-[var(--radius-lg)] sm:h-[500px]">
          <Image src="/images/port-barques.jpg" alt={t("boffaImageAlt")} fill sizes="(min-width: 1100px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-[18px]">
          <span className="font-mono text-xs tracking-[0.14em] text-brand-red">{t("boffaEyebrow")}</span>
          <h2 className="text-[clamp(34px,3.8vw,52px)] leading-[1.02] font-bold tracking-[-0.035em] text-night">{t("boffaTitle")}</h2>
          <p className="text-[17px] leading-[1.7] text-muted">{t("boffaText")}</p>
          <ul className="flex flex-wrap gap-2.5">
            {(t.raw("boffaChips") as string[]).map((chip) => (
              <li key={chip} className="rounded-full bg-red-50 px-3.5 py-[9px] text-sm font-semibold text-red-700">
                {chip}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* BEL-AIR */}
      <section id="bel-air" className={`relative mt-16 flex min-h-[560px] items-end overflow-hidden text-white sm:mt-[110px] ${anchor}`}>
        <Image src="/images/cocotiers-couchant.jpg" alt={t("belAirImageAlt")} fill sizes="100vw" quality={90} className="object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgb(18_24_21/0.9)_0%,rgb(18_24_21/0.4)_60%,rgb(18_24_21/0.1)_100%)]" />
        <div className="container-site relative flex flex-wrap items-end justify-between gap-8 py-20">
          <div className="flex max-w-[600px] flex-col gap-4">
            <span className="font-mono text-xs tracking-[0.14em] text-brand-gold">{t("belAirEyebrow")}</span>
            <h2 className="text-[clamp(36px,4.4vw,60px)] leading-none font-bold tracking-[-0.035em]">{t("belAirTitle")}</h2>
            <p className="text-[17px] leading-[1.7] text-on-dark-2">{t("belAirText")}</p>
          </div>
          <ul className="flex gap-3.5">
            {(t.raw("belAirFacts") as { value: string; label: string }[]).map((f) => (
              <li key={f.value} className="rounded-[var(--radius-md)] border border-white/20 bg-white/10 px-6 py-5">
                <span className="font-mono text-[34px] text-brand-gold">{f.value}</span>
                <span className="block text-[13px] text-on-dark-2">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* VILLAGES */}
      <section id="sobane" className={`container-site flex flex-col gap-9 pt-16 sm:pt-[110px] ${anchor}`}>
        <div className="flex flex-col gap-2">
          <span className="kicker text-brand-red">{t("villagesKicker")}</span>
          <h2 className="text-[clamp(34px,4vw,54px)] leading-none font-bold tracking-[-0.035em] text-night">{t("villagesTitle")}</h2>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-[22px]">
          {villages.map((v, i) => (
            <li key={v.title} id={villageStyles[i]?.id} className={`overflow-hidden rounded-[var(--radius-card)] bg-white shadow-md ${anchor}`}>
              <div className="relative h-60">
                <Image src={villageStyles[i]?.image ?? ""} alt={v.alt} fill sizes="(min-width: 1100px) 33vw, 100vw" className="object-cover" />
              </div>
              <div className="flex flex-col gap-2.5 p-6">
                <span className="font-mono text-[11px] tracking-[0.12em] text-brand-red">{v.n}</span>
                <h3 className="text-2xl font-bold text-night">{v.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{v.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* DUBRÉKA */}
      <section id="dubreka" className={`container-site pt-16 sm:pt-[110px] ${anchor}`}>
        <div className="flex flex-wrap overflow-hidden rounded-[var(--radius-xl)] bg-brand-green text-white">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-[18px] p-[clamp(28px,5vw,64px)]">
            <span className="font-mono text-xs tracking-[0.14em] text-gold-50">{t("dubrekaEyebrow")}</span>
            <h2 className="text-[clamp(34px,3.8vw,52px)] leading-[1.02] font-bold tracking-[-0.035em]">{t("dubrekaTitle")}</h2>
            <p className="text-[17px] leading-[1.7] text-green-50">{t("dubrekaText")}</p>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
              {(t.raw("dubrekaItems") as string[]).map((item) => (
                <li key={item} className="rounded-[18px] bg-white/10 p-4 font-bold">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative min-h-[300px] flex-[1_1_420px] sm:min-h-[440px]">
            <Image src="/images/dubreka-riviere-pirogue.jpg" alt={t("dubrekaImageAlt")} fill sizes="(min-width: 1100px) 45vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* CONAKRY */}
      <section id="conakry" className={`container-site flex flex-col gap-8 pt-16 sm:pt-[110px] ${anchor}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs tracking-[0.14em] text-brand-red">{t("conakryEyebrow")}</span>
            <h2 className="text-[clamp(34px,4vw,54px)] leading-none font-bold tracking-[-0.035em] text-night">{t("conakryTitle")}</h2>
          </div>
          <p className="max-w-[440px] leading-relaxed text-muted">{t("conakryText")}</p>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-3.5">
          {conakryBeaches.map((b) => (
            <li key={b} className="rounded-[var(--radius-md)] bg-white p-[22px] text-lg font-bold text-night shadow-[0_10px_30px_rgb(22_33_28/0.06)]">
              {b}
            </li>
          ))}
        </ul>
      </section>

      {/* CIRCUIT CONSEILLÉ */}
      <section className="container-site py-16 sm:py-[110px]">
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-[var(--radius-xl)] bg-sand p-[clamp(28px,5vw,64px)]">
          <div className="flex max-w-[640px] flex-col gap-3">
            <span className="kicker text-brand-red">{t("ctaKicker")}</span>
            <h2 className="text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-bold tracking-[-0.03em] text-night">{t("ctaTitle")}</h2>
            <p className="leading-relaxed text-muted">{t("ctaText")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/circuits/bel-air-sobane-kitikata" className="h-14 px-7">
              {t("seeCircuit")}
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" className="h-14 px-[26px]">
              {t("tailorMade")}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
