"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createManualLead, type ManualLeadState } from "@/lib/admin/lead-actions";
import { Area, Field, Section, Select } from "@/components/admin/live/ContentFields";
import { keepValues } from "@/components/admin/live/keep-values";

type Kind = "contact" | "billet" | "circuit" | "pro";

/** Saisie d'une demande reçue par téléphone, WhatsApp ou en agence ; champs selon le type. */
export function ManualLeadForm({ circuits }: { circuits: { slug: string; title: string }[] }) {
  const t = useTranslations("admin.live.manual");
  const tErr = useTranslations("admin.live.errors");
  const [state, action, pending] = useActionState<ManualLeadState, FormData>(createManualLead, {});
  const [kind, setKind] = useState<Kind>("billet");

  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-4">
      <Section title={t("client")}>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("type")}>
          {(["billet", "circuit", "pro", "contact"] as const).map((k) => (
            <label key={k} className="cursor-pointer">
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="peer sr-only" />
              <span className="inline-flex min-h-10 items-center rounded-full border-[1.5px] border-line-strong bg-white px-3.5 text-[13px] font-semibold text-night peer-checked:border-night peer-checked:bg-night peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold">
                {t(`kinds.${k}`)}
              </span>
            </label>
          ))}
        </div>
        {kind !== "pro" && <input type="hidden" name="type" value={kind} />}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field name="fullName" label={t("fullName")} required maxLength={120} />
          <Field name="phone" label={t("phone")} required type="tel" maxLength={20} placeholder="+224 620 00 00 00" />
          <Field name="email" label={kind === "pro" ? t("emailOptional") : t("email")} type="email" maxLength={200} required={kind !== "pro"} />
        </div>
      </Section>

      {kind === "billet" && (
        <Section title={t("flight")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Select
              name="trip"
              label={t("trip")}
              defaultValue="rt"
              options={[
                ["rt", t("trips.rt")],
                ["ow", t("trips.ow")],
              ]}
            />
            <Field name="from" label={t("from")} required maxLength={3} placeholder="CKY" />
            <Field name="to" label={t("to")} required maxLength={3} placeholder="CDG" />
            <Select
              name="cabin"
              label={t("cabin")}
              defaultValue="eco"
              options={[
                ["eco", t("cabins.eco")],
                ["business", t("cabins.business")],
                ["first", t("cabins.first")],
              ]}
            />
            <Field name="departDate" label={t("departDate")} type="date" required />
            <Field name="returnDate" label={t("returnDate")} type="date" />
            <Field name="adults" label={t("adults")} type="number" defaultValue={1} required />
            <div className="grid grid-cols-2 gap-2">
              <Field name="children" label={t("children")} type="number" defaultValue={0} />
              <Field name="infants" label={t("infants")} type="number" defaultValue={0} />
            </div>
          </div>
        </Section>
      )}

      {kind === "circuit" && (
        <Section title={t("circuit")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select name="circuit" label={t("circuitName")} options={circuits.map((c) => [c.slug, c.title])} />
            <Field name="travellers" label={t("travellers")} type="number" defaultValue={2} required />
            <Field name="travelDate" label={t("travelDate")} type="date" />
          </div>
        </Section>
      )}

      {kind === "pro" && (
        <Section title={t("pro")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              name="request"
              label={t("request")}
              options={[
                ["groupe", t("requests.groupe")],
                ["pelerinage", t("requests.pelerinage")],
                ["entreprise", t("requests.entreprise")],
                ["ong", t("requests.ong")],
              ]}
            />
            <Field name="organisation" label={t("organisation")} maxLength={120} />
            <Field name="travellers" label={t("travellers")} type="number" defaultValue={10} required />
            <Field name="period" label={t("period")} maxLength={60} />
          </div>
        </Section>
      )}

      <Section title={t("details")}>
        {kind === "contact" && <Field name="subject" label={t("subject")} maxLength={160} />}
        <Area name="message" label={kind === "contact" || kind === "pro" ? t("messageRequired") : t("message")} rows={4} maxLength={3000} required={kind === "contact" || kind === "pro"} />
        <label className="flex items-start gap-2.5 text-sm text-ink">
          <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[var(--color-night)]" />
          {t("consent")}
        </label>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {state.error ? (
          <p role="alert" className="text-sm text-red-700">
            {tErr(state.error)}
            {state.fields?.length ? ` ${t("fieldsToCheck", { fields: state.fields.map((f) => (t.has(`fields.${f}`) ? t(`fields.${f}`) : f)).join(", ") })}` : ""}
          </p>
        ) : (
          <span className="text-xs text-muted">{t("hint")}</span>
        )}
        <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center rounded-full bg-night px-6 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
          {pending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
