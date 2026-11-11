import type { Metadata } from "next";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthLayout } from "@/components/admin/live/AuthLayout";
import { MfaSetup, PasswordForm } from "@/components/admin/live/SecurityForms";
import { Icon } from "@/components/ui/Icon";
import { logout } from "@/lib/admin/auth-actions";
import { liveAccount } from "@/lib/admin/account";
import { requireUser } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Sécurité" };

/**
 * Premier accès : parcours guidé hors du back-office (mot de passe définitif, puis 2FA pour un administrateur).
 * Compte prêt : page Sécurité dans le back-office (changement de mot de passe).
 */
export default async function AdminSecurityPage() {
  const { user, session } = await requireUser({ allowPending: true });
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.security" });

  if (user.mfaVerified && !user.mustChangePassword) {
    return (
      <AdminShell section="security" title={t("title")} live={await liveAccount(user, session)}>
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("title")}</h1>
          <p className="text-sm text-muted">{t("allSet", { email: user.email })}</p>
        </div>
        <div className="max-w-xl">
          <PasswordForm mustChange={false} />
        </div>
      </AdminShell>
    );
  }

  const steps = [
    { key: "password", done: !user.mustChangePassword },
    { key: "mfa", done: user.mfaVerified },
  ] as const;
  const current = steps.find((s) => !s.done)?.key ?? "mfa";

  return (
    <AuthLayout wide>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">{t("welcome", { name: user.name.split(/\s+/)[0] ?? user.name })}</span>
          <h1 className="text-[30px] leading-tight font-bold tracking-[-0.03em] text-night">{t("setupTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-muted">{t("setupHint")}</p>
        </div>

        <ol className="grid grid-cols-2 gap-2" aria-label={t("progress")}>
          {steps.map((s, i) => (
            <li
              key={s.key}
              aria-current={s.key === current ? "step" : undefined}
              className={clsx(
                "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-semibold",
                s.done ? "border-line bg-white text-muted" : s.key === current ? "border-night bg-white text-night" : "border-line text-muted",
              )}
            >
              <span className={clsx("flex size-6 shrink-0 items-center justify-center rounded-full text-xs", s.done ? "bg-brand-green text-white" : s.key === current ? "bg-night text-white" : "bg-sand text-night")}>
                {s.done ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}
              </span>
              {t(`steps.${s.key}`)}
            </li>
          ))}
        </ol>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-night">{current === "password" ? t("passwordTitle") : t("mfaTitle")}</h2>
          <p className="-mt-2 text-sm leading-relaxed text-muted">{current === "password" ? t("passwordRequired") : t("mfaHint")}</p>
          {current === "password" ? <PasswordForm mustChange bare /> : <MfaSetup />}
        </section>

        <form action={logout} className="border-t border-line pt-5">
          <button type="submit" className="text-sm font-semibold text-muted hover:text-night">
            {t("later")}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
