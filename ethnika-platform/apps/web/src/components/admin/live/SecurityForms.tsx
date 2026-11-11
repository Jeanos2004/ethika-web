"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changePassword, enableMfa, startMfaSetup, type AuthState, type MfaSetupState } from "@/lib/admin/auth-actions";

const input = "h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] outline-none focus:border-night";

export function PasswordForm({ mustChange }: { mustChange: boolean }) {
  const t = useTranslations("admin.live.security");
  const tErr = useTranslations("admin.live.errors");
  const [state, action, pending] = useActionState<AuthState, FormData>(changePassword, {});
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-night">{t("passwordTitle")}</h2>
        <p className="text-sm text-muted">{mustChange ? t("passwordRequired") : t("passwordHint")}</p>
      </div>
      {(["current", "next", "confirm"] as const).map((k) => (
        <div key={k} className="flex flex-col gap-1.5">
          <label htmlFor={k} className="text-[13px] font-semibold text-ink">
            {t(`fields.${k}`)}
          </label>
          <input id={k} name={k} type="password" required minLength={k === "current" ? 1 : 12} maxLength={200} autoComplete={k === "current" ? "current-password" : "new-password"} className={input} />
        </div>
      ))}
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {tErr(state.error)}
        </p>
      )}
      {state.saved && (
        <p role="status" className="text-sm font-semibold text-brand-green-dark">
          {t("passwordSaved")}
        </p>
      )}
      <button type="submit" disabled={pending} className="h-11 self-start rounded-full bg-night px-5 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
        {pending ? t("saving") : t("passwordSubmit")}
      </button>
    </form>
  );
}

/** Activation de la 2FA : clé à saisir dans l'application d'authentification, puis premier code. */
export function MfaSetup() {
  const t = useTranslations("admin.live.security");
  const tErr = useTranslations("admin.live.errors");
  const [setup, startAction, starting] = useActionState<MfaSetupState, FormData>(startMfaSetup, {});
  const [state, action, pending] = useActionState<AuthState, FormData>(enableMfa, {});
  const grouped = setup.secret?.replace(/(.{4})/g, "$1 ").trim();

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-night">{t("mfaTitle")}</h2>
        <p className="text-sm text-muted">{t("mfaHint")}</p>
      </div>
      {!setup.secret ? (
        <>
          {setup.error && (
            <p role="alert" className="text-sm text-red-700">
              {tErr(setup.error)}
            </p>
          )}
          <form action={startAction}>
            <button type="submit" disabled={starting} className="h-11 rounded-full bg-night px-5 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
              {t("mfaStart")}
            </button>
          </form>
        </>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 rounded-xl bg-cream p-4">
            <span className="text-[13px] font-semibold text-ink">{t("mfaKey")}</span>
            <code className="font-mono text-[15px] break-all text-night select-all">{grouped}</code>
            <a href={setup.uri} className="text-sm font-semibold text-night underline underline-offset-2">
              {t("mfaOpenApp")}
            </a>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mfa-code" className="text-[13px] font-semibold text-ink">
              {t("mfaCode")}
            </label>
            <input id="mfa-code" name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} className={`${input} font-mono tracking-[0.3em]`} />
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-red-700">
              {tErr(state.error)}
            </p>
          )}
          <button type="submit" disabled={pending} className="h-11 self-start rounded-full bg-brand-gold px-5 text-sm font-bold text-ink hover:bg-brand-gold-hover disabled:opacity-60">
            {pending ? t("saving") : t("mfaEnable")}
          </button>
        </form>
      )}
    </section>
  );
}
