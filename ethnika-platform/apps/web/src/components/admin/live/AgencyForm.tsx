"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveAgency, type AgencyState } from "@/lib/admin/agency-actions";
import type { ApiAgency } from "@/lib/admin/types";
import { Area, Field } from "@/components/admin/live/ContentFields";
import { keepValues } from "@/components/admin/live/keep-values";

/** Coordonnées et mentions de l'agence ; un « [ ] » restant signale une information à compléter. */
export function AgencyForm({ agency }: { agency: ApiAgency }) {
  const t = useTranslations("admin.live.agency");
  const tErr = useTranslations("admin.live.errors");
  const [state, action, pending] = useActionState<AgencyState, FormData>(saveAgency, {});
  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-night">{t("contact")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="address" label={t("address")} required maxLength={200} defaultValue={agency.address} />
          <Field name="openingHours" label={t("openingHours")} maxLength={200} defaultValue={agency.openingHours} />
          <Field name="phone" label={t("phone")} required maxLength={40} defaultValue={agency.phone} />
          <Field name="whatsapp" label={t("whatsapp")} maxLength={40} defaultValue={agency.whatsapp} />
          <Field name="email" label={t("email")} type="email" required maxLength={200} defaultValue={agency.email} />
        </div>
      </section>
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-night">{t("legal")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="licence" label={t("licence")} maxLength={80} defaultValue={agency.licence} />
          <Field name="rccm" label={t("rccm")} maxLength={80} defaultValue={agency.rccm} />
        </div>
      </section>
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-night">{t("documents")}</h2>
          <p className="text-sm text-muted">{t("documentsHint")}</p>
        </div>
        <Area name="paymentInstructions" label={t("paymentInstructions")} required maxLength={1200} rows={4} defaultValue={agency.paymentInstructions} hint={t("paymentHint")} />
        <Area name="quoteTerms" label={t("quoteTerms")} maxLength={1200} rows={3} defaultValue={agency.quoteTerms} />
      </section>
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 p-4 shadow-sm backdrop-blur lg:bottom-4">
        {state.error ? (
          <p role="alert" className="text-sm text-red-700">
            {tErr(state.error)}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-sm font-semibold text-brand-green-dark">
            {t("saved")}
          </p>
        ) : (
          <span className="text-xs text-muted">{t("placeholderHint")}</span>
        )}
        <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center rounded-full bg-night px-6 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
          {pending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
