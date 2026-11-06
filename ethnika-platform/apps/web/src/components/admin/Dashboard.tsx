"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { leadTypes } from "@/lib/schemas/lead";
import { useDemoLeads, useHydrated } from "@/lib/demo/store";
import { digest } from "@/lib/demo/summary";
import { formatShort } from "@/components/admin/status";
import { StatusBadge } from "@/components/admin/StatusBadge";

import { StatCards } from "@/components/admin/StatCards";

const tryLinks = [
  { href: "/billetterie#demande", key: "tryTicket" },
  { href: "/circuits/fouta-djallon-cascades-sommets", key: "tryCircuit" },
  { href: "/contact", key: "tryContact" },
  { href: "/services#devis-pro", key: "tryPro" },
] as const;

/** Tableau de bord du back-office : compteurs, dernières demandes, répartition par type, mode d'emploi de la démo. */
export function Dashboard() {
  const t = useTranslations("admin");
  const leads = useDemoLeads();
  const hydrated = useHydrated();
  const recent = leads.slice(0, 5);
  const max = Math.max(1, ...leadTypes.map((ty) => leads.filter((l) => l.type === ty).length));

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-night sm:text-[34px]">{t("dashboard.title")}</h1>
        <span className="text-[13px] text-muted">{t("dashboard.intro")}</span>
      </div>

      <StatCards leads={leads} />

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-night">{t("dashboard.howTitle")}</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {(t.raw("dashboard.how") as string[]).map((step, i) => (
            <li key={step} className="flex gap-3 rounded-xl bg-cream p-4 text-sm leading-relaxed text-muted">
              <span className="font-mono text-subtle">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {tryLinks.map((l) => (
            <a key={l.key} href={l.href} className="inline-flex min-h-10 items-center rounded-full border border-line-strong px-4 text-sm font-semibold text-night hover:border-night">
              {t(`dashboard.${l.key}`)} →
            </a>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-night">{t("dashboard.recent")}</h2>
            <Link href="/admin/demandes" className="inline-flex min-h-11 items-center text-sm font-semibold text-night hover:underline">
              {t("dashboard.seeAll")} →
            </Link>
          </div>
          {!hydrated ? (
            <div className="h-48 animate-pulse rounded-2xl bg-sand" />
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted">{t("dashboard.empty")}</p>
          ) : (
            <ul className="flex flex-col">
              {recent.map((l) => (
                <li key={l.ref} className="border-t border-line first:border-t-0">
                  <Link href={`/admin/demandes?ref=${l.ref}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 hover:bg-cream sm:flex-nowrap">
                    <span className="font-mono text-sm font-medium whitespace-nowrap text-night">{l.ref}</span>
                    <span className="min-w-0 flex-1 basis-full truncate text-sm text-muted sm:basis-auto">
                      <strong className="text-night">{l.name}</strong> · {digest(l).summary}
                    </span>
                    <span className="font-mono text-xs whitespace-nowrap text-muted">{formatShort(l.createdAt)}</span>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-night">{t("dashboard.byType")}</h2>
          <ul className="flex flex-col gap-2.5">
            {leadTypes.map((ty) => {
              const n = hydrated ? leads.filter((l) => l.type === ty).length : 0;
              return (
                <li key={ty} className="flex flex-col gap-1 text-sm">
                  <span className="flex justify-between gap-2">
                    {t(`types.${ty}`)}
                    <span className="font-mono text-muted">{n}</span>
                  </span>
                  <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-sand">
                    <span className="block h-full rounded-full bg-night" style={{ width: `${(n / max) * 100}%` }} />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
