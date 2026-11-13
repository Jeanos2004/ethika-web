import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { languageAlternates, localizedPath, pages } from "@/content/pages";
import { circuits } from "@/content/circuits";
import { foutaSiteIds, foutaSitePath } from "@/content/fouta-sites";
import { sitePosts } from "@/lib/content-source";
import { site } from "@/lib/site";

/** Une entrée par langue, avec les alternatives hreflang. Les articles ne sont indexés qu'en français (corps non traduit). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await sitePosts("fr");
  const absolute = (path: string) => `${site.url}${path}`;
  const entry = (path: string, priority: number) =>
    routing.locales.map((locale) => ({
      url: absolute(localizedPath(path, locale)),
      changeFrequency: "weekly" as const,
      priority,
      alternates: { languages: Object.fromEntries(Object.entries(languageAlternates(path)).map(([l, p]) => [l, absolute(p)])) },
    }));

  return [
    ...Object.entries(pages)
      .filter(([key]) => key !== "merci")
      .flatMap(([, p]) => entry(p.path, p.path === "/" ? 1 : 0.7)),
    ...foutaSiteIds.flatMap((id) => entry(foutaSitePath(id), 0.6)),
    ...circuits.flatMap((c) => entry(`/circuits/${c.slug}`, 0.8)),
    ...posts.filter((p) => !p.draft).map((p) => ({ url: absolute(`/blog/${p.slug}`), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
