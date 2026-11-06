"use client";

import { useId, useState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

/**
 * Compteur −/+ (passagers, participants). Boutons désactivés aux bornes, valeur annoncée.
 * Contrôlé (`value` + `onValueChange`, ex. bébés ≤ adultes) ou non contrôlé (`defaultValue`).
 * Avec `name`, la valeur est envoyée avec le formulaire.
 */
export function Counter({
  label,
  hint,
  name,
  min = 0,
  max = 9,
  defaultValue,
  value: controlled,
  onValueChange,
  className,
}: {
  label: string;
  hint?: string;
  name?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  className?: string;
}) {
  const uid = useId();
  const t = useTranslations("ui");
  const [internal, setInternal] = useState(defaultValue ?? min);
  const value = controlled ?? internal;

  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    if (controlled === undefined) setInternal(clamped);
    onValueChange?.(clamped);
  };

  const step = "flex size-11 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div role="group" aria-labelledby={`${uid}-label`} className={clsx("flex flex-col gap-1.5", className)}>
      <span id={`${uid}-label`} className="text-sm font-semibold text-night">
        {label}
      </span>
      {hint && <span className="text-xs text-subtle">{hint}</span>}
      <div className="flex h-[52px] items-center gap-3">
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={value <= min}
          aria-label={t("decrease", { label })}
          className={clsx(step, "border-[1.5px] border-line-strong text-night hover:border-night")}
        >
          <Icon name="minus" size={18} />
        </button>
        <output aria-live="polite" className="min-w-6 text-center font-mono text-lg">
          {value}
        </output>
        <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label={t("increase", { label })} className={clsx(step, "bg-night text-white hover:bg-night-line")}>
          <Icon name="plus" size={18} />
        </button>
      </div>
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
