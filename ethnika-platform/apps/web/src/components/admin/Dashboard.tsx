"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { leadTypes } from "@/lib/schemas/lead";
import { useDemoLeads, useHydrated } from "@/lib/demo/store";
import { digest } from "@/lib/demo/summary";
import { ageLabel, dailyCounts, kpis, priorityQueue, recentActivity } from "@/lib/demo/stats";
import { Icon } from "@/components/ui/Icon";
import { formatShort } from "@/components/admin/status";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RequestsChart } from "@/components/admin/RequestsChart";

const tryLinks = [
  { href: "/billetterie#demande", key: "tryTicket" },
  { href: "/circuits/fouta-djallon-cascades-sommets", key: "tryCircuit" },
  { href: "/contact", key: "tryContact" },
  { href: "/services#devis-pro", key: "tryPro" },
] as const;

const todayLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Conakry" });

/** Tableau de bord du back-office : situation du jour, indicateurs, tendance, file prioritaire, activité. */
export function Dashboard() {
  const t = useTranslations("admin");
  const leads = useDemoLeads();
  const hydrated = useHydrated();
  const now = useMemo(() => new Date(), []);
  const k = useMemo(() => kpis(leads, now), [leads, now]);
  const days = useMemo(() => dailyCounts(leads, 14, now), [leads, now]);
  const queue = useMemo(() => priorityQueue(leads), [leads]);
  const activity = useMemo(() => recentActivity(leads), [leads]);
  const byType = leadTypes.map((ty) => ({ ty, n: leads.filter((l) => l.type === ty).length })).sort((a, b) => b.n - a.n);
  const maxType = Math.max(1, ...byType.map((x) => x.n));
  const delta = k.last7 - k.prev7;

  if (!hydrated) return <div className="h-[70vh] animate-pulse rounded-2xl border border-line bg-white" />;

  return (
    <>
      {/* SITUATION DU JOUR */}
      <section className="relative overflow-hidden rounded-2xl bg-night p-5 text-white sm:p-7">
        <Image src="/brand/symbole-or.svg" alt="" width={260} height={260} className="pointer-events-none absolute -top-10 -right-10 w-[220px] opacity-[0.07] sm:w-[260px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="flex max-w-xl flex-col gap-1.5">
            <span className="text-[13px] text-on-dark-muted first-letter:uppercase">{todayLong.format(now)}</span>
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] sm:text-[32px]">{t("dashboard.hello")}</h1>
            <p className="text-[15px] text-on-dark">
              {t("dashboard.situation", { count: k.toTreat })}
              {k.overdue > 0 && <> {t("dashboard.situationOverdue", { count: k.overdue })}</>}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              href="/admin/demandes?nouvelle=1"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-gold px-5 text-sm font-bold text-ink hover:bg-brand-gold-hover sm:w-auto"
            >
              <Icon name="plus" size={16} /> {t("leads.new")}
            </Link>
            <Link href="/admin/demandes" className="inline-flex h-11 w-full items-center justify-center rounded-full border border-white/30 px-5 text-sm font-semibold hover:bg-white/10 sm:w-auto">
              {t("dashboard.seeAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* INDICATEURS */}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t("dashboard.kpiToTreat")} value={k.toTreat} note={k.overdue > 0 ? t("dashboard.kpiOverdue", { count: k.overdue }) : t("dashboard.kpiUpToDate")} alert={k.overdue > 0} />
        <Kpi label={t("dashboard.kpiInProgress")} value={k.inProgress} note={t("dashboard.kpiInProgressNote")} />
        <Kpi label={t("dashboard.kpiRate")} value={k.confirmationRate === null ? "–" : `${Math.round(k.confirmationRate * 100)} %`} note={t("dashboard.kpiRateNote")} />
        <Kpi
          label={t("dashboard.kpi7")}
          value={k.last7}
          note={
            <span className="inline-flex items-center gap-1">
              <Icon name={delta >= 0 ? "arrowUpRight" : "arrowRight"} size={13} className={clsx(delta < 0 && "rotate-45")} />
              {t("dashboard.kpi7Delta", { delta: delta > 0 ? `+${delta}` : String(delta) })}
            </span>
          }
        />
      </ul>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* TENDANCE */}
        <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-night">{t("dashboard.chartTitle")}</h2>
            <span className="text-[13px] text-muted">{t("dashboard.chartTotal", { count: days.reduce((s, d) => s + d.count, 0) })}</span>
          </div>
          <RequestsChart days={days} />
        </section>

        {/* FILE PRIORITAIRE */}
        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-night">{t("dashboard.queueTitle")}</h2>
            <span className="text-[13px] text-muted">{t("dashboard.queueHint")}</span>
          </div>
          {queue.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t("dashboard.queueEmpty")}</p>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {queue.map((l) => {
                const late = l.status === "new" && ageLabel(l.createdAt, now).endsWith("j");
                return (
                  <li key={l.ref}>
                    <Link href={`/admin/demandes?ref=${l.ref}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-cream">
                      <span
                        className={clsx(
                          "flex h-9 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-xs font-semibold tabular-nums",
                          late ? "bg-red-50 text-red-700" : "bg-sand text-ink",
                        )}
                        title={t("dashboard.age")}
                      >
                        {ageLabel(l.createdAt, now)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-sm text-night">{l.name}</strong>
                        <span className="truncate text-xs text-muted">{digest(l).summary}</span>
                      </span>
                      <StatusBadge status={l.status} className="hidden sm:inline-flex" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        {/* ACTIVITÉ */}
        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-base font-bold text-night">{t("dashboard.activityTitle")}</h2>
          <ol className="flex flex-col">
            {activity.map((e, i) => (
              <li key={`${e.ref}-${e.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                {i < activity.length - 1 && <span aria-hidden="true" className="absolute top-5 left-[7px] h-full w-px bg-line" />}
                <span aria-hidden="true" className="relative mt-1.5 size-[15px] shrink-0 rounded-full border-[3px] border-white bg-night ring-1 ring-line-strong" />
                <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="min-w-0">
                    <Link href={`/admin/demandes?ref=${e.ref}`} className="font-mono text-[13px] font-medium text-night hover:underline">
                      {e.ref}
                    </Link>{" "}
                    <span className="text-muted">· {e.status === "received" ? t("dashboard.eventReceived", { name: e.name }) : t(`history.${e.status}`)}</span>
                  </span>
                  <span className="font-mono text-xs whitespace-nowrap text-muted">{formatShort(e.at)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* RÉPARTITION */}
        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-base font-bold text-night">{t("dashboard.byType")}</h2>
          <ul className="flex flex-col gap-3">
            {byType.map(({ ty, n }) => (
              <li key={ty} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-3 text-sm">
                <span className="truncate text-ink">{t(`types.${ty}`)}</span>
                <span aria-hidden="true" className="h-2 rounded-full bg-sand">
                  <span className="block h-full rounded-full bg-night" style={{ width: `${(n / maxType) * 100}%` }} />
                </span>
                <span className="text-right text-muted tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* MODE D'EMPLOI DE LA DÉMO */}
      <details className="group rounded-2xl border border-dashed border-line-strong bg-white/60 px-5 py-4 sm:px-6">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-night">
          <span className="flex items-center gap-2">
            <Icon name="infoMark" size={16} /> {t("dashboard.howTitle")}
          </span>
          <Icon name="chevronDown" size={16} className="transition-transform group-open:rotate-180" />
        </summary>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {(t.raw("dashboard.how") as string[]).map((step, i) => (
            <li key={step} className="flex gap-3 rounded-xl bg-cream p-4 text-sm leading-relaxed text-muted">
              <span className="font-mono text-subtle">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          {tryLinks.map((l) => (
            <a key={l.key} href={l.href} className="inline-flex min-h-10 items-center rounded-full border border-line-strong bg-white px-4 text-sm font-semibold text-night hover:border-night">
              {t(`dashboard.${l.key}`)} →
            </a>
          ))}
        </div>
      </details>
    </>
  );
}

function Kpi({ label, value, note, alert = false }: { label: string; value: number | string; note: React.ReactNode; alert?: boolean }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white px-4 py-4 sm:px-5">
      <span className="text-[13px] text-muted">{label}</span>
      <strong className="text-[30px] leading-none font-semibold tracking-tight text-night tabular-nums">{value}</strong>
      <span className={clsx("text-xs", alert ? "font-semibold text-red-700" : "text-muted")}>{note}</span>
    </li>
  );
}
