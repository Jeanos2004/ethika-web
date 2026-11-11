import type { ReactNode } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { getAgency } from "@/lib/content-source";
import { CtaBanner } from "@/components/sections/CtaBanner";

export const generateMetadata = metadataFor("apropos");

/* À propos — référence : design/maquettes/APropos.dc.html. Textes : messages, espace « apropos ». */

const tradeStyles: { icon: IconName; tint: string }[] = [
  { icon: "plane", tint: "bg-night" },
  { icon: "mountain", tint: "bg-brand-red" },
];
const serifGold = (chunks: ReactNode) => <span className="font-serif font-normal text-brand-gold italic">{chunks}</span>;

export default async function AProposPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("apropos");
  const agency = await getAgency();
  const tc = await getTranslations("common");
  const page = await getPage("apropos", locale);
  const promises = t.raw("promises") as { title: string; text: string }[];
  const credentials = [
    { label: t("credLicence"), value: t("credLicenceValue", { value: agency.licence }), pending: false },
    { label: t("credRccm"), value: `RCCM ${agency.rccm}`, pending: false },
    { label: t("credIata"), value: t("credIataValue"), pending: true },
    { label: t("credAmadeus"), value: t("credAmadeusValue"), pending: true },
  ];

  return (
    <>
      <PageHero page={page} crumbs={[{ href: "/", label: tc("home") }, { label: page.title }]} />

      {/* NOTRE HISTOIRE */}
      <section className="container-site flex flex-wrap items-center gap-16 pt-16 sm:pt-[110px]">
        <div className="relative h-[460px] min-w-0 flex-[1_1_500px] sm:h-[580px]">
          <div className="absolute top-0 left-0 h-[340px] w-[70%] overflow-hidden rounded-[var(--radius-lg)] sm:h-[440px]">
            <Image src="/images/cote-verte-aerien.jpg" alt={t("img1Alt")} fill sizes="(min-width: 1100px) 35vw, 70vw" className="object-cover" />
          </div>
          <div className="absolute right-0 bottom-0 h-[260px] w-[52%] overflow-hidden rounded-[999px_999px_28px_28px] border-8 border-cream sm:h-[320px]">
            <Image src="/images/pecheurs-couchant.jpg" alt={t("img2Alt")} fill sizes="(min-width: 1100px) 26vw, 52vw" className="object-cover" />
          </div>
          <div className="absolute bottom-10 left-[6%] flex max-w-[220px] flex-col gap-1 rounded-[var(--radius-md)] bg-brand-red px-[22px] py-5 text-white">
            <span className="font-serif text-2xl italic">{t("since")}</span>
            <span className="text-[13px] leading-snug text-red-25">{t("yearPending")}</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-5">
          <span className="kicker text-brand-red">{t("storyKicker")}</span>
          <h2 className="text-[clamp(34px,3.8vw,50px)] leading-[1.02] font-bold tracking-[-0.035em] text-night">{t("storyTitle")}</h2>
          <p className="text-[17px] leading-[1.7] text-muted">{t("storyText")}</p>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
            {(t.raw("trades") as { title: string; text: string }[]).map((tr, i) => (
              <li key={tr.title} className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-white p-[22px] shadow-[0_10px_30px_rgb(22_33_28/0.07)]">
                <span className={clsx("flex size-12 items-center justify-center rounded-full text-white", tradeStyles[i]?.tint)}>
                  <Icon name={tradeStyles[i]?.icon ?? "plane"} size={22} />
                </span>
                <h3 className="text-lg font-bold text-night">{tr.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{tr.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PROMESSE */}
      <section className="relative mt-16 overflow-hidden bg-night text-white sm:mt-[110px]">
        <Image src="/brand/symbole-or.svg" alt="" width={520} height={520} className="pointer-events-none absolute -top-24 -right-24 w-[520px] opacity-[0.06]" />
        <div className="container-site relative flex flex-col gap-14 py-16 sm:py-24">
          <p className="text-center text-[clamp(36px,5vw,72px)] leading-[1.02] font-bold tracking-[-0.04em]">{t.rich("motto", { em: serifGold })}</p>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-[18px]">
            {promises.map((p, i) => {
              const last = i === promises.length - 1;
              return (
                <li key={p.title} className={clsx("flex flex-col gap-2.5 rounded-3xl border p-[26px]", last ? "border-brand-red bg-brand-red" : "border-night-muted")}>
                  <span aria-hidden="true" className={clsx("font-mono text-sm", last ? "text-red-100" : "text-brand-gold")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-bold">{p.title}</h3>
                  <p className={clsx("text-[15px] leading-normal", last ? "text-red-25" : "text-on-dark")}>{p.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* CLIENTS */}
      <section className="container-site flex flex-col items-center gap-7 pt-16 text-center sm:pt-[110px]">
        <SectionHeading kicker={t("clientsKicker")} title={t("clientsTitle")} />
        <ul className="flex max-w-[900px] flex-wrap justify-center gap-2.5">
          {(t.raw("clientTypes") as string[]).map((c) => (
            <li key={c} className="rounded-full bg-white px-5 py-3 font-semibold shadow-[0_8px_24px_rgb(22_33_28/0.07)]">
              {c}
            </li>
          ))}
        </ul>
        <ul aria-label={t("logosLabel")} className="mt-2.5 grid w-full grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3.5">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex h-20 items-center justify-center rounded-[18px] border-[1.5px] border-dashed border-line-strong font-mono text-xs text-subtle">
              {t("logoPlaceholder")}
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-subtle">{t("logosNote")}</p>
      </section>

      {/* ÉQUIPE */}
      <section className="container-site flex flex-col gap-10 pt-16 sm:pt-[110px]">
        <SectionHeading kicker={t("teamKicker")} title={t("teamTitle")} />
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-[22px]">
          {(t.raw("team") as string[]).map((role) => (
            <li key={role} className="flex flex-col items-center gap-3.5 text-center">
              <div aria-hidden="true" className="flex h-[300px] w-full items-center justify-center rounded-[999px_999px_26px_26px] bg-line font-mono text-xs text-subtle">
                {t("photo")}
              </div>
              <strong className="text-[19px] text-night">{t("name")}</strong>
              <span className="font-serif text-lg text-brand-red italic">{role}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* AGRÉMENTS */}
      <section className="container-site pt-16 sm:pt-[110px]">
        <div className="flex flex-col gap-[30px] rounded-[34px] bg-sand p-[clamp(24px,4vw,56px)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="kicker text-brand-red">{t("trustKicker")}</span>
              <h2 className="text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-bold tracking-[-0.03em] text-night">{t("trustTitle")}</h2>
            </div>
            <p className="max-w-[420px] text-[13px] leading-normal text-subtle">{t("trustNote")}</p>
          </div>
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-4">
            {credentials.map((c) => (
              <div key={c.label} className={clsx("flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-white p-[22px]", c.pending && "border-[1.5px] border-dashed border-line-strong")}>
                <dt className="text-[13px] text-subtle">{c.label}</dt>
                <dd className="font-mono font-medium text-night">{c.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CtaBanner
        image="/images/cocotiers-couchant.jpg"
        imageAlt={t("ctaImageAlt")}
        title={t.rich("ctaTitle", { em: serifGold })}
        actions={
          <>
            <ButtonLink href="/billetterie" variant="gold" className="h-14 px-7">
              {t("ctaTicket")}
            </ButtonLink>
            <ButtonLink href="/circuits" variant="outline-light" className="h-14 px-[26px]">
              {tc("seeCircuits")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
