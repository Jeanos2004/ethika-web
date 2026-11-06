import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLocalizedPost, posts } from "@/content/blog";
import { renderOg } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ETHNIKA";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const post = getLocalizedPost(slug, locale);
  if (!post) notFound();
  const t = await getTranslations({ locale, namespace: "blog" });
  return renderOg({
    title: post.title,
    kicker: t(`categories.${post.category}`),
  });
}
