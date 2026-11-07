"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { leadStatuses, useHydrated, type DemoLead } from "@/lib/demo/store";
import { statusDot } from "@/components/admin/status";

/** Compteurs par statut : cartes blanches sobres, 2 colonnes sur mobile, 4 dès 1024 px. */
export function StatCards({ leads }: { leads: DemoLead[] }) {
  const t = useTranslations("admin");
  const hydrated = useHydrated();
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {leadStatuses.map((s) => (
        <li key={s} className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-4 py-4 sm:px-5">
          <span className="flex items-center gap-2 text-[13px] text-muted">
            <span aria-hidden="true" className={clsx("size-2 rounded-full", statusDot[s])} />
            {t(`statusesPlural.${s}`)}
          </span>
          <strong className="text-[28px] leading-none font-semibold tracking-tight text-night tabular-nums">{hydrated ? leads.filter((l) => l.status === s).length : "–"}</strong>
        </li>
      ))}
    </ul>
  );
}
