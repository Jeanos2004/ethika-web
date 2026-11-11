import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/admin/live/ProfileForm";
import { SettingRow, SettingsCard, SettingsShell } from "@/components/admin/live/SettingsShell";
import { formatLong } from "@/components/admin/status";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireUser } from "@/lib/admin/session";
import type { ApiProfile } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Paramètres" };

/** Paramètres · Profil : nom affiché, identifiant, rôle, ancienneté, dernière connexion. */
export default async function SettingsProfilePage() {
  const { user, session } = await requireUser();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.settings" });
  const profile = await api<ApiProfile>("/v1/account", { session });
  const initials = profile.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <SettingsShell tab="profile" live={await liveAccount(user, session)}>
      <SettingsCard title={t("profileTitle")} hint={t("profileHint")}>
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-brand-gold text-lg font-bold text-ink">
            {initials}
          </span>
          <div className="flex min-w-0 flex-col">
            <strong className="truncate text-lg text-night">{profile.name}</strong>
            <span className="truncate text-sm text-muted">{profile.email}</span>
          </div>
        </div>
        <ProfileForm name={profile.name} />
      </SettingsCard>
      <SettingsCard title={t("accountTitle")}>
        <dl>
          <SettingRow label={t("email")}>{profile.email}</SettingRow>
          <SettingRow label={t("role")}>
            {t(`roles.${profile.role}`)} <span className="text-muted">· {t(`roleHint.${profile.role}`)}</span>
          </SettingRow>
          <SettingRow label={t("mfa")}>{profile.totpEnabled ? t("mfaOn") : t("mfaOff")}</SettingRow>
          <SettingRow label={t("memberSince")}>{formatLong(profile.createdAt)}</SettingRow>
          <SettingRow label={t("lastLogin")}>{profile.lastLoginAt ? formatLong(profile.lastLoginAt) : "—"}</SettingRow>
        </dl>
        <p className="text-xs text-muted">{t("emailHint")}</p>
      </SettingsCard>
    </SettingsShell>
  );
}
