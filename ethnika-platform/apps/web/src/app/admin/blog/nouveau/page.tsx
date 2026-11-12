import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/live/PostForm";
import { Icon } from "@/components/ui/Icon";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Nouvel article" };

export default async function AdminNewPostPage() {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.content" });
  return (
    <AdminShell section="blog" title={t("postsNew")} live={await liveAccount(user, session)}>
      <Link href="/admin/blog" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
        <Icon name="arrowLeft" size={16} /> {t("postsTitle")}
      </Link>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("postsNew")}</h1>
      <PostForm />
    </AdminShell>
  );
}
