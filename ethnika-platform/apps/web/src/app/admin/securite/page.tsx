import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { MfaSetup, PasswordForm } from "@/components/admin/live/SecurityForms";
import { liveAccount } from "@/lib/admin/account";
import { requireUser } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Sécurité" };

/** Compte : mot de passe définitif (premier accès) et 2FA (obligatoire pour les administrateurs). */
export default async function AdminSecurityPage() {
  const { user, session } = await requireUser({ allowPending: true });
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.security" });
  const ready = user.mfaVerified && !user.mustChangePassword;
  return (
    <AdminShell section="security" title={t("title")} live={ready ? await liveAccount(user, session) : { name: user.name, role: user.role, newCount: 0 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("title")}</h1>
        <p className="text-sm text-muted">{ready ? t("allSet", { email: user.email }) : t("pending")}</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <PasswordForm mustChange={user.mustChangePassword} />
        {!user.mfaVerified && <MfaSetup />}
      </div>
    </AdminShell>
  );
}
