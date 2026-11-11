"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { holdFlight, type HoldState } from "@/lib/admin/actions";
import { keepValues } from "@/components/admin/live/keep-values";

const input = "h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] outline-none focus:border-night";
const titles = ["mr", "mrs", "ms", "miss", "dr"] as const;

/**
 * Passagers et pose de l'option (PNR) : ni paiement ni émission. Les données des passagers vont au fournisseur
 * et ne sont pas copiées dans notre base (seuls le PNR, le montant, l'échéance et le trajet sont gardés).
 */
export function HoldForm({ offerId, leadRef, pax }: { offerId: string; leadRef: string; pax: { adults: number; children: number; infants: number } }) {
  const t = useTranslations("admin.live.flights");
  const tErr = useTranslations("admin.live.errors");
  const [state, action, pending] = useActionState<HoldState, FormData>(holdFlight, {});
  const types: ("adult" | "child" | "infant")[] = [...Array<"adult">(pax.adults).fill("adult"), ...Array<"child">(pax.children).fill("child"), ...Array<"infant">(pax.infants).fill("infant")];

  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <input type="hidden" name="offerId" value={offerId} />
      <input type="hidden" name="count" value={types.length} />
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-night">{t("passengersTitle")}</h2>
        <p className="text-sm text-muted">{t("passengersHint")}</p>
      </div>
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor="leadRef" className="text-[13px] font-semibold">
          {t("leadRef")}
        </label>
        <input id="leadRef" name="leadRef" defaultValue={leadRef} pattern="ETH-[A-HJ-NP-Z2-9]{6}" placeholder="ETH-XXXXXX" className={`${input} font-mono uppercase`} />
      </div>
      {types.map((type, i) => (
        <fieldset key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
          <legend className="px-1 text-[13px] font-semibold">{t("passenger", { n: i + 1, type: t(`paxTypes.${type}`) })}</legend>
          <input type="hidden" name={`p${i}.type`} value={type} />
          <Select id={`p${i}.title`} label={t("civility")} options={titles.map((v) => [v, t(`titles.${v}`)])} />
          <Text id={`p${i}.givenName`} label={t("givenName")} autoComplete="off" />
          <Text id={`p${i}.familyName`} label={t("familyName")} autoComplete="off" />
          <Text id={`p${i}.bornOn`} label={t("bornOn")} type="date" />
          <Select
            id={`p${i}.gender`}
            label={t("gender")}
            options={[
              ["f", t("genders.f")],
              ["m", t("genders.m")],
            ]}
          />
          <Text id={`p${i}.email`} label={t("email")} type="email" />
          <Text id={`p${i}.phone`} label={t("phone")} type="tel" placeholder="+224620000000" />
        </fieldset>
      ))}
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {tErr(state.error)}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">{t("holdHint")}</p>
        <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center rounded-full bg-brand-gold px-6 text-sm font-bold text-ink hover:bg-brand-gold-hover disabled:opacity-60">
          {pending ? t("holding") : t("hold")}
        </button>
      </div>
    </form>
  );
}

function Text({ id, label, type = "text", ...rest }: { id: string; label: string; type?: string; placeholder?: string; autoComplete?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      <input id={id} name={id} type={type} required maxLength={200} className={input} {...rest} />
    </div>
  );
}

function Select({ id, label, options }: { id: string; label: string; options: (readonly [string, string])[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      <select id={id} name={id} required className={input}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
