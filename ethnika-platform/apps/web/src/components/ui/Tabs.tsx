"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { clsx } from "clsx";

const tablistClasses = {
  pill: "inline-flex max-w-full gap-1.5 self-start overflow-x-auto rounded-full bg-sand p-1.5",
  underline: "flex gap-[26px] overflow-x-auto border-b border-line",
  search: "grid grid-cols-3 gap-1 rounded-[14px] bg-sand p-1 sm:flex sm:flex-wrap sm:gap-1.5 sm:bg-transparent",
} as const;

const tabClasses = {
  pill: (selected: boolean) => clsx("h-[42px] shrink-0 rounded-full px-3.5 sm:px-[18px]", selected ? "bg-night text-white" : "text-ink hover:bg-line"),
  underline: (selected: boolean) => clsx("-mb-px border-b-2 pb-3", selected ? "border-brand-red text-brand-red" : "border-transparent text-muted hover:text-night"),
  search: (selected: boolean) =>
    clsx("h-11 rounded-[11px] px-2 text-sm sm:rounded-[12px] sm:px-[18px]", selected ? "bg-night text-white" : "text-night sm:bg-sand hover:bg-line"),
} as const;

export type TabItem = { value: string; label: ReactNode; content: ReactNode };

/**
 * Onglets accessibles (motif WAI-ARIA « tabs », activation automatique).
 * Flèches gauche/droite, Début, Fin. Un seul onglet est atteignable au Tab (tabindex itinérant).
 * Les panneaux inactifs restent dans le HTML (masqués) : contenu indexable et disponible sans JS.
 */
export function Tabs({
  items,
  label,
  variant = "underline",
  defaultValue,
  value: controlled,
  onValueChange,
  className,
}: {
  items: readonly TabItem[];
  label: string;
  variant?: "pill" | "underline" | "search";
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const uid = useId();
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const current = controlled ?? internal;
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const select = (value: string) => {
    if (controlled === undefined) setInternal(value);
    onValueChange?.(value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((t) => t.value === current);
    const last = items.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const target = items[next];
    if (!target) return;
    select(target.value);
    tabRefs.current.get(target.value)?.focus();
  };

  return (
    <div className={clsx("flex flex-col", variant === "search" ? "gap-2" : "gap-6", className)}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={tablistClasses[variant]}
      >
        {items.map((t) => {
          const selected = t.value === current;
          return (
            <button
              key={t.value}
              ref={(el) => {
                if (el) tabRefs.current.set(t.value, el);
                else tabRefs.current.delete(t.value);
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${t.value}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${t.value}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.value)}
              className={clsx("font-semibold whitespace-nowrap transition-colors", tabClasses[variant](selected))}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {items.map((t) => (
        <div
          key={t.value}
          role="tabpanel"
          id={`${uid}-panel-${t.value}`}
          aria-labelledby={`${uid}-tab-${t.value}`}
          hidden={t.value !== current}
          tabIndex={0}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
