import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MfaSetup, PasswordForm } from "@/components/admin/live/SecurityForms";
import { SettingsCard, SettingsShell } from "@/components/admin/live/SettingsShell";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireUser } from "@/lib/admin/session";
import type { ApiProfile } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Sécurité · Paramètres" };

/** Paramètres · Sécurité : mot de passe, vérification en deux étapes (facultative pour un agent), bonnes pratiques. */
export default async function SettingsSecurityPage() {
  const { user, session } = await requireUser();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.settings" });
  const ts = await getTranslations({ locale: "fr", namespace: "admin.live.security" });
  const profile = await api<ApiProfile>("/v1/account", { session });
  return (
    <SettingsShell tab="security" live={await liveAccount(user, session)}>
      <SettingsCard title={ts("passwordTitle")} hint={ts("passwordHint")}>
        <div className="max-w-md">
          <PasswordForm mustChange={false} bare />
        </div>
      </SettingsCard>

      <SettingsCard
        title={ts("mfaTitle")}
        hint={profile.totpEnabled ? t("mfaActiveHint") : user.role === "admin" ? ts("mfaHint") : t("mfaAgentHint")}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-ink">
            <span aria-hidden="true" className={profile.totpEnabled ? "size-2 rounded-full bg-brand-green" : "size-2 rounded-full bg-brand-gold"} />
            {profile.totpEnabled ? t("mfaOn") : t("mfaOff")}
          </span>
        }
      >
        {profile.totpEnabled ? <p className="text-sm text-muted">{t("mfaLost")}</p> : <MfaSetup />}
      </SettingsCard>

      <SettingsCard title={t("tipsTitle")}>
        <ul className="flex flex-col gap-2.5 text-sm text-ink">
          {(["tip1", "tip2", "tip3", "tip4"] as const).map((k) => (
            <li key={k} className="flex gap-2.5">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand-green" />
              {t(k)}
            </li>
          ))}
        </ul>
      </SettingsCard>
    </SettingsShell>
  );
}
