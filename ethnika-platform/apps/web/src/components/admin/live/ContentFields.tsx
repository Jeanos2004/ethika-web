"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { quoteCurrencies } from "@/lib/admin/money";

export const input = "h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] outline-none focus:border-night";
export const area = "w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-night";

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-night">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

type FieldProps = { name: string; label: string; defaultValue?: string | number; required?: boolean; maxLength?: number; hint?: string; type?: string; placeholder?: string };

export function Field({ name, label, hint, ...rest }: FieldProps) {
  const id = `f-${name}`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      <input id={id} name={name} className={input} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      {hint && (
        <span id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </span>
      )}
    </div>
  );
}

export function Area({ name, label, hint, rows = 3, ...rest }: FieldProps & { rows?: number }) {
  const id = `f-${name}`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      <textarea id={id} name={name} rows={rows} className={area} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      {hint && (
        <span id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </span>
      )}
    </div>
  );
}

export function Select({ name, label, options, defaultValue }: { name: string; label: string; options: [string, string][]; defaultValue?: string }) {
  const id = `f-${name}`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className={input}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Montant facultatif + devise (unités entières côté API). */
export function PriceFields({ name, label, amount, currency }: { name: string; label: string; amount: string; currency: string | null }) {
  const t = useTranslations("admin.live.content");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
      <Field name={name} label={label} defaultValue={amount} hint={t("priceHint")} />
      <Select name="currency" label={t("currency")} defaultValue={currency ?? "GNF"} options={Object.keys(quoteCurrencies).map((c) => [c, c])} />
    </div>
  );
}

export function SaveBar({ pending, error, published }: { pending: boolean; error?: string; published: boolean }) {
  const t = useTranslations("admin.live.content");
  const tErr = useTranslations("admin.live.errors");
  return (
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 p-4 shadow-sm backdrop-blur lg:bottom-4">
      <label className="flex items-center gap-2 text-sm font-semibold text-night">
        <input type="checkbox" name="published" defaultChecked={published} className="size-4 accent-[var(--color-night)]" />
        {t("published")}
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {tErr(error)}
        </p>
      )}
      <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center rounded-full bg-night px-6 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
        {pending ? t("saving") : t("save")}
      </button>
    </div>
  );
}
