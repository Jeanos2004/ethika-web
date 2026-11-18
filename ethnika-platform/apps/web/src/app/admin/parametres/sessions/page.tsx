import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SettingsCard, SettingsShell } from "@/components/admin/live/SettingsShell";
import { Icon } from "@/components/ui/Icon";
import { formatLong } from "@/components/admin/status";
import { api } from "@/lib/api/server";
import { revokeOtherSessions, revokeSession } from "@/lib/admin/account-actions";
import { liveAccount } from "@/lib/admin/account";
import { requireUser } from "@/lib/admin/session";
import type { ApiSession } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Sessions · Paramètres" };

/** Paramètres · Sessions : appareils connectés au compte, déconnexion d'un appareil ou de tous les autres. */
export default async function SettingsSessionsPage() {
  const { user, session } = await requireUser();
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.settings" });
  const sessions = await api<ApiSession[]>("/v1/account/sessions", { session });
  const others = sessions.filter((s) => !s.current).length;
  return (
    <SettingsShell tab="sessions" live={await liveAccount(user, session)}>
      <SettingsCard
        title={t("sessionsTitle")}
        hint={t("sessionsHint")}
        action={
          others > 0 ? (
            <form action={revokeOtherSessions}>
              <button type="submit" className="min-h-10 rounded-full border-[1.5px] border-line-strong bg-white px-3.5 text-[13px] font-semibold text-night hover:border-brand-red hover:text-brand-red">
                {t("revokeOthers", { count: others })}
              </button>
            </form>
          ) : undefined
        }
      >
        <ul className="divide-y divide-line">
          {sessions.map((s) => (
            <li key={s.handle} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sand text-night">
                <Icon name="globe" size={18} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col text-sm">
                <strong className="text-night">
                  {s.device ?? t("unknownDevice")}
                  {s.current && <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">{t("thisDevice")}</span>}
                </strong>
                <span className="text-xs text-muted">
                  {s.ip ?? "—"} · {t("lastSeen", { date: formatLong(s.lastSeenAt) })} · {t("since", { date: formatLong(s.createdAt) })}
                </span>
              </span>
              {!s.current && (
                <form action={revokeSession}>
                  <input type="hidden" name="handle" value={s.handle} />
                  <button type="submit" className="min-h-10 rounded-full border-[1.5px] border-line-strong bg-white px-3.5 text-[13px] font-semibold text-night hover:border-night">
                    {t("revoke")}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">{t("sessionsRules")}</p>
      </SettingsCard>
    </SettingsShell>
  );
}
