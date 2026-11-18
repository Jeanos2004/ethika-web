import Image from "next/image";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { faqJsonLd, getFlightFaq } from "@/content/faq";
import { cityOf } from "@/content/airports";
import { parseFlightPrefill } from "@/lib/schemas/search";
import { phoneLink, whatsappLink } from "@/lib/site";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Accordion } from "@/components/ui/Accordion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RouteTicket } from "@/components/cards/RouteTicket";
import { FlightRequest } from "@/components/forms/FlightRequest";
import { getAgency } from "@/lib/content-source";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = metadataFor("billetterie");

/* Billetterie aérienne — référence : design/maquettes/Billetterie.dc.html. Textes : messages, espace « billetterie ». */

const serviceStyles: { icon: IconName; tint: string }[] = [
  { icon: "ticket", tint: "bg-brand-red text-white" },
  { icon: "searchPlus", tint: "bg-night text-white" },
  { icon: "refresh", tint: "bg-brand-green text-white" },
  { icon: "luggage", tint: "bg-brand-gold text-ink" },
  { icon: "users", tint: "bg-brand-red text-white" },
  { icon: "passport", tint: "bg-night text-white" },
];
const routes = ["CDG", "DSS", "IST", "JED", "ABJ", "CMN"];

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BilletteriePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("billetterie");
  const agency = await getAgency();
  const tc = await getTranslations("common");
  const page = await getPage("billetterie", locale);
  const prefill = parseFlightPrefill(await searchParams);
  const flightFaq = getFlightFaq(locale);
  const services = t.raw("services") as { title: string; text: string }[];
  const steps = t.raw("steps") as { title: string; text: string }[];

  return (
    <>
      <JsonLd data={faqJsonLd(flightFaq)} />
      <PageHero page={page} crumbs={[{ href: "/", label: tc("home") }, { label: page.title }]} bottomClassName="pb-[170px]">
        <p className="max-w-[600px] text-lg leading-relaxed text-on-dark-2">{t("intro")}</p>
      </PageHero>

      {/* FORMULAIRE + RÉCAPITULATIF */}
      <section id="demande" aria-label={t("requestLabel")} className="container-site relative z-10 -mt-[150px] scroll-mt-[calc(var(--header-h)+16px)]">
        <FlightRequest prefill={prefill} />
      </section>

      {/* PRESTATIONS */}
      <section className="container-site flex flex-col gap-11 pt-16 sm:pt-[110px]">
        <SectionHeading kicker={t("servicesKicker")} title={t("servicesTitle")} />
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {services.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3.5 rounded-[var(--radius-card)] bg-white p-[30px] shadow-[0_14px_40px_rgb(22_33_28/0.07)]">
              <span className={clsx("flex size-16 items-center justify-center rounded-full", serviceStyles[i]?.tint)}>
                <Icon name={serviceStyles[i]?.icon ?? "plane"} size={28} />
              </span>
              <h3 className="text-xl font-bold text-night">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 4 ÉTAPES */}
      <section className="relative mt-16 overflow-hidden text-white sm:mt-[110px]">
        <Image src="/images/ville-bord-de-mer.jpg" alt="" fill sizes="100vw" quality={90} className="object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-ink/80" />
        <div className="container-site relative flex flex-col gap-12 py-16 sm:py-24">
          <SectionHeading kicker={t("stepsKicker")} title={t("stepsTitle")} tone="dark" />
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-5">
            {steps.map((s, i) => {
              const last = i === steps.length - 1;
              return (
                <li key={s.title} className={clsx("flex flex-col gap-3 rounded-[var(--radius-card)] border border-white/20 p-7", last ? "bg-brand-red" : "bg-white/5")}>
                  <span aria-hidden="true" className={clsx("font-mono text-[54px] leading-none", last ? "text-white" : "text-brand-gold")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[21px] font-bold">{s.title}</h3>
                  <p className={clsx("text-[15px] leading-relaxed", last ? "text-red-25" : "text-on-dark-2")}>{s.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* QUELQUES DESTINATIONS */}
      <section className="container-site flex flex-col gap-10 pt-16 sm:pt-[110px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading kicker={t("routesKicker")} title={t("routesTitle")} align="left" />
          <span className="text-sm text-subtle">{t("routesNote")}</span>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(290px,100%),1fr))] gap-4">
          {routes.map((code) => (
            <li key={code}>
              <RouteTicket from={{ code: "CKY", city: "Conakry" }} to={{ code, city: cityOf(code, locale) }} tone="light" />
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="container-site flex flex-wrap items-start gap-14 pt-16 sm:pt-[110px]">
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-[18px]">
          <span className="kicker text-brand-red">{t("faqKicker")}</span>
          <h2 className="text-[clamp(34px,4vw,52px)] leading-[1.02] font-bold tracking-[-0.035em] text-night">{t("faqTitle")}</h2>
          <div className="relative mt-2.5 hidden h-[300px] overflow-hidden rounded-[999px_999px_28px_28px] sm:block">
            <Image src="/images/voyageuse.jpg" alt={t("faqImageAlt")} fill sizes="(min-width: 1100px) 33vw, 100vw" className="object-cover" />
          </div>
        </div>
        <Accordion className="min-w-0 flex-[1.4_1_520px] gap-3" defaultOpen={["q0"]} items={flightFaq.map((f, i) => ({ value: `q${i}`, title: f.question, content: f.answer }))} />
      </section>

      {/* CTA */}
      <section className="container-site py-16 sm:py-[110px]">
        <div className="relative flex flex-wrap items-center justify-between gap-7 overflow-hidden rounded-[var(--radius-xl)] bg-brand-red p-[clamp(28px,5vw,60px)] text-white">
          <Image src="/brand/symbole-blanc.svg" alt="" width={320} height={320} className="pointer-events-none absolute -top-10 -right-10 w-[320px] opacity-10" />
          <div className="relative flex max-w-[640px] flex-col gap-2.5">
            <span className="kicker text-red-100">{t("ctaKicker")}</span>
            <h2 className="text-[clamp(30px,3.4vw,46px)] leading-[1.05] font-bold tracking-[-0.03em]">{t("ctaTitle")}</h2>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <ButtonLink href={whatsappLink(t("ctaWhatsapp"))} variant="light" className="h-[58px] px-7">
              <Icon name="whatsapp" size={20} /> {tc("whatsapp")}
            </ButtonLink>
            <ButtonLink href={phoneLink(agency.phone)} variant="outline-light" className="h-[58px] px-[26px]">
              {agency.phone}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
