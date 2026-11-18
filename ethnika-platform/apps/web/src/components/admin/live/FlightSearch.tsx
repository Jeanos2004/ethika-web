"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { searchFlights, type SearchState } from "@/lib/admin/actions";
import { Icon } from "@/components/ui/Icon";
import { OfferSummary } from "@/components/admin/live/OfferSummary";

const input = "h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] outline-none focus:border-night";

/** Recherche de vols chez le fournisseur configuré dans l'API, préremplie depuis une demande (?lead=…). */
export function FlightSearch({ prefill }: { prefill: Record<string, string> }) {
  const t = useTranslations("admin.live.flights");
  const tErr = useTranslations("admin.live.errors");
  const [state, action, pending] = useActionState<SearchState, FormData>(searchFlights, {});
  const v = (k: string, fallback = "") => state.query?.[k] ?? prefill[k] ?? fallback;
  const lead = prefill.lead && /^ETH-[A-HJ-NP-Z2-9]{6}$/.test(prefill.lead) ? prefill.lead : "";
  const offerHref = (id: string) => {
    const q = new URLSearchParams({ adults: v("adults", "1"), children: v("children", "0"), infants: v("infants", "0"), ...(lead && { lead }) });
    return `/admin/vols/offre/${encodeURIComponent(id)}?${q.toString()}`;
  };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <form action={action} className="flex flex-col gap-4">
        {lead && <input type="hidden" name="lead" value={lead} />}
        {lead && (
          <p className="text-sm text-muted">
            {t("forLead")}{" "}
            <Link href={`/admin/demandes/${lead}`} className="font-mono font-medium text-night hover:underline">
              {lead}
            </Link>
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Field label={t("origin")} id="origin">
            <input id="origin" name="origin" required maxLength={3} pattern="[A-Za-z]{3}" defaultValue={v("origin", "CKY")} className={`${input} font-mono uppercase`} />
          </Field>
          <Field label={t("destination")} id="destination">
            <input id="destination" name="destination" required maxLength={3} pattern="[A-Za-z]{3}" defaultValue={v("destination", "CDG")} className={`${input} font-mono uppercase`} />
          </Field>
          <Field label={t("departDate")} id="departDate">
            <input id="departDate" name="departDate" type="date" required min={today} defaultValue={v("departDate")} className={input} />
          </Field>
          <Field label={t("returnDate")} id="returnDate">
            <input id="returnDate" name="returnDate" type="date" min={today} defaultValue={v("returnDate")} className={input} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Field label={t("adults")} id="adults">
            <input id="adults" name="adults" type="number" min={1} max={9} required defaultValue={v("adults", "1")} className={input} />
          </Field>
          <Field label={t("children")} id="children">
            <input id="children" name="children" type="number" min={0} max={8} required defaultValue={v("children", "0")} className={input} />
          </Field>
          <Field label={t("infants")} id="infants">
            <input id="infants" name="infants" type="number" min={0} max={8} required defaultValue={v("infants", "0")} className={input} />
          </Field>
          <Field label={t("cabin")} id="cabin">
            <select id="cabin" name="cabin" defaultValue={v("cabin", "eco")} className={input}>
              <option value="eco">{t("cabins.eco")}</option>
              <option value="business">{t("cabins.business")}</option>
              <option value="first">{t("cabins.first")}</option>
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">{t("searchHint")}</p>
          <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-night px-6 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
            <Icon name="search" size={16} /> {pending ? t("searching") : t("search")}
          </button>
        </div>
      </form>

      <div aria-live="polite" className="flex flex-col gap-3">
        {pending && <div className="h-28 animate-pulse rounded-2xl border border-line bg-white" />}
        {!pending && state.error && (
          <p role="alert" className="rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm text-red-700">
            {tErr(state.error)}
          </p>
        )}
        {!pending && state.offers && (
          <>
            <p className="text-sm text-muted">{t("results", { count: state.offers.length, seconds: Math.round((state.tookMs ?? 0) / 1000) })}</p>
            <ul className="flex flex-col gap-3">
              {state.offers.map((o) => (
                <li key={o.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="min-w-0 flex-1">
                    <OfferSummary offer={o} compact />
                  </div>
                  <Link
                    href={offerHref(o.id)}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border-[1.5px] border-night px-5 text-sm font-semibold text-night hover:bg-night hover:text-white"
                  >
                    {t("choose")} <Icon name="arrowRight" size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}
