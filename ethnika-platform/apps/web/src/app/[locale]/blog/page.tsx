import Image from "next/image";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { localePrefix, type Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { blogCategories, categorySlugs, type BlogCategory, type Post } from "@/content/blog";
import { sitePosts } from "@/lib/content-source";
import { site } from "@/lib/site";
import { slugify } from "@/lib/slug";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

export const generateMetadata = metadataFor("blog");

/* Blog & actualités — référence : design/maquettes/Blog.dc.html. Catégorie, recherche et page dans l'URL (validées). */

const PAGE_SIZE = 6;
type Query = Record<string, string | string[] | undefined>;

function one(params: Query, key: string, max: number) {
  const v = params[key];
  return (Array.isArray(v) ? v[0] : v)?.slice(0, max);
}

function parseBlogParams(params: Query) {
  const slug = one(params, "categorie", 20);
  const category = blogCategories.find((c) => categorySlugs[c] === slug);
  const q = one(params, "q", 80)?.trim() ?? "";
  const page = Number.parseInt(one(params, "page", 3) ?? "1", 10);
  return { category, q, page: Number.isInteger(page) && page >= 1 ? page : 1 };
}

function blogHref({ category, q, page }: { category?: BlogCategory; q?: string; page?: number }) {
  const s = new URLSearchParams();
  if (category) s.set("categorie", categorySlugs[category]);
  if (q) s.set("q", q);
  if (page && page > 1) s.set("page", String(page));
  const qs = s.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

/** Recherche insensible à la casse et aux accents dans le titre, le chapô et l'extrait. */
function matches(p: Post, q: string, categoryLabel: string) {
  if (!q) return true;
  const hay = slugify(`${p.title} ${p.lead} ${p.excerpt} ${categoryLabel}`);
  return slugify(q)
    .split("-")
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Query> };

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const tc = await getTranslations("common");
  const page = await getPage("blog", locale);
  const catLabel = (c: BlogCategory) => t(`categories.${c}`);
  const posts = await sitePosts(locale);
  const featured = posts.find((p) => p.featured) ?? posts.find((p) => !p.draft) ?? posts[0];
  const { category, q, page: requested } = parseBlogParams(await searchParams);
  const filtering = Boolean(category || q);
  const pool = posts.filter((p) => (filtering || p.slug !== featured?.slug) && (!category || p.category === category) && matches(p, q, catLabel(p.category)));
  const totalPages = Math.max(1, Math.ceil(pool.length / PAGE_SIZE));
  const current = Math.min(requested, totalPages);
  const shown = pool.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const showFeatured = featured && !filtering && current === 1;

  return (
    <>
      <section className="container-site flex flex-wrap items-end justify-between gap-6 pt-16 pb-10 sm:pt-[72px]">
        <div className="flex flex-col gap-2.5">
          <span className="kicker text-brand-red">{page.kicker}</span>
          <h1 className="text-[clamp(48px,6vw,92px)] leading-[0.95] font-bold tracking-[-0.045em] text-night">{page.heading}</h1>
        </div>
        <form method="get" action={`${localePrefix(locale)}/blog`} role="search" className="relative w-full flex-[0_1_360px]">
          {category && <input type="hidden" name="categorie" value={categorySlugs[category]} />}
          <label htmlFor="blog-q" className="sr-only">
            {t("searchLabel")}
          </label>
          <input
            id="blog-q"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={80}
            placeholder={t("searchPlaceholder")}
            className="h-[54px] w-full rounded-full border-[1.5px] border-line-strong bg-white pr-14 pl-[22px] text-[15px] font-medium focus:border-night focus:ring-4 focus:ring-brand-gold/35 focus:outline-none"
          />
          <button type="submit" aria-label={t("searchButton")} className="absolute top-1/2 right-1.5 flex size-[42px] -translate-y-1/2 items-center justify-center rounded-full bg-night text-white hover:bg-night-line">
            <Icon name="search" size={18} />
          </button>
        </form>
      </section>

      {showFeatured && (
        <section aria-label={t("featuredLabel")} className="container-site">
          <article className={clsx("group relative flex flex-wrap overflow-hidden rounded-[32px] bg-night text-white", cardFocus)}>
            <div className="relative min-h-[260px] flex-[1_1_560px] sm:min-h-[420px]">
              <Image src={featured.image} alt={featured.imageAlt} fill priority sizes="(min-width: 1100px) 55vw, 100vw" className="object-cover" />
            </div>
            <div className="flex min-w-0 flex-[1_1_420px] flex-col justify-center gap-4 p-[clamp(24px,4vw,52px)]">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-brand-gold px-3 py-1.5 text-xs font-bold text-ink">{t("featured")}</span>
                <span className="font-mono text-xs text-on-dark-muted uppercase">
                  {catLabel(featured.category)} · {t("minutes", { n: featured.readingMinutes })}
                </span>
              </div>
              <h2 className="text-[clamp(30px,3.4vw,46px)] leading-[1.05] font-bold tracking-[-0.03em]">
                <Link href={`/blog/${featured.slug}`} className={stretchedLink}>
                  {featured.title}
                </Link>
              </h2>
              <p className="leading-[1.65] text-on-dark">{featured.lead}</p>
              <span className="text-sm text-on-dark-muted">{t("byTeam", { date: featured.published, name: site.name })}</span>
              <span aria-hidden="true" className="font-bold text-brand-gold">
                {tc("readArticle")} →
              </span>
            </div>
          </article>
        </section>
      )}

      <section className="container-site flex flex-col gap-7 pt-14 pb-16 sm:pt-16 sm:pb-[110px]">
        <nav aria-label={t("categoriesLabel")}>
          <ul className="flex flex-wrap gap-2">
            {[undefined, ...blogCategories].map((c) => (
              <li key={c ?? "tous"}>
                <Chip href={blogHref({ category: c, q })} active={category === c} className="px-5 text-[15px]">
                  {c ? catLabel(c) : t("all")}
                </Chip>
              </li>
            ))}
          </ul>
        </nav>
        {filtering && (
          <p aria-live="polite" className="text-sm text-subtle">
            {q ? t("countFor", { count: pool.length, q }) : t("count", { count: pool.length })}
          </p>
        )}

        {shown.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-[26px]">
            {shown.map((p) => (
              <li key={p.slug}>
                <article className={clsx("group relative flex h-full flex-col gap-3.5", cardFocus)}>
                  <div className="relative h-60 overflow-hidden rounded-3xl">
                    <Image src={p.image} alt={p.imageAlt} fill sizes="(min-width: 1100px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
                  </div>
                  <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.1em] uppercase">
                    <span className="text-brand-red">{catLabel(p.category)}</span>
                    <span className="text-subtle">· {t("minutes", { n: p.readingMinutes })}</span>
                  </div>
                  <h2 className="text-[22px] leading-tight font-bold tracking-[-0.015em] text-night">
                    <Link href={`/blog/${p.slug}`} className={stretchedLink}>
                      {p.title}
                    </Link>
                  </h2>
                  <p className="text-[15px] leading-relaxed text-muted">{p.excerpt}</p>
                  <span className="text-[13px] text-subtle">{p.published}</span>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={t("emptyTitle")}
            action={
              <ButtonLink href="/blog" variant="outline" size="sm">
                {t("seeAll")}
              </ButtonLink>
            }
          >
            {t("emptyText")}
          </EmptyState>
        )}

        <Pagination page={current} totalPages={totalPages} hrefFor={(p) => blogHref({ category, q, page: p })} className="mt-4 flex justify-center" />
      </section>
    </>
  );
}
