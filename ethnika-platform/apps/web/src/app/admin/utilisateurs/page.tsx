import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { NewUserForm, UserRow } from "@/components/admin/live/UsersAdmin";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiUser } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Utilisateurs" };

/** Comptes du back-office : création (mot de passe temporaire), rôle, désactivation, réinitialisations. Admin uniquement. */
export default async function AdminUsersPage() {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.users" });
  const users = await api<ApiUser[]>("/v1/users?pageSize=100", { session });
  return (
    <AdminShell section="users" title={t("title")} live={await liveAccount(user, session)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>
      <NewUserForm />
      <section className="rounded-2xl border border-line bg-white px-5 sm:px-6">
        <ul className="divide-y divide-line">
          {users.map((u) => (
            <UserRow key={u.id} user={u} self={u.id === user.userId} />
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
