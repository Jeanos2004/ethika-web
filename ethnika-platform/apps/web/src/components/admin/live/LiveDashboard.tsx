import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { leadTypes } from "@/lib/schemas/lead";
import { ageLabel } from "@/lib/demo/stats";
import { formatMoney } from "@/lib/admin/money";
import type { ApiLeadStatus, ApiStats } from "@/lib/admin/types";
import { uiStatus } from "@/lib/admin/types";
import { Icon, type IconName } from "@/components/ui/Icon";
import { formatShort, statusDot } from "@/components/admin/status";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DailyChartCard } from "@/components/admin/live/DailyChartCard";

const todayLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Conakry" });
const statuses: ApiLeadStatus[] = ["new", "in_progress", "confirmed", "cancelled"];

function hours(h: number | null) {
  if (h === null) return "–";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} j`;
}

/** Tableau de bord alimenté par l'API (/v1/stats) : situation, indicateurs, tendance, répartitions, file, activité. */
export async function LiveDashboard({ stats, name, role }: { stats: ApiStats; name: string; role: "admin" | "agent" }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin" });
  const now = new Date();
  const k = stats.kpis;
  const delta = k.last7 - k.prev7;
  const totalStatus = Math.max(1, statuses.reduce((s, x) => s + (stats.byStatus[x] ?? 0), 0));
  const byType = leadTypes.map((ty) => ({ ty, n: stats.byType[ty] ?? 0 })).sort((a, b) => b.n - a.n);
  const maxType = Math.max(1, ...byType.map((x) => x.n));
  const site = stats.bySource.site ?? 0;
  const manual = stats.bySource.manual ?? 0;
  const quotes = stats.quotes30.reduce((s, q) => s + q.count, 0);

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
              {stats.flights.dueSoon > 0 && <> {t("live.dash.dueSoonBanner", { count: stats.flights.dueSoon })}</>}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link href="/admin/demandes/nouvelle" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-gold px-5 text-sm font-bold text-ink hover:bg-brand-gold-hover sm:w-auto">
              <Icon name="plus" size={16} /> {t("leads.new")}
            </Link>
            <Link href="/admin/demandes?assignee=me" className="inline-flex h-11 w-full items-center justify-center rounded-full border border-white/30 px-5 text-sm font-semibold hover:bg-white/10 sm:w-auto">
              {t("live.dash.myRequests")}
            </Link>
          </div>
        </div>
      </section>

      {/* INDICATEURS */}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi
          href="/admin/demandes?status=new"
          icon="mail"
          label={t("dashboard.kpiToTreat")}
          value={k.toTreat}
          note={k.overdue > 0 ? t("dashboard.kpiOverdue", { count: k.overdue }) : t("dashboard.kpiUpToDate")}
          alert={k.overdue > 0}
        />
        <Kpi href="/admin/demandes?status=in_progress" icon="clock" label={t("dashboard.kpiInProgress")} value={k.inProgress} note={t("dashboard.kpiInProgressNote")} />
        <Kpi href="/admin/demandes?assignee=me" icon="users" label={t("live.dash.kpiMine")} value={k.mineOpen} note={t("live.dash.kpiMineNote")} />
        <Kpi icon="bolt" label={t("live.dash.kpiHandling")} value={hours(k.medianHandlingHours)} note={t("live.dash.kpiHandlingNote")} />
        <Kpi icon="check" label={t("dashboard.kpiRate")} value={k.confirmationRate === null ? "–" : `${Math.round(k.confirmationRate * 100)} %`} note={t("dashboard.kpiRateNote")} />
        <Kpi
          href="/admin/vols"
          icon="plane"
          label={t("live.dash.kpiHolds")}
          value={stats.flights.held}
          note={stats.flights.dueSoon > 0 ? t("live.dash.kpiHoldsDue", { count: stats.flights.dueSoon }) : t("live.dash.kpiHoldsOk")}
          alert={stats.flights.dueSoon > 0}
        />
      </ul>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <DailyChartCard daily={stats.daily} />

        {/* RÉPARTITION PAR STATUT : barres d'une seule teinte, pastille + libellé pour l'identité */}
        <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-night">{t("live.dash.statusTitle")}</h2>
            <span className="text-[13px] text-muted">{t("live.dash.statusHint", { count: totalStatus })}</span>
          </div>
          <ul className="flex flex-col gap-3.5">
            {statuses.map((s) => {
              const n = stats.byStatus[s] ?? 0;
              return (
                <li key={s}>
                  <Link href={`/admin/demandes?status=${s}`} className="group flex flex-col gap-1.5">
                    <span className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 text-ink group-hover:underline">
                        <span aria-hidden="true" className={clsx("size-2 rounded-full", statusDot[uiStatus[s]])} />
                        {t(`statusesPlural.${uiStatus[s]}`)}
                      </span>
                      <span className="text-muted tabular-nums">
                        <strong className="text-night">{n}</strong> · {Math.round((n / totalStatus) * 100)} %
                      </span>
                    </span>
                    <span aria-hidden="true" className="h-2 rounded-full bg-sand">
                      <span className="block h-full rounded-full bg-night" style={{ width: `${(n / totalStatus) * 100}%` }} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <div>
              <dt className="text-muted">{t("live.dash.sourceSite")}</dt>
              <dd className="text-lg font-semibold text-night tabular-nums">{site}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("live.dash.sourceManual")}</dt>
              <dd className="text-lg font-semibold text-night tabular-nums">{manual}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-night">{t("dashboard.queueTitle")}</h2>
            <Link href="/admin/demandes?status=new" className="text-[13px] font-semibold text-night hover:underline">
              {t("dashboard.seeAll")}
            </Link>
          </div>
          {stats.priorityQueue.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t("dashboard.queueEmpty")}</p>
          ) : (
            <ul className="-mx-2 flex flex-col divide-y divide-line">
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
                          <span className="font-mono">{l.reference}</span> · {t(`types.${l.type}`)} · {l.assignedTo ? l.assignedTo.name : t("live.leads.unassigned")}
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

        <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-base font-bold text-night">{t("live.dash.quotesTitle")}</h2>
          <div className="flex items-baseline gap-2">
            <strong className="text-[30px] leading-none font-semibold tracking-tight text-night tabular-nums">{quotes}</strong>
            <span className="text-sm text-muted">{t("live.dash.quotesCount", { count: quotes })}</span>
          </div>
          {stats.quotes30.length > 0 ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {stats.quotes30.map((q) => (
                <li key={q.currency} className="flex justify-between gap-3 border-b border-line pb-1.5 last:border-0">
                  <span className="text-muted">{t("live.dash.quotesTotal", { currency: q.currency })}</span>
                  <strong className="text-night tabular-nums">{formatMoney(q.total, q.currency)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("live.dash.quotesNone")}</p>
          )}
          <h3 className="mt-2 text-sm font-bold text-night">{t("dashboard.byType")}</h3>
          <ul className="flex flex-col gap-2.5">
            {byType.map(({ ty, n }) => (
              <li key={ty} className="grid grid-cols-[minmax(0,8rem)_1fr_2rem] items-center gap-3 text-sm">
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

      <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-bold text-night">{t("dashboard.activityTitle")}</h2>
          {role === "admin" && (
            <Link href="/admin/journal" className="text-[13px] font-semibold text-night hover:underline">
              {t("live.dash.fullLog")}
            </Link>
          )}
        </div>
        {stats.activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t("dashboard.empty")}</p>
        ) : (
          <ol className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            {stats.activity.map((e, i) => (
              <li key={`${e.reference}-${e.at}-${i}`} className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 text-sm">
                <span className="min-w-0 truncate">
                  <Link href={`/admin/demandes/${e.reference}`} className="font-mono text-[13px] font-medium text-night hover:underline">
                    {e.reference}
                  </Link>{" "}
                  <span className="text-muted">· {eventLabel(t, e)}</span>
                </span>
                <span className="font-mono text-xs whitespace-nowrap text-muted">{formatShort(e.at)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
      <p className="sr-only">{t("live.dash.trend", { delta: delta > 0 ? `+${delta}` : String(delta) })}</p>
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

function Kpi({ label, value, note, icon, href, alert = false }: { label: string; value: number | string; note: string; icon: IconName; href?: string; alert?: boolean }) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2 text-[13px] text-muted">
        {label}
        <Icon name={icon} size={15} className="text-subtle" />
      </span>
      <strong className="text-[28px] leading-none font-semibold tracking-tight text-night tabular-nums">{value}</strong>
      <span className={clsx("text-xs", alert ? "font-semibold text-red-700" : "text-muted")}>{note}</span>
    </>
  );
  const cls = "flex h-full flex-col gap-2 rounded-2xl border border-line bg-white px-4 py-4";
  return <li>{href ? <Link href={href} className={clsx(cls, "hover:border-line-strong hover:shadow-sm")}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
}
