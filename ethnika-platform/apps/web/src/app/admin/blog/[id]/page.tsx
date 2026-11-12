import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/live/PostForm";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiPost } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Modifier l'article" };

export default async function AdminEditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, session } = await requireAdmin();
  const post = (await api<ApiPost[]>("/v1/admin/posts", { session })).find((p) => p.id === id);
  if (!post) notFound();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  const tb = await getTranslations({ locale: "fr", namespace: "admin.live.blog" });
  return (
    <AdminShell section="blog" title={post.i18n.fr.title} live={await liveAccount(user, session)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-night hover:underline">
          <Icon name="arrowLeft" size={16} /> {t("postsTitle")}
        </Link>
        {post.published && (
          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm font-semibold text-night hover:underline">
            {tb("viewOnSite")} <Icon name="arrowUpRight" size={15} />
          </a>
        )}
      </div>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{post.i18n.fr.title}</h1>
      <PostForm post={post} />
    </AdminShell>
  );
}
