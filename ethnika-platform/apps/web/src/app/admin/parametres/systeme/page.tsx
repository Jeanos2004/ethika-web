import type { Metadata } from "next";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { SettingRow, SettingsCard, SettingsShell } from "@/components/admin/live/SettingsShell";
import { api } from "@/lib/api/server";
import { liveAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/session";
import type { ApiSystem } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Système · Paramètres" };

function uptime(s: number) {
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d} j ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
}

/** Paramètres · Système (administrateurs) : état de l'API, configuration, file d'e-mails, volumes. Aucun secret affiché. */
export default async function SettingsSystemPage() {
  const { user, session } = await requireAdmin();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.settings" });
  const s = await api<ApiSystem>("/v1/system", { session });
  const ok = (v: boolean) => <Status ok={v} label={v ? t("configured") : t("notConfigured")} />;
  return (
    <SettingsShell tab="system" live={await liveAccount(user, session)}>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["users", s.counts.users],
            ["leads", s.counts.leads],
            ["subscribers", s.counts.subscribers],
            ["holds", s.counts.holds],
          ] as const
        ).map(([k, v]) => (
          <li key={k} className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-4 py-4">
            <span className="text-[13px] text-muted">{t(`counts.${k}`)}</span>
            <strong className="text-[28px] leading-none font-semibold text-night tabular-nums">{v}</strong>
          </li>
        ))}
      </ul>

      <SettingsCard title={t("apiTitle")} action={<Status ok label={t("online")} />}>
        <dl>
          <SettingRow label={t("version")}>{s.version}</SettingRow>
          <SettingRow label={t("environment")}>{s.environment}</SettingRow>
          <SettingRow label={t("uptime")}>{uptime(s.uptimeSeconds)}</SettingRow>
          <SettingRow label={t("siteUrl")}>{s.siteUrl}</SettingRow>
        </dl>
      </SettingsCard>

      <SettingsCard title={t("servicesTitle")} hint={t("servicesHint")}>
        <dl>
          <SettingRow label={t("smtp")}>{s.mailProvider === "none" ? ok(false) : <Status ok label={t(`mailProviders.${s.mailProvider}`)} />}</SettingRow>
          <SettingRow label={t("payments")}>{s.paymentProvider === "none" ? ok(false) : <Status ok={false} label={t(`paymentProviders.${s.paymentProvider}`)} />}</SettingRow>
          <SettingRow label={t("agencyNotify")}>{ok(s.agencyNotifyConfigured)}</SettingRow>
          <SettingRow label={t("pdf")}>{ok(s.pdfConfigured)}</SettingRow>
          <SettingRow label={t("flightProvider")}>
            <span className="font-mono">{s.flightProvider}</span> <span className="text-muted">· {t(`providers.${s.flightProvider}`)}</span>
          </SettingRow>
        </dl>
      </SettingsCard>

      <SettingsCard title={t("mailTitle")}>
        <dl>
          <SettingRow label={t("mailSent")}>{s.mail.sent24h}</SettingRow>
          <SettingRow label={t("mailPending")}>{s.mail.pending}</SettingRow>
          <SettingRow label={t("mailFailed")}>{s.mail.failed > 0 ? <Status ok={false} label={String(s.mail.failed)} /> : "0"}</SettingRow>
        </dl>
      </SettingsCard>

      <SettingsCard title={t("policyTitle")}>
        <dl>
          <SettingRow label={t("sessionIdle")}>{t("minutes", { n: s.sessionIdleMinutes })}</SettingRow>
          <SettingRow label={t("sessionMax")}>{t("hours", { n: Math.round(s.sessionMaxMinutes / 60) })}</SettingRow>
          <SettingRow label={t("retention")}>{t("daysLong", { n: s.leadRetentionDays })}</SettingRow>
        </dl>
      </SettingsCard>
    </SettingsShell>
  );
}

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-ink">
      <span aria-hidden="true" className={clsx("size-2 rounded-full", ok ? "bg-brand-green" : "bg-brand-gold")} />
      {label}
    </span>
  );
}
