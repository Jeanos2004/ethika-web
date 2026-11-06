"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { leadStatuses, useHydrated, type DemoLead } from "@/lib/demo/store";
import { statusStyle } from "@/components/admin/status";

/** Compteurs par statut (maquette AdminDemandes.dc.html) : 2 colonnes sur mobile, 4 dès 1024 px. */
export function StatCards({ leads }: { leads: DemoLead[] }) {
  const t = useTranslations("admin");
  const hydrated = useHydrated();
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {leadStatuses.map((s) => (
        <li key={s} className={clsx("flex flex-col gap-1 rounded-[18px] border-l-[5px] bg-white px-4 py-3.5 sm:px-[18px] sm:py-4", statusStyle[s].accent)}>
          <span className="text-[13px] text-muted">{t(`statusesPlural.${s}`)}</span>
          <strong className="font-mono text-2xl text-night sm:text-[28px]">{hydrated ? leads.filter((l) => l.status === s).length : "–"}</strong>
        </li>
      ))}
    </ul>
  );
}
