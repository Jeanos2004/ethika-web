"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { login, verifyCode, type AuthState } from "@/lib/admin/auth-actions";
import { Icon } from "@/components/ui/Icon";
import { keepValues } from "@/components/admin/live/keep-values";

const input = "h-12 w-full rounded-xl border border-line-strong bg-white px-4 text-[15px] text-ink outline-none transition-colors focus:border-night focus:ring-2 focus:ring-night/10";
const primary = "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-night text-[15px] font-semibold text-white transition-colors hover:bg-night-2 disabled:opacity-60";

/** Étape 1 : e-mail + mot de passe ; étape 2 : code à 6 chiffres de l'application d'authentification. */
export function LoginForm() {
  const t = useTranslations("admin.live.login");
  const tErr = useTranslations("admin.live.errors");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, {});
  const [codeState, codeAction, codePending] = useActionState<AuthState, FormData>(verifyCode, {});
  const [showPassword, setShowPassword] = useState(false);
  const mfa = loginState.step === "mfa";
  const error = mfa ? codeState.error : loginState.error;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-night text-brand-gold">
          <Icon name={mfa ? "shieldCheck" : "users"} size={22} />
        </span>
        <h1 className="mt-3 text-[30px] leading-tight font-bold tracking-[-0.03em] text-night">{mfa ? t("mfaTitle") : t("title")}</h1>
        <p className="text-[15px] leading-relaxed text-muted">{mfa ? t("mfaHint") : t("hint")}</p>
      </div>

      {mfa ? (
        <form action={codeAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="code" className="text-[13px] font-semibold text-ink">
              {t("code")}
            </label>
            <input
              id="code"
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              autoFocus
              placeholder="000000"
              className={`${input} h-14 text-center font-mono text-2xl tracking-[0.5em] placeholder:text-line-strong`}
            />
          </div>
          <ErrorText message={error && tErr(error)} />
          {error === "expired" && (
            // Rechargement complet : repart d'un formulaire vierge.
            <button type="button" onClick={() => window.location.reload()} className="self-start text-sm font-semibold text-night underline underline-offset-2">
              {t("restart")}
            </button>
          )}
          <button type="submit" disabled={codePending} className={primary}>
            {codePending ? t("checking") : t("verify")}
          </button>
        </form>
      ) : (
        // Garde l'e-mail saisi après un refus (React 19 viderait le formulaire).
        <form onSubmit={keepValues(loginAction)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[13px] font-semibold text-ink">
              {t("email")}
            </label>
            <input id="email" name="email" type="email" required autoComplete="username" maxLength={200} placeholder="prenom@ethnikatour.com" className={input} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[13px] font-semibold text-ink">
              {t("password")}
            </label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" maxLength={200} className={`${input} pr-24`} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-controls="password"
                className="absolute inset-y-1.5 right-1.5 rounded-lg px-3 text-[13px] font-semibold text-muted hover:bg-sand hover:text-night"
              >
                {showPassword ? t("hide") : t("show")}
              </button>
            </div>
          </div>
          <ErrorText message={error && tErr(error)} />
          <button type="submit" disabled={loginPending} className={primary}>
            {loginPending ? t("checking") : t("submit")} {!loginPending && <Icon name="arrowRight" size={17} />}
          </button>
          <p className="text-[13px] leading-relaxed text-muted">{t("forgot")}</p>
        </form>
      )}
    </div>
  );
}

function ErrorText({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
      <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
      {message}
    </p>
  ) : null;
}
