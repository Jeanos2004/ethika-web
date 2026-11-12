"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { saveCircuit, type ContentState } from "@/lib/admin/content-actions";
import { fromMinorUnits } from "@/lib/admin/money";
import type { ApiCircuit, CircuitDayInput } from "@/lib/admin/types";
import { Icon } from "@/components/ui/Icon";
import { Area, Field, PriceFields, SaveBar, Section, Select, area, input } from "@/components/admin/live/ContentFields";
import { ImageField } from "@/components/admin/live/ImageField";
import { keepValues } from "@/components/admin/live/keep-values";

/** Lignes répétables (jours du programme, départs) avec identifiants stables pour React. */
function useRows<T>(initial: T[], empty: T) {
  const next = useRef(initial.length + 1);
  const [rows, setRows] = useState(() => (initial.length ? initial : [empty]).map((value, i) => ({ id: i, value })));
  return {
    rows,
    add: () => setRows((r) => [...r, { id: next.current++, value: empty }]),
    remove: (id: number) => setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r)),
  };
}

/** Création ou modification d'un circuit : fiche, programme jour par jour, inclus / non inclus, départs, anglais. */
export function CircuitForm({ circuit }: { circuit?: ApiCircuit }) {
  const t = useTranslations("admin.live.content");
  const [state, action, pending] = useActionState<ContentState, FormData>(saveCircuit, {});
  const fr = circuit?.i18n.fr;
  const en = circuit?.i18n.en;
  const days = useRows<CircuitDayInput>(fr?.days ?? [], { title: "", text: "" });
  const deps = useRows(circuit?.departures ?? [], { dates: "", status: "available" as const, price: "" });

  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-4">
      {circuit && <input type="hidden" name="id" value={circuit.id} />}
      <Section title={t("general")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field name="slug" label={t("slug")} required maxLength={80} defaultValue={circuit?.slug} hint={t("slugHint")} />
          <Select
            name="theme"
            label={t("theme")}
            defaultValue={circuit?.theme ?? "nature"}
            options={(["nature", "plage", "culture", "diaspora"] as const).map((v) => [v, t(`themes.${v}`)])}
          />
          <Select
            name="region"
            label={t("region")}
            defaultValue={circuit?.region ?? "moyenne-guinee"}
            options={(["moyenne-guinee", "basse-cote", "conakry", "guinee"] as const).map((v) => [v, t(`regions.${v}`)])}
          />
          <Field name="durationDays" label={t("durationDays")} type="number" required defaultValue={circuit?.durationDays ?? 1} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <ImageField label={t("imageUrl")} defaultValue={circuit?.imageUrl ?? "/images/"} />
          <Field name="position" label={t("position")} type="number" defaultValue={circuit?.position ?? 0} hint={t("positionHint")} />
        </div>
        <PriceFields name="priceFrom" label={t("priceFrom")} amount={fromMinorUnits(circuit?.priceFrom ?? null, circuit?.currency ?? null)} currency={circuit?.currency ?? null} />
      </Section>

      <Section title={t("textsFr")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="fr.title" label={t("cardTitle")} required maxLength={120} defaultValue={fr?.title} />
          <Field name="fr.headline" label={t("headline")} required maxLength={160} defaultValue={fr?.headline} />
          <Field name="fr.place" label={t("place")} required maxLength={120} defaultValue={fr?.place} placeholder="Mali, Moyenne Guinée" />
          <Field name="fr.durationLabel" label={t("durationLabel")} required maxLength={40} defaultValue={fr?.durationLabel} placeholder="4 jours · 3 nuits" />
        </div>
        <Area name="fr.summary" label={t("summary")} required maxLength={400} defaultValue={fr?.summary} rows={2} />
        <Area name="fr.intro" label={t("intro")} maxLength={2000} defaultValue={fr?.intro} rows={4} />
        <Field name="fr.imageAlt" label={t("imageAlt")} required maxLength={160} defaultValue={fr?.imageAlt} hint={t("imageAltHint")} />
      </Section>

      <Section title={t("program")} hint={t("programHint")}>
        <ol className="flex flex-col gap-3">
          {days.rows.map((row, i) => (
            <li key={row.id} className="flex flex-col gap-2 rounded-xl border border-line p-3.5">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm text-night">{t("day", { n: i + 1 })}</strong>
                <button type="button" onClick={() => days.remove(row.id)} disabled={days.rows.length === 1} className="text-sm font-semibold text-muted hover:text-night disabled:opacity-40">
                  {t("remove")}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input name="day.title" aria-label={t("dayTitle", { n: i + 1 })} placeholder={t("dayTitlePh")} maxLength={120} defaultValue={row.value.title} className={input} />
                <input name="day.meta" aria-label={t("dayMeta", { n: i + 1 })} placeholder={t("dayMetaPh")} maxLength={80} defaultValue={row.value.meta} className={input} />
              </div>
              <textarea name="day.text" aria-label={t("dayText", { n: i + 1 })} rows={3} maxLength={1500} defaultValue={row.value.text} className={area} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input name="day.night" aria-label={t("dayNight", { n: i + 1 })} placeholder={t("dayNightPh")} maxLength={80} defaultValue={row.value.night} className={input} />
                <input name="day.meals" aria-label={t("dayMeals", { n: i + 1 })} placeholder={t("dayMealsPh")} maxLength={80} defaultValue={row.value.meals} className={input} />
              </div>
            </li>
          ))}
        </ol>
        <button type="button" onClick={days.add} className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
          <Icon name="plus" size={16} /> {t("addDay")}
        </button>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Area name="fr.included" label={t("included")} defaultValue={fr?.included.join("\n")} rows={5} hint={t("onePerLine")} />
          <Area name="fr.excluded" label={t("excluded")} defaultValue={fr?.excluded.join("\n")} rows={5} hint={t("onePerLine")} />
        </div>
      </Section>

      <Section title={t("departures")} hint={t("departuresHint")}>
        {deps.rows.map((row, i) => (
          <div key={row.id} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_minmax(0,10rem)_auto]">
            <input name="dep.dates" aria-label={t("depDates", { n: i + 1 })} placeholder="12 → 15 déc. 2026" maxLength={60} defaultValue={row.value.dates} className={input} />
            <select name="dep.status" aria-label={t("depStatus", { n: i + 1 })} defaultValue={row.value.status} className={input}>
              <option value="available">{t("depStatuses.available")}</option>
              <option value="last">{t("depStatuses.last")}</option>
              <option value="request">{t("depStatuses.request")}</option>
            </select>
            <input name="dep.price" aria-label={t("depPrice", { n: i + 1 })} placeholder="[PRIX] GNF" maxLength={40} defaultValue={row.value.price} className={input} />
            <button type="button" onClick={() => deps.remove(row.id)} aria-label={t("removeDeparture", { n: i + 1 })} className="flex size-11 items-center justify-center rounded-xl border border-line text-muted hover:text-night">
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
        <button type="button" onClick={deps.add} className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-night hover:underline">
          <Icon name="plus" size={16} /> {t("addDeparture")}
        </button>
      </Section>

      <Section title={t("textsEn")} hint={t("textsEnHint")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field name="en.title" label={t("cardTitle")} maxLength={120} defaultValue={en?.title} />
          <Field name="en.headline" label={t("headline")} maxLength={160} defaultValue={en?.headline} />
          <Field name="en.place" label={t("place")} maxLength={120} defaultValue={en?.place} />
          <Field name="en.durationLabel" label={t("durationLabel")} maxLength={40} defaultValue={en?.durationLabel} />
        </div>
        <Area name="en.summary" label={t("summary")} maxLength={400} defaultValue={en?.summary} rows={2} />
        <Area name="en.intro" label={t("intro")} maxLength={2000} defaultValue={en?.intro} rows={3} />
        <Field name="en.imageAlt" label={t("imageAlt")} maxLength={160} defaultValue={en?.imageAlt} />
      </Section>

      <SaveBar pending={pending} error={state.error} published={circuit?.published ?? false} />
    </form>
  );
}
