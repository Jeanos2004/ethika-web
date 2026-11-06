"use client";

import { useActionState, useId, type ReactNode } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { sendLead, type LeadFormState } from "@/lib/actions/lead";
import type { LeadType } from "@/lib/schemas/lead";
import { Icon } from "@/components/ui/Icon";
import { Checkbox } from "@/components/ui/Field";

const initial: LeadFormState = { status: "idle" };

export type FieldError = (field: string) => string | undefined;

/**
 * Coquille commune à tous les formulaires de demande : Server Action `sendLead`, pot de miel,
 * message d'erreur global, consentement et écran de confirmation avec la référence.
 * Les champs propres à chaque formulaire sont fournis par `children(err)`.
 * Les erreurs renvoyées par le serveur sont des clés, traduites ici (messages, espace « errors »).
 * Fonctionne sans JavaScript (progressive enhancement).
 */
export function LeadFormShell({
  type,
  hidden,
  children,
  submitLabel,
  successTitle,
  successText,
  submitClassName,
  className,
  note,
  onReset,
  tone = "light",
  submitTone = "red",
  thanksPage = false,
}: {
  type: LeadType;
  hidden?: Record<string, string>;
  children: (err: FieldError) => ReactNode;
  submitLabel?: string;
  successTitle?: string;
  successText?: string;
  submitClassName?: string;
  className?: string;
  /** Mention affichée à gauche du bouton d'envoi. */
  note?: ReactNode;
  /** Affiche « Nouvelle demande » après l'envoi (le parent remonte le formulaire, ex. via `key`). */
  onReset?: () => void;
  /** « dark » : formulaire posé sur fond nuit (Services § devis pro). */
  tone?: "light" | "dark";
  /** Couleur du bouton d'envoi. */
  submitTone?: "red" | "gold";
  /** Après envoi, redirige vers /merci (Merci.dc.html) au lieu d'afficher la confirmation sur place. */
  thanksPage?: boolean;
}) {
  const [state, action, pending] = useActionState(sendLead, initial);
  const uid = useId();
  const t = useTranslations("forms");
  const tErr = useTranslations("errors");
  const translate = (key: string) => (tErr.has(key) ? tErr(key) : tErr("invalid"));
  const err: FieldError = (k) => {
    const key = state.status === "error" ? state.fieldErrors?.[k]?.[0] : undefined;
    return key ? translate(key) : undefined;
  };

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-center gap-3.5 rounded-[var(--radius-lg)] bg-green-50 px-6 py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-green text-white">
          <Icon name="check" size={30} strokeWidth={2.4} />
        </span>
        <strong className="text-2xl text-night">{successTitle ?? t("successTitle")}</strong>
        <span className="rounded-lg bg-white px-3.5 py-2 font-mono">{t("reference", { ref: state.reference })}</span>
        <p className="max-w-[420px] text-green-700">{successText ?? t("successText")}</p>
        {onReset && (
          <button type="button" onClick={onReset} className="mt-1 h-10 rounded-full border-[1.5px] border-brand-green px-3.5 text-sm font-semibold text-green-700 hover:bg-white">
            {t("newRequest")}
          </button>
        )}
      </div>
    );
  }

  return (
    <form action={action} noValidate className={clsx("flex flex-col gap-4", className)}>
      <input type="hidden" name="type" value={type} />
      {thanksPage && <input type="hidden" name="after" value="merci" />}
      {hidden && Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      {/* Pot de miel invisible pour les humains */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>{t("honeypot")}</label>
        <input id={`${uid}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && (
        <p role="alert" className={clsx("rounded-2xl px-4 py-3 text-sm font-semibold", tone === "dark" ? "bg-brand-red text-white" : "bg-red-50 text-red-700")}>
          {translate(state.message)}
        </p>
      )}

      {children(err)}

      <Checkbox
        name="consent"
        required
        tone={tone}
        error={err("consent")}
        label={
          <span className={clsx("text-[13px] leading-normal", tone === "dark" ? "text-on-dark" : "text-muted")}>
            {t("consent")}
            <Link href="/confidentialite" className={clsx("underline", tone === "dark" ? "text-brand-gold" : "text-brand-red")}>
              {t("consentLink")}
            </Link>
            {t("consentEnd")}
          </span>
        }
      />
      <div className={clsx(note && "flex flex-wrap items-center justify-between gap-4")}>
        {note && <p className={clsx("text-sm", tone === "dark" ? "text-on-dark" : "text-subtle")}>{note}</p>}
        <button
          type="submit"
          disabled={pending}
          className={clsx(
            "inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 font-bold disabled:opacity-60",
            submitTone === "gold" ? "bg-brand-gold text-ink hover:bg-brand-gold-hover" : "bg-brand-red text-white hover:bg-brand-red-dark",
            !note && "w-full",
            submitClassName,
          )}
        >
          {pending ? t("sending") : (submitLabel ?? t("send"))}
          {!pending && <Icon name="arrowRight" size={18} />}
        </button>
      </div>
    </form>
  );
}
