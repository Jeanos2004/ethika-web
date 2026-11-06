import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { metadataFor } from "@/content/pages";
import { leadTypes, type LeadType } from "@/lib/schemas/lead";
import { whatsappLink } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const generateMetadata = metadataFor("merci");

/*
 * Confirmation d'une demande — référence : design/maquettes/Merci.dc.html
 * La référence (?ref=) n'est affichée que si elle respecte le format des références ETHNIKA.
 * Aucune donnée personnelle ne transite par l'URL.
 */

const REF = /^ETH-[A-Z0-9]{2,12}(?:-[A-Z0-9]{2,12}){0,2}$/;

const stepStyles = [
  { border: "border-t-brand-green", tint: "text-brand-green" },
  { border: "border-t-brand-gold", tint: "text-gold-700" },
  { border: "border-t-brand-red", tint: "text-brand-red" },
];

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MerciPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("merci");
  const tc = await getTranslations("common");
  const query = await searchParams;
  const raw = (k: string) => {
    const v = query[k];
    return (Array.isArray(v) ? v[0] : v)?.slice(0, 40);
  };
  const ref = raw("ref");
  const reference = ref && REF.test(ref) ? ref : undefined;
  const rawType = raw("type");
  const type = rawType && (leadTypes as readonly string[]).includes(rawType) ? t(`types.${rawType as LeadType}`) : undefined;
  const today = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "long", timeZone: "Africa/Conakry" }).format(new Date());
  const steps = t.raw("steps") as { tag: string; title: string; text: string }[];

  return (
    <>
      <section className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-12 px-4 pt-16 sm:px-6 sm:pt-20">
        <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-[18px]">
          <span className="flex size-[84px] items-center justify-center rounded-[42px_42px_18px_18px] bg-brand-green text-white">
            <Icon name="check" size={38} strokeWidth={2.4} />
          </span>
          <span className="kicker text-brand-red">{t("kicker")}</span>
          <h1 className="text-[clamp(42px,5.2vw,72px)] leading-[0.98] font-bold tracking-[-0.045em] text-night">{t("title")}</h1>
          <p className="text-lg leading-[1.65] text-muted">{t("text")}</p>
          <div className="mt-1.5 flex flex-wrap gap-3">
            <ButtonLink href="/" variant="secondary" className="h-[54px] px-6">
              {t("backHome")}
            </ButtonLink>
            <ButtonLink href="/decouvrir-la-guinee" variant="outline" className="h-[54px] px-6">
              {t("discover")}
            </ButtonLink>
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_380px] overflow-hidden rounded-[var(--radius-lg)] bg-night text-white shadow-[0_24px_60px_rgb(22_33_28/0.18)]">
          <div className="flex items-center justify-between gap-3 border-b border-dashed border-night-muted px-[26px] py-[22px]">
            <span className="font-mono text-xs tracking-[0.12em] text-on-dark-muted">{t("summary")}</span>
            <span className="rounded-full bg-brand-gold px-3 py-1.5 text-xs font-bold text-ink">{t("processing")}</span>
          </div>
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(140px,100%),1fr))] gap-x-3.5 gap-y-4 px-[26px] py-6">
            <div className="col-span-full">
              <dt className="font-mono text-[11px] text-on-dark-muted">{t("reference")}</dt>
              <dd className="font-mono text-[30px] text-brand-gold">{reference ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] text-on-dark-muted">{t("type")}</dt>
              <dd className="font-bold">{type ?? t("request")}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] text-on-dark-muted">{t("date")}</dt>
              <dd className="font-bold">{today}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 pt-16 pb-16 sm:px-6 sm:pt-20 sm:pb-[110px]">
        <h2 className="text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em] text-night">{t("nextTitle")}</h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
          {steps.map((s, i) => (
            <li key={s.tag} className={clsx("rounded-[var(--radius-md)] border-t-[5px] bg-white p-6 shadow-[0_10px_30px_rgb(22_33_28/0.06)]", stepStyles[i]?.border)}>
              <span className={clsx("font-mono", stepStyles[i]?.tint)}>{s.tag}</span>
              <h3 className="mt-2 mb-1 text-lg font-bold text-night">{s.title}</h3>
              <p className="text-[15px] text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-3.5 rounded-[var(--radius-panel)] bg-green-50 px-6 py-5 text-[15px] text-green-700">
          <strong>{t("fasterTitle")}</strong>
          <span>{t("fasterText")}</span>
          <ButtonLink href={whatsappLink(reference ? t("whatsappRef", { ref: reference }) : t("whatsappHello"))} variant="whatsapp" className="h-[46px] px-5 sm:ml-auto">
            {tc("whatsapp")}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
