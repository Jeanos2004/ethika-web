"use client";

import { useId, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { LeadFormShell, type FieldError } from "@/components/forms/LeadFormShell";
import { IdentityFields } from "@/components/forms/LeadForm";
import { BoardingPass } from "@/components/cards/BoardingPass";
import { Icon } from "@/components/ui/Icon";
import { airports, airportLabel, cityOf, extractIata } from "@/content/airports";
import { cabins, tripTypes, type Cabin, type FlightPrefill, type TripType } from "@/lib/schemas/search";
import { whatsappLink } from "@/lib/site";

const MAX_LEGS = 4;
const today = () => new Date().toISOString().slice(0, 10);

const inputCls =
  "h-14 w-full rounded-2xl border-[1.5px] bg-white px-4 text-base font-semibold text-ink placeholder:font-normal placeholder:text-faint focus:border-night focus:ring-4 focus:ring-brand-gold/35 focus:outline-none";

function TextField({ label, error, children, id }: { label: string; error?: string; children: ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={clsx("text-sm font-semibold", error ? "text-red-700" : "text-night")}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const a11y = (id: string, error?: string) => ({ "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : undefined });
const tone = (error?: string) => (error ? "border-brand-red bg-red-25" : "border-line-strong");

/** Groupe de boutons radio présentés en segments (type de trajet) ou en pastilles (classe). Fonctionne sans JS. */
function Choice<T extends string>({ name, legend, options, value, onChange, variant }: { name: string; legend: string; options: Record<T, string>; value: T; onChange: (v: T) => void; variant: "segment" | "pill" }) {
  return (
    <fieldset className={clsx(variant === "pill" && "flex flex-wrap items-center gap-2")}>
      <legend className={clsx(variant === "segment" ? "sr-only" : "float-left mr-1.5 text-sm font-semibold text-night")}>{legend}</legend>
      <div className={clsx(variant === "segment" ? "flex w-fit max-w-full flex-wrap gap-1.5 rounded-[18px] bg-sand p-1.5" : "contents")}>
        {(Object.entries(options) as [T, string][]).map(([v, label]) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="peer sr-only" />
            <span
              className={clsx(
                "flex items-center font-semibold transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-gold",
                variant === "segment"
                  ? clsx("h-[46px] rounded-[14px] px-5 text-[15px]", value === v ? "bg-night text-white" : "text-night hover:bg-line")
                  : clsx("h-11 rounded-full border-[1.5px] px-[18px] text-sm", value === v ? "border-brand-red bg-brand-red text-white" : "border-line-strong bg-white text-night hover:border-night"),
              )}
            >
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PaxCounter({ label, sub, name, value, min, max, onChange }: { label: string; sub: string; name: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const uid = useId();
  const t = useTranslations("ui");
  const btn = "flex size-11 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div role="group" aria-labelledby={`${uid}-l`} className="flex items-center justify-between gap-2.5 rounded-[18px] border-[1.5px] border-line-strong px-3.5 py-3">
      <div className="flex flex-col">
        <strong id={`${uid}-l`} className="text-[15px] text-night">
          {label}
        </strong>
        <span className="text-xs text-subtle">{sub}</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={t("decrease", { label })} className={`${btn} border-[1.5px] border-line-strong bg-white text-night`}>
          <Icon name="minus" size={18} />
        </button>
        <output aria-live="polite" className="min-w-[18px] text-center font-mono text-[19px]">
          {value}
        </output>
        <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t("increase", { label })} className={`${btn} bg-night text-white`}>
          <Icon name="plus" size={18} />
        </button>
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

/**
 * Demande de billet (Billetterie.dc.html § FORM + SUMMARY) : formulaire et récapitulatif « carte d'embarquement » en direct.
 * Préremplissage depuis la recherche de l'accueil (paramètres validés côté serveur).
 */
export function FlightRequest({ prefill }: { prefill: FlightPrefill }) {
  const uid = useId();
  const locale = useLocale();
  const t = useTranslations("flight");
  const tCards = useTranslations("cards");
  const label = (code: string) => airportLabel({ code, city: cityOf(code, locale) }, locale);
  const [formKey, setFormKey] = useState(0);
  const [trip, setTrip] = useState<TripType>(prefill.trip ?? "rt");
  const [from, setFrom] = useState(label(prefill.from ?? "CKY"));
  const [to, setTo] = useState(prefill.to ? label(prefill.to) : "");
  const [depart, setDepart] = useState(prefill.depart ?? "");
  const [adults, setAdults] = useState(prefill.adults ?? 1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabin, setCabin] = useState<Cabin>(prefill.cabin ?? "eco");
  const [legs, setLegs] = useState<number[]>([0]);

  const tripLabels = Object.fromEntries((Object.keys(tripTypes) as TripType[]).map((k) => [k, t(`trips.${k}`)])) as Record<TripType, string>;
  const cabinLabels = Object.fromEntries((Object.keys(cabins) as Cabin[]).map((k) => [k, t(`cabins.${k}`)])) as Record<Cabin, string>;

  const setAdultsClamped = (n: number) => {
    setAdults(n);
    if (infants > n) setInfants(n); // un bébé par adulte au maximum
  };

  const airportOf = (text: string, fallback: { code: string; city: string }) => {
    if (!text.trim()) return fallback;
    const code = extractIata(text);
    if (!code) return { code: "???", city: text };
    const city = cityOf(code, locale);
    return { code, city: city === code ? text.replace(/\s*\([^)]*\)\s*/g, "") : city };
  };

  const pax = [t("paxAdults", { count: adults }), children ? t("paxChildren", { count: children }) : "", infants ? t("paxInfants", { count: infants }) : ""].filter(Boolean).join(" · ");

  const fields = (err: FieldError) => (
    <>
      <Choice name="trip" legend={t("tripLegend")} options={tripLabels} value={trip} onChange={setTrip} variant="segment" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
        <TextField id={`${uid}-from`} label={t("from")} error={err("from")}>
          <input id={`${uid}-from`} name="from" list={`${uid}-airports`} value={from} onChange={(e) => setFrom(e.target.value)} autoComplete="off" maxLength={60} required className={clsx(inputCls, tone(err("from")))} {...a11y(`${uid}-from`, err("from"))} />
        </TextField>
        <TextField id={`${uid}-to`} label={t("to")} error={err("to")}>
          <input id={`${uid}-to`} name="to" list={`${uid}-airports`} value={to} onChange={(e) => setTo(e.target.value)} placeholder={t("toPlaceholder")} autoComplete="off" maxLength={60} required className={clsx(inputCls, tone(err("to")))} {...a11y(`${uid}-to`, err("to"))} />
        </TextField>
        <TextField id={`${uid}-dep`} label={t("depart")} error={err("departDate")}>
          <input id={`${uid}-dep`} name="departDate" type="date" min={today()} value={depart} onChange={(e) => setDepart(e.target.value)} required className={clsx(inputCls, "font-medium", tone(err("departDate")))} {...a11y(`${uid}-dep`, err("departDate"))} />
        </TextField>
        {trip === "rt" && (
          <TextField id={`${uid}-ret`} label={t("return")} error={err("returnDate")}>
            <input id={`${uid}-ret`} name="returnDate" type="date" min={depart || today()} defaultValue={prefill.back} required className={clsx(inputCls, "font-medium", tone(err("returnDate")))} {...a11y(`${uid}-ret`, err("returnDate"))} />
          </TextField>
        )}
      </div>
      <datalist id={`${uid}-airports`}>
        {airports.map((a) => (
          <option key={a.code} value={airportLabel(a, locale)} />
        ))}
      </datalist>

      {trip === "multi" && (
        <fieldset className="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-dashed border-line-strong p-4">
          <legend className="px-1 text-sm font-semibold text-night">{t("nextFlights")}</legend>
          {err("legs") && <p className="text-xs font-semibold text-red-700">{err("legs")}</p>}
          {legs.map((id, i) => (
            <div key={id} className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] items-end gap-3">
              <TextField id={`${uid}-lf${id}`} label={t("legFrom", { n: i + 2 })}>
                <input id={`${uid}-lf${id}`} name="legFrom" list={`${uid}-airports`} placeholder={t("city")} autoComplete="off" maxLength={60} className={clsx(inputCls, "h-[50px] text-[15px] font-medium", tone())} />
              </TextField>
              <TextField id={`${uid}-lt${id}`} label={t("legTo", { n: i + 2 })}>
                <input id={`${uid}-lt${id}`} name="legTo" list={`${uid}-airports`} placeholder={t("city")} autoComplete="off" maxLength={60} className={clsx(inputCls, "h-[50px] text-[15px] font-medium", tone())} />
              </TextField>
              <TextField id={`${uid}-ld${id}`} label={t("legDate", { n: i + 2 })}>
                <input id={`${uid}-ld${id}`} name="legDate" type="date" min={depart || today()} className={clsx(inputCls, "h-[50px] text-[15px] font-medium", tone())} />
              </TextField>
              {legs.length > 1 && (
                <button type="button" onClick={() => setLegs((l) => l.filter((x) => x !== id))} className="h-[50px] rounded-[14px] border-[1.5px] border-line-strong px-4 text-[15px] font-semibold text-muted hover:border-night">
                  {t("removeLeg", { n: i + 2 })}
                </button>
              )}
            </div>
          ))}
          {legs.length < MAX_LEGS && (
            <button type="button" onClick={() => setLegs((l) => [...l, Math.max(...l) + 1])} className="h-[50px] self-start rounded-[14px] border-[1.5px] border-night px-5 text-[15px] font-semibold text-night hover:bg-night hover:text-white">
              {t("addLeg")}
            </button>
          )}
        </fieldset>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
        <PaxCounter label={t("adults")} sub={t("adultsSub")} name="adults" value={adults} min={1} max={9} onChange={setAdultsClamped} />
        <PaxCounter label={t("children")} sub={t("childrenSub")} name="children" value={children} min={0} max={8} onChange={setChildren} />
        <PaxCounter label={t("infants")} sub={t("infantsSub")} name="infants" value={infants} min={0} max={adults} onChange={setInfants} />
      </div>
      {err("infants") && <p className="text-xs font-semibold text-red-700">{err("infants")}</p>}

      <Choice name="cabin" legend={t("cabinLegend")} options={cabinLabels} value={cabin} onChange={setCabin} variant="pill" />

      <div className="border-t border-dashed border-line-strong pt-[22px]">
        <IdentityFields err={err} />
      </div>
    </>
  );

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="min-w-0 flex-[999_1_600px] rounded-[30px] bg-white p-[clamp(20px,3vw,36px)] shadow-[0_30px_70px_rgb(18_24_21/0.18)]">
        <LeadFormShell
          key={formKey}
          type="billet"
          className="gap-[26px]"
          note={t("note")}
          successTitle={t("successTitle")}
          successText={t("successText")}
          onReset={() => setFormKey((k) => k + 1)}
          submitClassName="h-[60px] px-[34px] text-[17px]"
        >
          {fields}
        </LeadFormShell>
      </div>
      <aside aria-label={t("summary")} className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:max-w-[430px]">
        <BoardingPass
          tripLabel={tripLabels[trip].toUpperCase()}
          from={airportOf(from, { code: "???", city: tCards("departureCity") })}
          to={to.trim() ? airportOf(to, { code: "???", city: tCards("yourDestination") }) : undefined}
          passengers={pax}
          cabin={cabinLabels[cabin]}
        />
        <a
          href={whatsappLink(t("whatsappMessage"))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3.5 rounded-[var(--radius-md)] bg-white px-5 py-[18px] shadow-md hover:shadow-lg"
        >
          <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-brand-green text-white">
            <Icon name="whatsapp" size={22} />
          </span>
          <span className="flex flex-col">
            <strong className="text-night">{t("whatsappTitle")}</strong>
            <span className="text-sm text-muted">{t("whatsappText")}</span>
          </span>
        </a>
      </aside>
    </div>
  );
}
