"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { login, verifyCode, type AuthState } from "@/lib/admin/auth-actions";

const input = "h-12 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] text-ink outline-none focus:border-night";

/** Étape 1 : e-mail + mot de passe ; étape 2 : code à 6 chiffres de l'application d'authentification. */
export function LoginForm() {
  const t = useTranslations("admin.live.login");
  const tErr = useTranslations("admin.live.errors");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, {});
  const [codeState, codeAction, codePending] = useActionState<AuthState, FormData>(verifyCode, {});
  const mfa = loginState.step === "mfa";
  const error = mfa ? codeState.error : loginState.error;

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white p-6 sm:p-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-night">{mfa ? t("mfaTitle") : t("title")}</h1>
        <p className="text-sm text-muted">{mfa ? t("mfaHint") : t("hint")}</p>
      </div>
      {mfa ? (
        <form action={codeAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-[13px] font-semibold text-ink">
              {t("code")}
            </label>
            <input id="code" name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} autoFocus className={`${input} font-mono text-lg tracking-[0.3em]`} />
          </div>
          <Error message={error && tErr(error)} />
          {error === "expired" && (
            // Rechargement complet : repart d'un formulaire vierge.
            <button type="button" onClick={() => window.location.reload()} className="self-start text-sm font-semibold text-night underline underline-offset-2">
              {t("restart")}
            </button>
          )}
          <button type="submit" disabled={codePending} className="h-12 rounded-full bg-night text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
            {codePending ? t("checking") : t("verify")}
          </button>
        </form>
      ) : (
        <form action={loginAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[13px] font-semibold text-ink">
              {t("email")}
            </label>
            <input id="email" name="email" type="email" required autoComplete="username" maxLength={200} className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[13px] font-semibold text-ink">
              {t("password")}
            </label>
            <input id="password" name="password" type="password" required autoComplete="current-password" maxLength={200} className={input} />
          </div>
          <Error message={error && tErr(error)} />
          <button type="submit" disabled={loginPending} className="h-12 rounded-full bg-night text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
            {loginPending ? t("checking") : t("submit")}
          </button>
        </form>
      )}
    </div>
  );
}

function Error({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-sm text-red-700">
      {message}
    </p>
  ) : null;
}
