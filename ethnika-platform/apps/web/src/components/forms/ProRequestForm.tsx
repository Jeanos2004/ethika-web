"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { LeadFormShell } from "@/components/forms/LeadFormShell";
import { proRequestTypes, type ProPrefill } from "@/lib/schemas/search";

const control =
  "w-full rounded-[var(--radius-sm)] border-[1.5px] bg-night-2 px-3.5 text-base font-medium text-white placeholder:text-on-dark-muted focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/35 focus:outline-none";

function DarkField({ id, label, error, className, children }: { id: string; label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-white">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-semibold text-red-100">
          {error}
        </p>
      )}
    </div>
  );
}

const state = (id: string, error?: string) => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : undefined,
  className: clsx(control, error ? "border-brand-red" : "border-night-muted"),
});

function TextInput({ id, error, ...rest }: { id: string; error?: string } & Omit<ComponentProps<"input">, "id" | "className">) {
  const s = state(id, error);
  return <input {...rest} {...s} className={clsx(s.className, "h-[52px]")} />;
}

/**
 * Demande professionnelle (Services.dc.html § B2B FORM) sur fond nuit.
 * Le type enregistré (groupe, pèlerinage, pro) est déduit côté serveur de la catégorie choisie.
 */
export function ProRequestForm({ prefill }: { prefill: ProPrefill }) {
  const uid = useId();
  const t = useTranslations("pro");
  const tf = useTranslations("forms");
  const id = (k: string) => `${uid}-${k}`;
  const project = prefill.destination || prefill.periode ? t("projectPrefill", { destination: prefill.destination ?? t("toConfirm") }) : undefined;

  return (
    <LeadFormShell type="groupe" tone="dark" thanksPage submitLabel={t("send")} submitTone="gold" submitClassName="h-[58px]" successText={t("successText")} className="min-w-0 flex-[1_1_520px]">
      {(err) => (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
          <DarkField id={id("request")} label={t("requestType")} error={err("request")}>
            <select name="request" defaultValue={prefill.type ?? "groupe"} {...state(id("request"), err("request"))}>
              {(Object.keys(proRequestTypes) as (keyof typeof proRequestTypes)[]).map((v) => (
                <option key={v} value={v}>
                  {t(`types.${v}`)}
                </option>
              ))}
            </select>
          </DarkField>
          <DarkField id={id("org")} label={t("organisation")} error={err("organisation")}>
            <TextInput id={id("org")} name="organisation" autoComplete="organization" maxLength={120} error={err("organisation")} />
          </DarkField>
          <DarkField id={id("name")} label={t("contactName")} error={err("fullName")}>
            <TextInput id={id("name")} name="fullName" autoComplete="name" required maxLength={120} error={err("fullName")} />
          </DarkField>
          <DarkField id={id("phone")} label={t("phone")} error={err("phone")}>
            <TextInput id={id("phone")} name="phone" type="tel" autoComplete="tel" placeholder="+224" required maxLength={20} error={err("phone")} />
          </DarkField>
          <DarkField id={id("email")} label={tf("emailOptional")} error={err("email")}>
            <TextInput id={id("email")} name="email" type="email" autoComplete="email" maxLength={200} error={err("email")} />
          </DarkField>
          <DarkField id={id("count")} label={t("travellers")} error={err("travellers")}>
            <TextInput id={id("count")} name="travellers" type="number" min={1} max={999} defaultValue={prefill.participants ?? 10} required error={err("travellers")} />
          </DarkField>
          <DarkField id={id("period")} label={t("period")} error={err("period")}>
            <TextInput id={id("period")} name="period" placeholder={t("periodPlaceholder")} maxLength={60} defaultValue={prefill.periode} error={err("period")} />
          </DarkField>
          <DarkField id={id("msg")} label={t("project")} error={err("message")} className="col-span-full">
            <textarea name="message" rows={4} required maxLength={3000} defaultValue={project} {...state(id("msg"), err("message"))} className={clsx(state(id("msg"), err("message")).className, "py-3 leading-relaxed")} />
          </DarkField>
        </div>
      )}
    </LeadFormShell>
  );
}
