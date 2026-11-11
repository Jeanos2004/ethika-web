"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createQuote, type QuoteState } from "@/lib/admin/quote-actions";
import { quoteCurrencies } from "@/lib/admin/money";
import { Icon } from "@/components/ui/Icon";

const input = "h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] outline-none focus:border-night";

/** Création d'un devis : lignes ajoutables, devise, validité, notes. Le total exact est calculé par l'API. */
export function QuoteForm({ reference, defaultValidUntil }: { reference: string; defaultValidUntil: string }) {
  const t = useTranslations("admin.live.quotes");
  const tErr = useTranslations("admin.live.errors");
  const [state, action, pending] = useActionState<QuoteState, FormData>(createQuote, {});

  return (
    // Clé = dernier devis créé : le formulaire repart vierge après une création.
    <form key={state.created ?? "new"} action={action} className="flex flex-col gap-3 border-t border-line pt-4">
      <input type="hidden" name="ref" value={reference} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="currency" className="text-[13px] font-semibold">
            {t("currency")}
          </label>
          <select id="currency" name="currency" defaultValue="GNF" className={input}>
            {Object.keys(quoteCurrencies).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="validUntil" className="text-[13px] font-semibold">
            {t("validUntil")}
          </label>
          <input id="validUntil" name="validUntil" type="date" required defaultValue={defaultValidUntil} className={input} />
        </div>
      </div>

      <QuoteLines />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="quote-notes" className="text-[13px] font-semibold">
          {t("notes")}
        </label>
        <textarea id="quote-notes" name="notes" rows={2} maxLength={2000} className="rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-night" />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {tErr(state.error)}
        </p>
      )}
      {state.created && (
        <p role="status" className="text-sm font-semibold text-brand-green-dark">
          {t("created", { number: state.created })}
        </p>
      )}
      <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center self-end rounded-full bg-night px-5 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
        {pending ? t("creating") : t("create")}
      </button>
    </form>
  );
}

function QuoteLines() {
  const t = useTranslations("admin.live.quotes");
  const [rows, setRows] = useState([0]);
  const next = useRef(1);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-[13px] font-semibold">{t("lines")}</legend>
      {rows.map((id, i) => (
        <div key={id} className="grid grid-cols-[minmax(0,1fr)_4.5rem_7.5rem_auto] items-end gap-2">
          <input name="label" aria-label={t("label", { n: i + 1 })} placeholder={t("labelPlaceholder")} maxLength={160} required={i === 0} className={input} />
          <input name="quantity" aria-label={t("quantity", { n: i + 1 })} type="number" min={1} max={999} defaultValue={1} className={input} />
          <input name="unitPrice" aria-label={t("unitPrice", { n: i + 1 })} inputMode="decimal" placeholder="0" required={i === 0} className={`${input} text-right tabular-nums`} />
          <button
            type="button"
            onClick={() => setRows((r) => (r.length > 1 ? r.filter((x) => x !== id) : r))}
            disabled={rows.length === 1}
            aria-label={t("removeLine", { n: i + 1 })}
            className="flex size-11 items-center justify-center rounded-xl border border-line text-muted hover:text-night disabled:opacity-40"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
      {rows.length < 30 && (
        <button type="button" onClick={() => setRows((r) => [...r, next.current++])} className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
          <Icon name="plus" size={16} /> {t("addLine")}
        </button>
      )}
    </fieldset>
  );
}
