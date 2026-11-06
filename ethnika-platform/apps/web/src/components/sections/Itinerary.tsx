"use client";

import { useId, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

export type ItineraryDay = { title: string; meta?: string; body: ReactNode; tags?: { label: string; tone: "green" | "gold" }[] };

/**
 * Programme jour par jour en accordéon.
 * - « circuit » (CircuitDetail.dc.html) : pastille en arche JOUR/NN, sous-titre, étiquettes nuit/repas, bouton Tout déplier.
 * - « destination » (Destination.dc.html) : étiquette « JOUR N », en-tête sombre quand l'étape est ouverte.
 */
export function Itinerary({
  days,
  variant = "circuit",
  defaultOpen = [0],
  toggleAll = false,
}: {
  days: readonly ItineraryDay[];
  variant?: "circuit" | "destination";
  defaultOpen?: number[];
  toggleAll?: boolean;
}) {
  const uid = useId();
  const t = useTranslations("ui");
  const [open, setOpen] = useState<boolean[]>(() => days.map((_, i) => defaultOpen.includes(i)));
  const allOpen = open.every(Boolean);
  const toggle = (i: number) => setOpen((o) => o.map((v, j) => (j === i ? !v : v)));

  return (
    <div className="flex flex-col gap-3">
      {toggleAll && (
        <button
          type="button"
          onClick={() => setOpen(days.map(() => !allOpen))}
          className="-mt-14 h-10 self-end rounded-full border-[1.5px] border-night px-4 text-sm font-semibold text-night hover:bg-night hover:text-white max-sm:mt-0 max-sm:self-start"
        >
          {allOpen ? t("collapseAll") : t("expandAll")}
        </button>
      )}
      <ol className="flex flex-col gap-3">
        {days.map((d, i) => {
          const isOpen = open[i] ?? false;
          const n = String(i + 1).padStart(2, "0");
          const btnId = `${uid}-b${i}`;
          const panelId = `${uid}-p${i}`;
          return (
            <li key={d.title} className={clsx("overflow-hidden bg-white shadow-sm", variant === "circuit" ? "rounded-[var(--radius-md)]" : "rounded-[var(--radius-panel)]")}>
              <h3>
                <button
                  id={btnId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(i)}
                  className={clsx(
                    "flex w-full items-center gap-[18px] text-left transition-colors",
                    variant === "circuit" ? "px-[22px] py-5" : clsx("px-6 py-5 text-lg font-semibold", isOpen ? "bg-night text-white" : "text-night"),
                  )}
                >
                  {variant === "circuit" ? (
                    <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-[28px_28px_12px_12px] bg-night font-mono text-brand-gold">
                      <span className="text-[10px] text-on-dark-muted">{t("day")}</span>
                      <span className="text-xl">{n}</span>
                    </span>
                  ) : (
                    <span className={clsx("shrink-0 rounded-full px-3 py-1.5 font-mono text-[13px]", isOpen ? "bg-brand-gold text-ink" : "bg-red-50 text-red-700")}>
                      {t("dayN", { n: d.title.startsWith("[") ? "…" : i + 1 })}
                    </span>
                  )}
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className={clsx(variant === "circuit" && "text-[19px] font-bold text-night")}>{d.title}</span>
                    {d.meta && <span className="text-sm text-subtle">{d.meta}</span>}
                  </span>
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      variant === "circuit" ? (isOpen ? "bg-brand-red text-white" : "bg-sand text-night") : "text-current",
                    )}
                  >
                    <Icon name={isOpen ? "minus" : "plus"} size={variant === "circuit" ? 16 : 20} strokeWidth={2.4} />
                  </span>
                </button>
              </h3>
              <div id={panelId} role="region" aria-labelledby={btnId} hidden={!isOpen} className={variant === "circuit" ? "px-[22px] pb-[22px] sm:pl-24" : "px-6 py-5"}>
                <div className="flex flex-col gap-3">
                  <div className="text-base leading-[1.7] text-muted">{d.body}</div>
                  {d.tags && (
                    <div className="flex flex-wrap gap-2 text-[13px]">
                      {d.tags.map((t) => (
                        <span key={t.label} className={clsx("rounded-full px-3 py-1.5 font-semibold", t.tone === "green" ? "bg-green-50 text-green-700" : "bg-gold-50 text-gold-700")}>
                          {t.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
