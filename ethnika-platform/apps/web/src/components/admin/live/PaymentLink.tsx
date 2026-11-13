"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createPaymentLink, renewPaymentLink, type PaymentLinkState } from "@/lib/admin/payment-actions";
import { Icon } from "@/components/ui/Icon";

/** Lien affiché une seule fois : copier, ou partager par WhatsApp au numéro du client. */
function LinkResult({ link, phone, clientName }: { link: string; phone?: string; clientName?: string }) {
  const t = useTranslations("admin.live.payments");
  const [copied, setCopied] = useState(false);
  const digits = phone?.replace(/\D/g, "") ?? "";
  const wa = digits.length >= 8 ? `https://wa.me/${digits}?text=${encodeURIComponent(t("whatsappText", { name: clientName ?? "", link }))}` : undefined;
  return (
    <div role="status" className="flex flex-col gap-2 rounded-xl border border-brand-gold bg-cream p-3 text-sm">
      <strong className="text-night">{t("linkReady")}</strong>
      <code className="block font-mono text-xs break-all text-night select-all">{link}</code>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-night px-3.5 text-[13px] font-semibold text-white"
        >
          <Icon name={copied ? "check" : "link"} size={14} /> {copied ? t("copied") : t("copy")}
        </button>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand-green px-3.5 text-[13px] font-semibold text-white">
            <Icon name="whatsapp" size={14} /> {t("sendWhatsapp")}
          </a>
        )}
      </div>
      <span className="text-xs text-muted">{t("linkHint")}</span>
    </div>
  );
}

/** Création d'un lien pour un devis : reste dû par défaut, acompte si un montant est saisi. */
export function PaymentLinkForm({ quote, reference, currency, phone, clientName }: { quote: string; reference: string; currency: string; phone: string; clientName: string }) {
  const t = useTranslations("admin.live.payments");
  const tErr = useTranslations("admin.live.errors");
  const [state, action, pending] = useActionState<PaymentLinkState, FormData>(createPaymentLink, {});
  return (
    <details className="group w-full">
      <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-white px-3 text-[13px] font-semibold text-night hover:border-night">
        <Icon name="link" size={14} /> {t("createLink")}
      </summary>
      <form action={action} className="mt-2 flex flex-col gap-2 rounded-xl border border-line bg-white p-3">
        <input type="hidden" name="quote" value={quote} />
        <input type="hidden" name="ref" value={reference} />
        <input type="hidden" name="currency" value={currency} />
        <label htmlFor={`amount-${quote}`} className="text-[13px] font-semibold text-ink">
          {t("amountLabel", { currency })}
        </label>
        <div className="flex gap-2">
          <input id={`amount-${quote}`} name="amount" inputMode="decimal" placeholder={t("amountPlaceholder")} className="h-10 min-w-0 flex-1 rounded-xl border border-line-strong bg-white px-3 text-sm outline-none focus:border-night" />
          <button type="submit" disabled={pending} className="h-10 rounded-full bg-night px-4 text-[13px] font-semibold text-white disabled:opacity-60">
            {t("generate")}
          </button>
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-red-700">
            {tErr(state.error)}
          </p>
        )}
        {state.link && <LinkResult link={state.link} phone={phone} clientName={clientName} />}
      </form>
    </details>
  );
}

/** Nouveau lien pour un paiement en attente ou expiré (l'ancien cesse de fonctionner). */
export function RenewLink({ id, phone, clientName }: { id: string; phone?: string; clientName?: string }) {
  const t = useTranslations("admin.live.payments");
  const tErr = useTranslations("admin.live.errors");
  const [state, action, pending] = useActionState<PaymentLinkState, FormData>(renewPaymentLink, {});
  return (
    <div className="flex w-full flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={pending} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border-[1.5px] border-line-strong bg-white px-3 text-[13px] font-semibold text-night hover:border-night disabled:opacity-60">
          <Icon name="refresh" size={14} /> {t("renew")}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {tErr(state.error)}
        </p>
      )}
      {state.link && <LinkResult link={state.link} phone={phone} clientName={clientName} />}
    </div>
  );
}
