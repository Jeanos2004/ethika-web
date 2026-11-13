import { clsx } from "clsx";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { legalDoc, legalDocs, legalOrder, type LegalKey } from "@/content/legal";
import { ManageCookies } from "@/components/sections/ManageCookies";

/** Document légal (Legal.dc.html) : navigation entre les 4 documents, sections numérotées. */
/** En anglais : traduction informative, la version française fait foi (signalé au lecteur). */
export async function LegalLayout({ doc }: { doc: LegalKey }) {
  const t = await getTranslations("legal");
  const locale = await getLocale();
  const d = legalDoc(doc, locale);
  return (
    <>
      <section className="mx-auto flex max-w-[1100px] flex-col gap-3.5 px-4 pt-16 sm:px-6">
        <span className="kicker text-brand-red">{t("kicker")}</span>
        <h1 className="text-[clamp(44px,5.4vw,80px)] leading-[0.96] font-bold tracking-[-0.045em] text-night">{t("title")}</h1>
        <p role="note" className="mt-2 rounded-2xl bg-gold-50 px-[18px] py-3.5 text-sm leading-normal text-gold-700">
          {t("note")}
        </p>
      </section>
      <section className="mx-auto flex max-w-[1100px] flex-wrap items-start gap-10 px-4 pt-9 pb-16 sm:px-6 sm:pb-[110px]">
        <nav aria-label={t("docsLabel")} className="flex min-w-0 flex-[0_1_260px] flex-col gap-1.5 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
          {legalOrder.map((k) => {
            const active = k === doc;
            return (
              <Link
                key={k}
                href={legalDocs[k].path}
                aria-current={active ? "page" : undefined}
                className={clsx("flex h-[54px] items-center justify-between rounded-2xl px-[18px] font-semibold transition-colors", active ? "bg-night text-white" : "text-night hover:bg-sand")}
              >
                {t(`tabs.${k}`)}
                {active && (
                  <span aria-hidden="true" className="text-brand-gold">
                    →
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <article lang={locale} className="flex min-w-0 flex-[1_1_560px] flex-col gap-[26px] rounded-[var(--radius-lg)] bg-white p-[clamp(24px,4vw,48px)] shadow-[0_14px_40px_rgb(22_33_28/0.07)]">
          {locale !== "fr" && (
            <div lang={locale} role="note" className="rounded-2xl bg-gold-50 px-[18px] py-3 text-sm text-gold-700">
              {t("frenchOnly")}
            </div>
          )}
          <div className="flex flex-col gap-2 border-b border-line pb-5">
            <h2 className="text-[clamp(30px,3.2vw,42px)] font-bold tracking-[-0.03em] text-night">{d.title}</h2>
            <span className="font-mono text-xs text-subtle">{t("updated")}</span>
          </div>
          {d.sections.map((s, i) => (
            <section key={s.title} className="flex flex-col gap-2">
              <h3 className="text-xl font-bold text-night">
                <span className="mr-2.5 font-mono text-brand-red">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h3>
              <p className="leading-[1.75] text-muted">{s.text}</p>
            </section>
          ))}
          {doc === "cookies" && <ManageCookies />}
        </article>
      </section>
    </>
  );
}
