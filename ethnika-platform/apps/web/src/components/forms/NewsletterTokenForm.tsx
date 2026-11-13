"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { applyNewsletterToken, type TokenState } from "@/lib/actions/newsletter-token";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** Confirmation d'inscription ou désinscription des alertes promo, sur clic explicite. */
export function NewsletterTokenForm({ action, token }: { action: "confirm" | "unsubscribe"; token: string }) {
  const t = useTranslations("newsletter.token");
  const [state, formAction, pending] = useActionState<TokenState, FormData>(applyNewsletterToken, {});

  if (state.done) {
    return (
      <div role="status" className="flex flex-col items-start gap-5">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-green text-white">
          <Icon name="check" size={30} strokeWidth={2.4} />
        </span>
        <p className="text-lg leading-relaxed text-ink">{t(`${action}.done`)}</p>
        <ButtonLink href="/offres" variant="secondary">
          {t("seeOffers")}
        </ButtonLink>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-start gap-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="action" value={action} />
      <p className="text-lg leading-relaxed text-muted">{t(`${action}.text`)}</p>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !token}
        className="inline-flex h-14 items-center justify-center rounded-full bg-brand-red px-8 font-bold text-white hover:bg-brand-red-dark disabled:opacity-60"
      >
        {pending ? t("working") : t(`${action}.button`)}
      </button>
    </form>
  );
}
