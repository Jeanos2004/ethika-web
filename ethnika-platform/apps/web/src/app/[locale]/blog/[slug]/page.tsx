import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/content/pages";
import { getLocalizedPost, getPosts, posts } from "@/content/blog";
import { getToc } from "@/lib/blog";
import { site } from "@/lib/site";
import { isDemo } from "@/lib/demo/mode";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { ShareLinks } from "@/components/sections/ShareLinks";
import { SectionNav } from "@/components/sections/SectionNav";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { cardFocus, stretchedLink } from "@/components/cards/shared";

/*
 * Article — référence : design/maquettes/Article.dc.html
 * Corps en MDX (src/content/blog/<slug>.mdx, en français) rendu par les composants contrôlés de src/mdx-components.tsx.
 * En anglais : titres et chapô traduits, corps en français signalé au lecteur, page non indexée.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

type Params = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getLocalizedPost(slug, locale);
  if (!post) return {};
  const path = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.lead,
    alternates: { canonical: localizedPath(path, locale), languages: { fr: localizedPath(path, "fr"), "x-default": localizedPath(path, "fr") } },
    openGraph: { type: "article", title: post.title, description: post.lead, url: localizedPath(path, locale) },
    // Article à rédiger, ou version anglaise d'un texte français : pas d'indexation.
    robots: isDemo ? { index: false, follow: false } : post.draft || locale !== "fr" ? { index: false, follow: true } : undefined,
  };
}

export default async function ArticlePage({ params }: Params) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getLocalizedPost(slug, locale);
  if (!post) notFound();
  const t = await getTranslations("article");
  const tb = await getTranslations("blog");
  const tc = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const { default: Body } = await import(`@/content/blog/${post.slug}.mdx`);
  const toc = await getToc(post.slug);
  const all = getPosts(locale);
  const related = [...all.filter((p) => p.slug !== post.slug && p.category === post.category), ...all.filter((p) => p.slug !== post.slug && p.category !== post.category)].slice(0, 3);
  const path = localizedPath(`/blog/${post.slug}`, locale);
  const url = `${site.url}${path}`;
  const category = tb(`categories.${post.category}`);
  const crumbs = [{ href: "/", label: tc("home") }, { href: "/blog", label: tNav("blog") }, { label: category }];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.lead,
          image: `${site.url}${post.image}`,
          url,
          inLanguage: "fr",
          author: { "@type": "Organization", name: t("team", { name: site.name }) },
          publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/logo-vertical-couleur.svg` } },
          ...(/^\d{4}-\d{2}-\d{2}/.test(post.published) && { datePublished: post.published, dateModified: post.updated }),
        }}
      />
      <JsonLd data={breadcrumbJsonLd(site.url, crumbs, path)} />

      <section className="mx-auto flex max-w-[920px] flex-col items-center gap-[18px] px-4 pt-16 pb-9 text-center sm:px-6">
        <Breadcrumbs crumbs={crumbs} tone="light" />
        <span className="font-mono text-xs tracking-[0.14em] text-brand-red uppercase">{t("readingTime", { category, n: post.readingMinutes })}</span>
        <h1 className="text-[clamp(40px,5.2vw,72px)] leading-none font-bold tracking-[-0.04em] text-night">{post.title}</h1>
        <p className="max-w-[680px] text-[19px] leading-relaxed text-muted">{post.lead}</p>
        <div className="flex items-center gap-3">
          <Image src="/icons/icon-clair-1024.png" alt="" width={44} height={44} className="size-11 rounded-full" />
          <div className="text-left">
            <strong className="block text-[15px] text-night">{t("team", { name: site.name })}</strong>
            <span className="text-[13px] text-subtle">{t("dates", { published: post.published, updated: post.updated })}</span>
          </div>
        </div>
      </section>
      <div className="container-site">
        <div className="relative h-[clamp(240px,42vw,600px)] overflow-hidden rounded-[32px]">
          <Image src={post.image} alt={post.imageAlt} fill priority sizes="(min-width: 1320px) 1272px, 100vw" className="object-cover" />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1180px] flex-wrap items-start gap-14 px-4 pt-16 sm:px-6">
        <aside className="flex min-w-0 flex-[0_1_240px] flex-col gap-6 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
          {toc.length > 0 && (
            <div className="flex flex-col gap-1 border-l-2 border-line pl-4">
              <span className="mb-2 font-mono text-[11px] tracking-[0.14em] text-subtle">{t("toc")}</span>
              <SectionNav sections={toc} label={t("tocLabel")} variant="links" />
            </div>
          )}
          <ShareLinks url={url} title={post.title} />
        </aside>
        <article
          lang="fr"
          className={clsx(
            "flex min-w-0 flex-[1_1_620px] flex-col gap-6 text-lg leading-[1.8] text-ink",
            // Lettrine sur le premier paragraphe (maquette Article.dc.html)
            "[&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:mt-2 [&>p:first-child]:first-letter:mr-3 [&>p:first-child]:first-letter:font-serif [&>p:first-child]:first-letter:text-[84px] [&>p:first-child]:first-letter:leading-[0.8] [&>p:first-child]:first-letter:text-brand-red",
          )}
        >
          {locale !== "fr" && (
            <div lang={locale} role="note" className="rounded-2xl bg-gold-50 px-5 py-3 text-[15px] text-gold-700">
              {t("frenchOnly")}
            </div>
          )}
          <Body />
          {post.tags.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label={t("keywords")}>
              {post.tags.map((tag) => (
                <li key={tag} className="rounded-full bg-line px-3 py-[7px] text-[13px] font-semibold">
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <section className="container-site flex flex-col gap-7 pt-16 pb-16 sm:pt-[100px] sm:pb-[110px]">
        <h2 className="text-[clamp(30px,3.2vw,42px)] font-bold tracking-[-0.03em] text-night">{t("related")}</h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6">
          {related.map((r) => (
            <li key={r.slug}>
              <article className={clsx("group relative flex flex-col gap-3", cardFocus)}>
                <div className="relative h-[220px] overflow-hidden rounded-[var(--radius-md)]">
                  <Image src={r.image} alt={r.imageAlt} fill sizes="(min-width: 1100px) 33vw, 100vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
                </div>
                <span className="font-mono text-[11px] tracking-[0.1em] text-brand-red uppercase">{tb(`categories.${r.category}`)}</span>
                <h3 className="text-xl font-bold text-night">
                  <Link href={`/blog/${r.slug}`} className={stretchedLink}>
                    {r.title}
                  </Link>
                </h3>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
