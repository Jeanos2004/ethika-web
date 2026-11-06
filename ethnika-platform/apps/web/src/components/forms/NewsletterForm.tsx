"use client";

import { useActionState, useId } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { subscribeNewsletter, type NewsletterState } from "@/lib/actions/newsletter";
import { Icon } from "@/components/ui/Icon";

const initial: NewsletterState = { status: "idle" };

/** Inscription aux alertes promo, sur fond rouge (Offres.dc.html). Fonctionne sans JavaScript. */
export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, initial);
  const uid = useId();
  const t = useTranslations("newsletter");
  const tErr = useTranslations("errors");
  const tf = useTranslations("forms");

  if (state.status === "success") {
    return (
      <p role="status" className="relative flex max-w-[520px] flex-[1_1_380px] items-center gap-3 rounded-full bg-white/15 px-6 py-4 font-semibold">
        <Icon name="check" size={20} strokeWidth={2.6} /> {t("success")}
      </p>
    );
  }

  return (
    <form action={action} noValidate className="relative flex max-w-[520px] flex-[1_1_380px] flex-col gap-2">
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>{tf("honeypot")}</label>
        <input id={`${uid}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-wrap gap-2.5">
        <label htmlFor={`${uid}-email`} className="sr-only">
          {t("email")}
        </label>
        <input
          id={`${uid}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
          placeholder={t("placeholder")}
          aria-invalid={state.status === "error" ? true : undefined}
          aria-describedby={state.status === "error" ? `${uid}-err` : `${uid}-note`}
          className="h-14 min-w-0 flex-[1_1_220px] rounded-full bg-white px-[22px] text-base font-medium text-ink placeholder:text-subtle focus:ring-4 focus:ring-brand-gold/60 focus:outline-none"
        />
        <button type="submit" disabled={pending} className="h-14 rounded-full bg-night px-[26px] text-[15px] font-bold text-white hover:bg-night-line disabled:opacity-60">
          {pending ? t("sending") : t("subscribe")}
        </button>
      </div>
      {state.status === "error" ? (
        <p id={`${uid}-err`} role="alert" className="text-sm font-semibold text-white">
          {tErr(state.message)}
        </p>
      ) : (
        <p id={`${uid}-note`} className="text-xs text-red-25">
          {t("note")}
          <Link href="/confidentialite" className="underline">
            {t("privacy")}
          </Link>
          {t("noteEnd")}
        </p>
      )}
    </form>
  );
}
