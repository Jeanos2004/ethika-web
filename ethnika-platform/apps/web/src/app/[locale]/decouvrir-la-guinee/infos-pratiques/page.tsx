import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { whatsappLink } from "@/lib/site";
import { PageHero } from "@/components/layout/PageHero";
import { Icon } from "@/components/ui/Icon";
import { SectionNav } from "@/components/sections/SectionNav";

export const generateMetadata = metadataFor("infos");

/* Infos pratiques & santé — référence : design/maquettes/InfosPratiques.dc.html. Textes : messages, espace « infos ». */

const tocIds = ["saison", "formalites", "vaccins", "paludisme", "quotidien", "argent"] as const;
const seasonStyles = [
  { border: "border-t-brand-gold", tint: "text-gold-700" },
  { border: "border-t-brand-green", tint: "text-brand-green" },
];
const vaccineTones = ["bg-red-50 text-red-700", "bg-green-50 text-green-700", "bg-green-50 text-green-700", "bg-green-50 text-green-700", "bg-line text-muted"];

const h2 = "text-[clamp(30px,3.2vw,42px)] font-bold tracking-[-0.03em]";
const anchor = "scroll-mt-[calc(var(--header-h)+24px)]";

export default async function InfosPratiquesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("infos");
  const tc = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const page = await getPage("infos", locale);
  const vaccines = t.raw("vaccines") as { name: string; status: string; note: string }[];

  return (
    <>
      <PageHero page={page} crumbs={[{ href: "/", label: tc("home") }, { href: "/decouvrir-la-guinee", label: tNav("guinee") }, { label: tNav("infos") }]} />

      <div className="container-site flex flex-wrap items-start gap-12 pt-14 pb-16 sm:pt-[72px] sm:pb-[110px]">
        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:max-w-[280px]">
          <SectionNav sections={tocIds.map((id) => ({ id, label: t(`toc.${id}`) }))} label={t("tocLabel")} variant="toc" />
          <div className="flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-night p-[22px] text-white">
            <strong className="text-[17px]">{t("questionTitle")}</strong>
            <p className="text-sm leading-normal text-on-dark">{t("questionText")}</p>
            <a
              href={whatsappLink(t("whatsappMessage"))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[46px] items-center justify-center gap-2 rounded-full bg-brand-green text-sm font-bold text-white hover:bg-brand-green-dark"
            >
              <Icon name="whatsapp" size={16} /> {tc("whatsapp")}
            </a>
          </div>
        </aside>

        <div className="flex min-w-0 flex-[1_1_640px] flex-col gap-16">
          <div role="note" className="flex gap-3.5 rounded-[18px] bg-gold-50 px-[22px] py-[18px] text-[15px] leading-relaxed text-gold-700">
            <Icon name="info" size={22} className="mt-0.5 shrink-0" />
            <p>{t.rich("disclaimer", { b: (chunks) => <strong>{chunks}</strong> })}</p>
          </div>

          <section id="saison" className={clsx("flex flex-col gap-[18px]", anchor)}>
            <h2 className={clsx(h2, "text-night")}>{t("toc.saison")}</h2>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
              {(t.raw("seasons") as { period: string; title: string; text: string }[]).map((s, i) => (
                <li key={s.title} className={clsx("rounded-[var(--radius-md)] border-t-[5px] bg-white p-6 shadow-[0_10px_30px_rgb(22_33_28/0.06)]", seasonStyles[i]?.border)}>
                  <span className={clsx("font-mono text-[22px]", seasonStyles[i]?.tint)}>{s.period}</span>
                  <h3 className="my-1.5 font-bold text-night">{s.title}</h3>
                  <p className="text-[15px] leading-relaxed text-muted">{s.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="formalites" className={clsx("flex flex-col gap-3.5", anchor)}>
            <h2 className={clsx(h2, "text-night")}>{t("toc.formalites")}</h2>
            <p className="text-[17px] leading-[1.7] text-muted">{t("formalitiesText")}</p>
          </section>

          <section id="vaccins" className={clsx("flex flex-col gap-[18px]", anchor)}>
            <h2 className={clsx(h2, "text-night")}>{t("toc.vaccins")}</h2>
            <div role="region" aria-label={t("vaccinesRegion")} tabIndex={0} className="overflow-x-auto rounded-[var(--radius-md)] border border-line bg-white">
              <table className="w-full min-w-[560px] border-collapse text-[15px]">
                <caption className="sr-only">{t("vaccinesCaption")}</caption>
                <thead>
                  <tr className="bg-night text-left text-white">
                    <th scope="col" className="px-[18px] py-3.5">
                      {t("colVaccine")}
                    </th>
                    <th scope="col" className="px-[18px] py-3.5">
                      {t("colStatus")}
                    </th>
                    <th scope="col" className="px-[18px] py-3.5">
                      {t("colNote")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vaccines.map((v, i) => (
                    <tr key={v.name} className={clsx("border-t border-line", i % 2 === 1 && "bg-cream")}>
                      <th scope="row" className="px-[18px] py-4 text-left font-bold">
                        {v.name}
                      </th>
                      <td className="px-[18px] py-4">
                        <span className={clsx("rounded-full px-2.5 py-[5px] text-[13px] font-bold whitespace-nowrap", vaccineTones[i])}>{v.status}</span>
                      </td>
                      <td className="px-[18px] py-4 leading-normal text-muted">{v.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="paludisme" className={clsx("flex flex-col gap-4 rounded-[var(--radius-lg)] bg-brand-green p-[clamp(26px,4vw,44px)] text-white", anchor)}>
            <h2 className={h2}>{t("toc.paludisme")}</h2>
            <p className="text-[17px] leading-[1.7] text-green-50">{t("malariaText")}</p>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
              {(t.raw("malaria") as string[]).map((m) => (
                <li key={m} className="rounded-2xl bg-white/10 p-4">
                  {m}
                </li>
              ))}
            </ul>
          </section>

          <section id="quotidien" className={clsx("flex flex-col gap-[18px]", anchor)}>
            <h2 className={clsx(h2, "text-night")}>{t("toc.quotidien")}</h2>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4">
              {(t.raw("daily") as { title: string; text: string }[]).map((d) => (
                <li key={d.title} className="rounded-[var(--radius-panel)] bg-white p-[22px] shadow-[0_10px_30px_rgb(22_33_28/0.06)]">
                  <h3 className="font-bold text-night">{d.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{d.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="argent" className={clsx("flex flex-col gap-[18px]", anchor)}>
            <h2 className={clsx(h2, "text-night")}>{t("toc.argent")}</h2>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
              {(t.raw("money") as { code: string; text: string }[]).map((m) => (
                <li key={m.code} className="rounded-[var(--radius-panel)] bg-sand p-[22px]">
                  <span className="font-mono text-[22px] text-brand-red">{m.code}</span>
                  <p className="mt-1.5 text-[15px] text-muted">{m.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-[13px] leading-relaxed text-subtle">{t("sources")}</p>
        </div>
      </div>
    </>
  );
}
