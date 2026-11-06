"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { Tabs } from "@/components/ui/Tabs";
import { Icon } from "@/components/ui/Icon";
import { airports, airportLabel } from "@/content/airports";
import { circuitLabels } from "@/content/circuits";
import { localePrefix } from "@/i18n/routing";

/*
 * Barre de recherche en chevauchement (Home2.dc.html § SEARCH).
 * Chaque onglet est un formulaire GET vers la page concernée (dans la langue courante), qui valide
 * les paramètres (lib/schemas/search.ts) et préremplit son formulaire. Fonctionne sans JavaScript.
 */

const cell = "flex min-w-0 flex-col gap-1 px-3 py-2.5 font-mono text-[10px] tracking-[0.1em] text-subtle uppercase sm:px-5 sm:py-3.5 sm:text-[11px]";
const control = "w-full min-w-0 bg-transparent py-1 font-sans text-[17px] font-bold tracking-normal text-ink normal-case placeholder:font-semibold placeholder:text-faint focus:outline-none sm:text-lg";
const divider = "border-b border-line sm:border-b-0 sm:border-r";
const grid = "grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] sm:items-stretch";

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx(cell, "rounded-[10px] focus-within:bg-cream", className)}>
      {label}
      {children}
    </label>
  );
}

function Submit({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="m-0 flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-brand-red px-6 text-base font-bold text-white hover:bg-brand-red-dark sm:m-1.5 sm:min-h-16 sm:rounded-2xl"
    >
      <Icon name="search" size={20} strokeWidth={2.2} />
      {children}
    </button>
  );
}

function FlightForm({ prefix }: { prefix: string }) {
  const t = useTranslations("search");
  const locale = useLocale();
  return (
    <form action={`${prefix}/billetterie`} method="get" className={grid}>
      <Field label={t("from")} className={clsx("col-span-2 sm:col-span-1", divider)}>
        <input name="de" list="home-airports" defaultValue={airportLabel(airports[0], locale)} placeholder={t("fromPlaceholder")} autoComplete="off" maxLength={60} className={control} />
      </Field>
      <Field label={t("to")} className={clsx("col-span-2 sm:col-span-1", divider)}>
        <input name="vers" list="home-airports" placeholder={t("toPlaceholder")} autoComplete="off" maxLength={60} className={control} />
      </Field>
      <Field label={t("depart")} className="border-r border-line">
        <input name="depart" type="date" className={control} />
      </Field>
      <Field label={t("travellers")}>
        <select name="adultes" defaultValue="1" className={control}>
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {t("travellerOption", { count: n })}
            </option>
          ))}
        </select>
      </Field>
      <div className="col-span-2 sm:col-span-1 sm:flex">
        <Submit>{t("getQuote")}</Submit>
      </div>
      <datalist id="home-airports">
        {airports.map((a) => (
          <option key={a.code} value={airportLabel(a, locale)} />
        ))}
      </datalist>
    </form>
  );
}

function CircuitForm({ prefix }: { prefix: string }) {
  const t = useTranslations("search");
  const labels = circuitLabels(useLocale());
  return (
    <form action={`${prefix}/circuits`} method="get" className={grid}>
      <Field label={t("region")} className={clsx("col-span-2 sm:col-span-1", divider)}>
        <select name="region" defaultValue="" className={control}>
          <option value="">{t("allRegions")}</option>
          {Object.entries(labels.regions).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("theme")} className={clsx("col-span-2 sm:col-span-1", divider)}>
        <select name="theme" defaultValue="" className={control}>
          <option value="">{t("themePlaceholder")}</option>
          {Object.entries(labels.themes).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <div className="col-span-2 sm:col-span-1 sm:flex">
        <Submit>{t("seeCircuits")}</Submit>
      </div>
    </form>
  );
}

function GroupForm({ prefix }: { prefix: string }) {
  const t = useTranslations("search");
  return (
    <form action={`${prefix}/services#devis-pro`} method="get" className={grid}>
      <input type="hidden" name="type" value="groupe" />
      <Field label={t("groupDestination")} className={clsx("col-span-2 sm:col-span-1", divider)}>
        <input name="destination" placeholder={t("groupDestinationPlaceholder")} maxLength={80} className={control} />
      </Field>
      <Field label={t("period")} className="border-r border-line">
        <input name="periode" placeholder={t("periodPlaceholder")} maxLength={60} className={control} />
      </Field>
      <Field label={t("travellers")}>
        <select name="participants" defaultValue="10" className={control}>
          {[10, 20, 30, 50, 100].map((n) => (
            <option key={n} value={n}>
              {t("groupSize", { count: n })}
            </option>
          ))}
        </select>
      </Field>
      <div className="col-span-2 sm:col-span-1 sm:flex">
        <Submit>{t("getQuote")}</Submit>
      </div>
    </form>
  );
}

function TabLabel({ short, long }: { short: string; long: string }) {
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{long}</span>
    </>
  );
}

export function HomeSearch() {
  const t = useTranslations("search");
  const prefix = localePrefix(useLocale());
  return (
    <div className="rounded-[22px] bg-white p-2.5 shadow-[0_30px_70px_rgb(18_24_21/0.22)] sm:rounded-3xl">
      <Tabs
        variant="search"
        label={t("tabs")}
        items={[
          { value: "billet", label: <TabLabel short={t("tabFlightShort")} long={t("tabFlight")} />, content: <FlightForm prefix={prefix} /> },
          { value: "circuit", label: <TabLabel short={t("tabCircuitShort")} long={t("tabCircuit")} />, content: <CircuitForm prefix={prefix} /> },
          { value: "groupe", label: <TabLabel short={t("tabGroupShort")} long={t("tabGroup")} />, content: <GroupForm prefix={prefix} /> },
        ]}
      />
    </div>
  );
}
