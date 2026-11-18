import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { galleryFilters, getGalleryFilters, type GalleryFilter } from "@/content/gallery";
import { siteGallery } from "@/lib/content-source";
import { site } from "@/lib/site";
import { Chip } from "@/components/ui/Chip";
import { ButtonLink } from "@/components/ui/Button";
import { GalleryGrid } from "@/components/sections/GalleryGrid";

export const generateMetadata = metadataFor("galerie");

/* Galerie — référence : design/maquettes/Galerie.dc.html. Filtre ?filtre= validé par liste blanche. */

function parseFilter(value: string | string[] | undefined): GalleryFilter | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v !== undefined && Object.hasOwn(galleryFilters, v) ? (v as GalleryFilter) : undefined;
}

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function GaleriePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("galerie");
  const tc = await getTranslations("common");
  const page = await getPage("galerie", locale);
  const filter = parseFilter((await searchParams).filtre);
  const photos = (await siteGallery(locale)).filter((p) => !filter || p.category === filter);
  const labels = getGalleryFilters(locale);
  const filters: { value?: GalleryFilter; label: string }[] = [{ label: t("all") }, ...(Object.entries(labels) as [GalleryFilter, string][]).map(([value, label]) => ({ value, label }))];

  return (
    <>
      <section className="container-site flex flex-col gap-7 pt-16">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex flex-col gap-2.5">
            <span className="kicker text-brand-red">{page.kicker}</span>
            <h1 className="text-[clamp(48px,6vw,92px)] leading-[0.95] font-bold tracking-[-0.045em] text-night">{page.heading}</h1>
          </div>
          <nav aria-label={t("filterLabel")}>
            <ul className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <li key={f.label}>
                  <Chip href={f.value ? `/galerie?filtre=${f.value}` : "/galerie"} active={filter === f.value} className="text-[15px]">
                    {f.label}
                  </Chip>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <GalleryGrid key={filter ?? "tout"} photos={photos} />
        <p className="text-[13px] text-subtle">{t("credits")}</p>
      </section>

      <section className="container-site pt-16 pb-16 sm:pt-[90px] sm:pb-[110px]">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] bg-sand p-[clamp(28px,4vw,48px)]">
          <div className="flex max-w-[620px] flex-col gap-2">
            <h2 className="text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em] text-night">{t("ctaTitle")}</h2>
            <p className="text-muted">{t("ctaText")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/circuits" className="h-[54px] px-[26px]">
              {tc("seeCircuits")}
            </ButtonLink>
            <ButtonLink href={site.social.instagram} variant="outline" className="h-[54px] px-6">
              Instagram
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
