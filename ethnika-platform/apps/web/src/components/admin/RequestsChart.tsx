"use client";

import { useTranslations } from "next-intl";

type Day = { key: string; date: Date; count: number };

const dayShort = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Africa/Conakry" });
const dayLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Conakry" });

/** Échelle « propre » : maximum arrondi au-dessus (2, 4, 5, 10…), au moins 2. */
function niceMax(max: number) {
  if (max <= 2) return 2;
  const step = max <= 5 ? 1 : max <= 10 ? 2 : 5;
  return Math.ceil(max / step) * step;
}

/**
 * Demandes reçues par jour (une seule série : pas de légende, le titre la nomme).
 * Barres fines arrondies posées sur la ligne de base, grille discrète, infobulle au survol,
 * tableau équivalent pour les lecteurs d'écran.
 */
export function RequestsChart({ days }: { days: Day[] }) {
  const t = useTranslations("admin.dashboard");
  const max = niceMax(Math.max(...days.map((d) => d.count)));
  const ticks = [max, max / 2, 0];
  // Une date tous les 7 jours sur 30 j, tous les 4 sur 14 j, chaque jour sur 7 j (comptés depuis aujourd'hui).
  const labelStep = days.length > 14 ? 7 : days.length > 7 ? 4 : 1;

  return (
    <figure className="flex flex-col gap-3">
      <div aria-hidden="true" className="relative flex h-48 gap-3 sm:h-60">
        {/* Axe vertical */}
        <div className="flex w-5 shrink-0 flex-col justify-between pb-6 text-right text-[11px] text-muted tabular-nums">
          {ticks.map((v) => (
            <span key={v} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {Number.isInteger(v) ? v : ""}
            </span>
          ))}
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Grille */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {ticks.map((v) => (
              <span key={v} className={v === 0 ? "border-t border-line-strong" : "border-t border-dashed border-line"} />
            ))}
          </div>
          {/* Barres */}
          <div className="relative flex flex-1 items-end gap-[2px] pb-px">
            {days.map((d, i) => {
              const isToday = i === days.length - 1;
              return (
                <div key={d.key} className="group relative flex h-full flex-1 items-end justify-center">
                  {d.count > 0 && <span className="w-full max-w-7 rounded-t-[4px] bg-night transition-colors group-hover:bg-brand-red" style={{ height: `${(d.count / max) * 100}%` }} />}
                  {/* Infobulle */}
                  <span className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-10 hidden -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg group-hover:block">
                    <span className="block text-on-dark capitalize">{isToday ? t("today") : dayLong.format(d.date)}</span>
                    <strong className="tabular-nums">{t("requestsCount", { count: d.count })}</strong>
                  </span>
                </div>
              );
            })}
          </div>
          {/* Axe horizontal : dates espacées selon la période + « Auj. », centrées sous leur barre et jamais tronquées */}
          <div className="flex h-6 items-end gap-[2px] text-[10px] text-muted sm:text-[11px]">
            {days.map((d, i) => (
              <span key={d.key} className="relative h-full flex-1">
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap">{i === days.length - 1 ? t("todayShort") : (days.length - 1 - i) % labelStep === 0 && i > 0 ? dayShort.format(d.date) : ""}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{t("chartTitle")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("day")}</th>
            <th scope="col">{t("requests")}</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.key}>
              <th scope="row">{dayLong.format(d.date)}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
