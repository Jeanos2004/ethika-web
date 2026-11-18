import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContentList } from "@/components/admin/live/ContentList";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiPost } from "@/lib/admin/types";
import { getPosts } from "@/content/blog";

export const metadata: Metadata = { title: "Articles du blog" };

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.blog" });
  const tc = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  const posts = await api<ApiPost[]>("/v1/admin/posts", { session });
  const rows = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.i18n.fr.title,
    subtitle: t("minutes", { n: p.readingMinutes }),
    category: p.category,
    categoryLabel: t(`categories.${p.category}`),
    featured: p.featured,
    todo: /^:::todo/m.test(p.i18n.fr.body),
    updatedAt: p.updatedAt,
    published: p.published,
    position: p.position,
    amount: null,
    currency: null,
    image: p.imageUrl,
  }));
  const importable = getPosts("fr").filter((p) => !posts.some((x) => x.slug === p.slug)).length;
  return (
    <AdminShell section="blog" title={tc("postsTitle")} live={await liveAccount(user, session)}>
      <ContentList kind="posts" rows={rows} newHref="/admin/blog/nouveau" params={await searchParams} importable={importable} />
    </AdminShell>
  );
}
