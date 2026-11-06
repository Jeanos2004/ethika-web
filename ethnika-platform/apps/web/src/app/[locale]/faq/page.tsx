import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { metadataFor } from "@/content/pages";
import { faqCategories, faqJsonLd, getFaq, getFaqCategories, type FaqCategory } from "@/content/faq";
import { whatsappLink } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { FaqExplorer } from "@/components/sections/FaqExplorer";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = metadataFor("faq");

/* FAQ — référence : design/maquettes/FAQ.dc.html. Filtre initial depuis l'URL (?q=, ?categorie=), validé. */

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function FaqPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const tc = await getTranslations("common");
  const query = await searchParams;
  const first = (k: string) => {
    const v = query[k];
    return (Array.isArray(v) ? v[0] : v)?.slice(0, 80);
  };
  const cat = first("categorie");
  const category = cat !== undefined && Object.hasOwn(faqCategories, cat) ? (cat as FaqCategory) : undefined;
  const faq = getFaq(locale);

  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <FaqExplorer faq={faq} categories={getFaqCategories(locale)} initialQuery={first("q") ?? ""} initialCategory={category} />
      <section className="mx-auto max-w-[980px] px-4 pt-16 pb-16 sm:px-6 sm:pt-[72px] sm:pb-[110px]">
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-[30px] bg-night p-[clamp(24px,4vw,44px)] text-white">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold">{t("notFoundTitle")}</h2>
            <p className="text-[15px] text-on-dark">{t("notFoundText")}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href={whatsappLink(t("whatsappMessage"))} variant="whatsapp" className="h-[52px] px-[22px]">
              {tc("whatsapp")}
            </ButtonLink>
            <ButtonLink href="/contact" variant="gold" className="h-[52px] px-[22px]">
              {t("contactForm")}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
