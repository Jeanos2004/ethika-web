"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changePassword, enableMfa, startMfaSetup, type AuthState, type MfaSetupState } from "@/lib/admin/auth-actions";
import { Icon } from "@/components/ui/Icon";

const input = "h-12 w-full rounded-xl border border-line-strong bg-white px-4 text-[15px] outline-none transition-colors focus:border-night focus:ring-2 focus:ring-night/10";
const primary = "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-night px-6 text-[15px] font-semibold text-white hover:bg-night-2 disabled:opacity-60";

function ErrorText({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
      <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
      {message}
    </p>
  ) : null;
}

/** Mot de passe : définitif au premier accès (obligatoire), ou changement volontaire depuis la page Sécurité. */
export function PasswordForm({ mustChange, bare = false }: { mustChange: boolean; bare?: boolean }) {
  const t = useTranslations("admin.live.security");
  const tErr = useTranslations("admin.live.errors");
  const [state, action, pending] = useActionState<AuthState, FormData>(changePassword, {});
  return (
    <form action={action} className={bare ? "flex flex-col gap-4" : "flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6"}>
      {!bare && (
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-night">{t("passwordTitle")}</h2>
          <p className="text-sm text-muted">{mustChange ? t("passwordRequired") : t("passwordHint")}</p>
        </div>
      )}
      {(["current", "next", "confirm"] as const).map((k) => (
        <div key={k} className="flex flex-col gap-2">
          <label htmlFor={k} className="text-[13px] font-semibold text-ink">
            {t(`fields.${k}`)}
          </label>
          <input id={k} name={k} type="password" required minLength={k === "current" ? 1 : 12} maxLength={200} autoComplete={k === "current" ? "current-password" : "new-password"} className={input} />
        </div>
      ))}
      <ErrorText message={state.error && tErr(state.error)} />
      {state.saved && (
        <p role="status" className="text-sm font-semibold text-brand-green-dark">
          {t("passwordSaved")}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${primary} self-start`}>
        {pending ? t("saving") : t("passwordSubmit")}
      </button>
    </form>
  );
}

/**
 * Activation de la 2FA, en trois gestes : installer une application, scanner le QR code (ou saisir la clé),
 * taper le code affiché. Le secret n'est actif qu'après ce premier code.
 */
export function MfaSetup() {
  const t = useTranslations("admin.live.security");
  const tErr = useTranslations("admin.live.errors");
  const [setup, startAction, starting] = useActionState<MfaSetupState, FormData>(startMfaSetup, {});
  const [state, action, pending] = useActionState<AuthState, FormData>(enableMfa, {});
  const grouped = setup.secret?.replace(/(.{4})/g, "$1 ").trim();

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex flex-col gap-3 text-[15px] text-ink">
        <li className="flex gap-3">
          <Bullet n={1} />
          <span>
            {t("mfaStep1")} <span className="text-muted">{t("mfaApps")}</span>
          </span>
        </li>
        <li className="flex gap-3">
          <Bullet n={2} />
          <span>{t("mfaStep2")}</span>
        </li>
        <li className="flex gap-3">
          <Bullet n={3} />
          <span>{t("mfaStep3")}</span>
        </li>
      </ol>

      {!setup.secret ? (
        <form action={startAction} className="flex flex-col gap-3">
          <ErrorText message={setup.error && tErr(setup.error)} />
          <button type="submit" disabled={starting} className={`${primary} self-start`}>
            <Icon name="shieldCheck" size={17} /> {starting ? t("saving") : t("mfaStart")}
          </button>
        </form>
      ) : (
        <form action={action} className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-start">
            {setup.qr && (
              // eslint-disable-next-line @next/next/no-img-element -- image data: générée côté serveur
              <img src={setup.qr} alt={t("mfaQrAlt")} width={180} height={180} className="size-[180px] shrink-0 rounded-xl border border-line" />
            )}
            <div className="flex min-w-0 flex-col gap-2 text-sm">
              <strong className="text-night">{t("mfaScan")}</strong>
              <span className="text-muted">{t("mfaKeyHint")}</span>
              <code className="rounded-lg bg-cream px-3 py-2 font-mono text-[15px] break-all text-night select-all">{grouped}</code>
              <a href={setup.uri} className="font-semibold text-night underline underline-offset-2 sm:hidden">
                {t("mfaOpenApp")}
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="mfa-code" className="text-[13px] font-semibold text-ink">
              {t("mfaCode")}
            </label>
            <input
              id="mfa-code"
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              autoFocus
              placeholder="000000"
              className={`${input} h-14 max-w-xs text-center font-mono text-2xl tracking-[0.5em] placeholder:text-line-strong`}
            />
          </div>
          <ErrorText message={state.error && tErr(state.error)} />
          <button type="submit" disabled={pending} className={`${primary} self-start`}>
            {pending ? t("saving") : t("mfaEnable")}
          </button>
        </form>
      )}
    </div>
  );
}

function Bullet({ n }: { n: number }) {
  return <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sand font-mono text-xs font-semibold text-night">{n}</span>;
}
