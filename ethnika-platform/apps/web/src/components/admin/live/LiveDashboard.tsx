import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { leadTypes } from "@/lib/schemas/lead";
import { ageLabel } from "@/lib/demo/stats";
import type { ApiStats } from "@/lib/admin/types";
import { uiStatus } from "@/lib/admin/types";
import { Icon } from "@/components/ui/Icon";
import { formatShort } from "@/components/admin/status";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RequestsChart } from "@/components/admin/RequestsChart";

const todayLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Conakry" });

/** Tableau de bord alimenté par l'API (/v1/stats) : même présentation que la démo. */
export async function LiveDashboard({ stats, name }: { stats: ApiStats; name: string }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin" });
  const now = new Date();
  const k = stats.kpis;
  const delta = k.last7 - k.prev7;
  const days = stats.daily.map((d) => ({ key: d.date, date: new Date(`${d.date}T12:00:00Z`), count: d.count }));
  const byType = leadTypes.map((ty) => ({ ty, n: stats.byType[ty] ?? 0 })).sort((a, b) => b.n - a.n);
  const maxType = Math.max(1, ...byType.map((x) => x.n));

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl bg-night p-5 text-white sm:p-7">
        <Image src="/brand/symbole-or.svg" alt="" width={260} height={260} className="pointer-events-none absolute -top-10 -right-10 w-[220px] opacity-[0.07] sm:w-[260px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="flex max-w-xl flex-col gap-1.5">
            <span className="text-[13px] text-on-dark-muted first-letter:uppercase">{todayLong.format(now)}</span>
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] sm:text-[32px]">{t("live.hello", { name: name.split(/\s+/)[0] ?? name })}</h1>
            <p className="text-[15px] text-on-dark">
              {t("dashboard.situation", { count: k.toTreat })}
              {k.overdue > 0 && <> {t("dashboard.situationOverdue", { count: k.overdue })}</>}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link href="/admin/vols" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-gold px-5 text-sm font-bold text-ink hover:bg-brand-gold-hover sm:w-auto">
              <Icon name="plane" size={16} /> {t("live.flights.searchCta")}
            </Link>
            <Link href="/admin/demandes" className="inline-flex h-11 w-full items-center justify-center rounded-full border border-white/30 px-5 text-sm font-semibold hover:bg-white/10 sm:w-auto">
              {t("dashboard.seeAll")}
            </Link>
          </div>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t("dashboard.kpiToTreat")} value={k.toTreat} note={k.overdue > 0 ? t("dashboard.kpiOverdue", { count: k.overdue }) : t("dashboard.kpiUpToDate")} alert={k.overdue > 0} />
        <Kpi label={t("dashboard.kpiInProgress")} value={k.inProgress} note={t("dashboard.kpiInProgressNote")} />
        <Kpi label={t("dashboard.kpiRate")} value={k.confirmationRate === null ? "–" : `${Math.round(k.confirmationRate * 100)} %`} note={t("dashboard.kpiRateNote")} />
        <Kpi label={t("dashboard.kpi7")} value={k.last7} note={t("dashboard.kpi7Delta", { delta: delta > 0 ? `+${delta}` : String(delta) })} />
      </ul>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-night">{t("dashboard.chartTitle")}</h2>
            <span className="text-[13px] text-muted">{t("dashboard.chartTotal", { count: days.reduce((s, d) => s + d.count, 0) })}</span>
          </div>
          <RequestsChart days={days} />
        </section>

        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-night">{t("dashboard.queueTitle")}</h2>
            <span className="text-[13px] text-muted">{t("dashboard.queueHint")}</span>
          </div>
          {stats.priorityQueue.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t("dashboard.queueEmpty")}</p>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {stats.priorityQueue.map((l) => {
                const age = ageLabel(l.createdAt, now);
                const late = l.status === "new" && age.endsWith("j");
                return (
                  <li key={l.reference}>
                    <Link href={`/admin/demandes/${l.reference}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-cream">
                      <span className={clsx("flex h-9 w-12 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums", late ? "bg-red-50 text-red-700" : "bg-sand text-ink")} title={t("dashboard.age")}>
                        {age}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-sm text-night">{l.fullName}</strong>
                        <span className="truncate text-xs text-muted">
                          {t(`types.${l.type}`)} · {l.assignedTo ? l.assignedTo.name : t("live.leads.unassigned")}
                        </span>
                      </span>
                      <StatusBadge status={uiStatus[l.status]} className="hidden sm:inline-flex" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-base font-bold text-night">{t("dashboard.activityTitle")}</h2>
          {stats.activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t("dashboard.empty")}</p>
          ) : (
            <ol className="flex flex-col">
              {stats.activity.map((e, i) => (
                <li key={`${e.reference}-${e.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < stats.activity.length - 1 && <span aria-hidden="true" className="absolute top-5 left-[7px] h-full w-px bg-line" />}
                  <span aria-hidden="true" className="relative mt-1.5 size-[15px] shrink-0 rounded-full border-[3px] border-white bg-night ring-1 ring-line-strong" />
                  <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 text-sm">
                    <span className="min-w-0">
                      <Link href={`/admin/demandes/${e.reference}`} className="font-mono text-[13px] font-medium text-night hover:underline">
                        {e.reference}
                      </Link>{" "}
                      <span className="text-muted">· {eventLabel(t, e)}</span>
                    </span>
                    <span className="font-mono text-xs whitespace-nowrap text-muted">{formatShort(e.at)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

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
    </>
  );
}

type T = Awaited<ReturnType<typeof getTranslations<"admin">>>;

/** Libellé d'un événement de l'historique de l'API. */
export function eventLabel(t: T, e: { kind: string; status: ApiStats["activity"][number]["status"]; name?: string }) {
  if (e.kind === "received") return e.name ? t("dashboard.eventReceived", { name: e.name }) : t("live.events.received");
  if (e.kind === "status_changed" && e.status) return t(`history.${uiStatus[e.status]}`);
  if (e.kind === "assigned") return t("live.events.assigned");
  if (e.kind === "note") return t("live.events.note");
  if (e.kind === "flight_hold") return t("live.events.flight_hold");
  if (e.kind === "ack_sent") return t("history.ack");
  return t("live.events.other");
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
