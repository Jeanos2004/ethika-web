import { clsx } from "clsx";
import type { ReactNode } from "react";

export type BadgeTone = "gold" | "green" | "red" | "night";

const tones: Record<BadgeTone, string> = {
  gold: "bg-brand-gold text-ink",
  green: "bg-brand-green text-white",
  red: "bg-brand-red text-white",
  night: "bg-night text-white",
};

const badgeBase = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold";

/** Étiquette pleine (thème, promo, dernière minute…). */
export function Badge({ tone = "night", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return <span className={clsx(badgeBase, tones[tone], className)}>{children}</span>;
}

/** Statuts d'une demande — mêmes codes que l'API (phase 2). */
export const leadStatuses = {
  new: { label: "Nouvelle", className: "bg-line text-muted" },
  in_progress: { label: "En cours", className: "bg-gold-50 text-gold-700" },
  confirmed: { label: "Confirmée", className: "bg-green-50 text-green-700" },
  cancelled: { label: "Annulée", className: "bg-red-50 text-red-700" },
} as const;

export type LeadStatus = keyof typeof leadStatuses;

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const s = leadStatuses[status];
  return (
    <span className={clsx(badgeBase, s.className, className)}>
      <span aria-hidden="true">●</span>
      {s.label}
    </span>
  );
}
