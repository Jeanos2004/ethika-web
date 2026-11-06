import Image from "next/image";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { parseProPrefill } from "@/lib/schemas/search";
import { site } from "@/lib/site";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ProRequestForm } from "@/components/forms/ProRequestForm";

export const generateMetadata = metadataFor("services");

/* Services — référence : design/maquettes/Services.dc.html. Textes : messages, espace « services ». */

const segmentStyles = [
  { id: "groupes", image: "/images/voyageuse.jpg", dark: false },
  { id: "pelerinages", image: undefined, dark: true },
  { id: "professionnels", image: "/images/ville-bord-de-mer.jpg", dark: false },
];
const extraStyles: { icon: IconName; tint: string }[] = [
  { icon: "shieldCheck", tint: "bg-red-50 text-red-700" },
  { icon: "homeHeart", tint: "bg-gold-50 text-gold-700" },
  { icon: "plane", tint: "bg-green-50 text-green-700" },
  { icon: "passport", tint: "bg-line text-night" },
  { icon: "mountainSun", tint: "bg-red-50 text-red-700" },
  { icon: "calendar", tint: "bg-green-50 text-green-700" },
];

type Segment = { n: string; title: string; text: string; points: string[]; alt?: string; note?: string };
const anchor = "scroll-mt-[calc(var(--header-h)+24px)]";
type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ServicesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const tc = await getTranslations("common");
  const page = await getPage("services", locale);
  const prefill = parseProPrefill(await searchParams);
  const segments = t.raw("segments") as Segment[];

  return (
    <>
      <PageHero page={page} crumbs={[{ href: "/", label: tc("home") }, { label: page.title }]} />

      {/* 3 SEGMENTS */}
      <section aria-label={t("segmentsLabel")} className="container-site grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-[22px] pt-16 sm:pt-24">
        {segments.map((s, i) => {
          const style = segmentStyles[i];
          const dark = style?.dark ?? false;
          return (
            <article key={s.n} id={style?.id} className={clsx("flex flex-col overflow-hidden rounded-[var(--radius-lg)]", anchor, dark ? "bg-night text-white" : "bg-white shadow-md")}>
              <div className={clsx("relative flex h-60 items-center justify-center", dark && "bg-night-deep")}>
                {style?.image ? (
                  <Image src={style.image} alt={s.alt ?? ""} fill sizes="(min-width: 1100px) 33vw, 100vw" className="object-cover" />
                ) : (
                  <Image src="/brand/symbole-or.svg" alt="" width={200} height={200} className="w-[200px] opacity-90" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3.5 p-7">
                <span className={clsx("font-mono text-[11px] tracking-[0.14em]", dark ? "text-brand-gold" : "text-brand-red")}>{s.n}</span>
                <h2 className={clsx("text-[28px] font-bold tracking-tight", !dark && "text-night")}>{s.title}</h2>
                <p className={clsx("text-[15px] leading-[1.65]", dark ? "text-on-dark" : "text-muted")}>{s.text}</p>
                <ul className={clsx("list-disc pl-[18px] text-[15px] leading-[1.9]", dark ? "text-on-dark-2" : "text-night")}>
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {s.note && <p className="text-xs text-on-dark-muted">{s.note}</p>}
              </div>
            </article>
          );
        })}
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="container-site flex flex-col gap-10 pt-16 sm:pt-[110px]">
        <SectionHeading kicker={t("howKicker")} title={t("howTitle")} />
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-[18px]">
          {(t.raw("steps") as { title: string; text: string }[]).map((s, i) => (
            <li key={s.title} className="flex flex-col gap-2.5 rounded-3xl bg-sand p-[26px]">
              <span aria-hidden="true" className="font-mono text-[34px] text-brand-red">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[19px] font-bold text-night">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* SERVICES COMPLÉMENTAIRES */}
      <section className="container-site flex flex-col gap-8 pt-16 sm:pt-[110px]">
        <h2 className="text-[clamp(32px,3.6vw,48px)] font-bold tracking-[-0.035em] text-night">{t("extrasTitle")}</h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-3.5">
          {(t.raw("extras") as string[]).map((label, i) => (
            <li key={label} className="flex items-center gap-3.5 rounded-[var(--radius-panel)] bg-white p-5 shadow-[0_10px_30px_rgb(22_33_28/0.06)]">
              <span aria-hidden="true" className={clsx("flex size-[46px] shrink-0 items-center justify-center rounded-[14px]", extraStyles[i]?.tint)}>
                <Icon name={extraStyles[i]?.icon ?? "check"} size={20} />
              </span>
              <strong className="text-night">{label}</strong>
            </li>
          ))}
        </ul>
      </section>

      {/* DEVIS PRO */}
      <section id="devis-pro" className={clsx("container-site py-16 sm:py-[110px]", anchor)}>
        <div className="flex flex-wrap gap-12 rounded-[var(--radius-xl)] bg-night p-[clamp(24px,5vw,60px)] text-white">
          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
            <span className="kicker text-brand-gold">{t("proKicker")}</span>
            <h2 className="text-[clamp(32px,3.6vw,48px)] leading-[1.02] font-bold tracking-[-0.035em]">{t("proTitle")}</h2>
            <p className="leading-[1.65] text-on-dark">{t("proText")}</p>
            <div className="mt-2.5 flex flex-col gap-2 text-[15px]">
              <span className="flex items-center gap-2">
                <Icon name="phone" size={16} className="text-brand-gold" /> {site.contact.phone}
              </span>
              <span className="flex items-center gap-2">
                <Icon name="mail" size={16} className="text-brand-gold" /> {t("groupsEmail")}
              </span>
            </div>
          </div>
          <ProRequestForm prefill={prefill} />
        </div>
      </section>
    </>
  );
}
