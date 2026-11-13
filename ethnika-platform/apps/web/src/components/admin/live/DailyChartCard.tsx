"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { RequestsChart } from "@/components/admin/RequestsChart";

const ranges = [7, 14, 30] as const;

/** Demandes reçues par jour, période au choix (7, 14 ou 30 jours) ; données de /v1/stats (30 jours). */
export function DailyChartCard({ daily }: { daily: { date: string; count: number }[] }) {
  const t = useTranslations("admin");
  const [range, setRange] = useState<(typeof ranges)[number]>(14);
  const days = daily.slice(-range).map((d) => ({ key: d.date, date: new Date(`${d.date}T12:00:00Z`), count: d.count }));
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-base font-bold text-night">{t("live.dash.chartTitle")}</h2>
          <span className="text-[13px] text-muted">{t("live.dash.chartTotal", { count: total, days: range })}</span>
        </div>
        <div role="group" aria-label={t("live.dash.period")} className="flex rounded-full border border-line bg-sand p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={clsx("min-h-9 rounded-full px-3.5 text-[13px] font-semibold tabular-nums", range === r ? "bg-white text-night shadow-sm" : "text-muted hover:text-night")}
            >
              {t("live.dash.days", { n: r })}
            </button>
          ))}
        </div>
      </div>
      <RequestsChart days={days} />
    </section>
  );
}
