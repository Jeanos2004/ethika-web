"use client";

import { useId, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Icon } from "@/components/ui/Icon";

export type AccordionItem = { value: string; title: ReactNode; content: ReactNode };

/**
 * Accordéon (Composants §11). Bouton `aria-expanded` relié à sa région.
 * `multiple` : plusieurs panneaux ouverts à la fois (sinon un seul).
 */
export function Accordion({
  items,
  defaultOpen = [],
  multiple = false,
  headingLevel = 3,
  className,
}: {
  items: readonly AccordionItem[];
  defaultOpen?: readonly string[];
  multiple?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const uid = useId();
  const [open, setOpen] = useState<readonly string[]>(defaultOpen);
  const Heading = `h${headingLevel}` as const;

  const toggle = (value: string) =>
    setOpen((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : multiple ? [...prev, value] : [value]));

  return (
    <div className={clsx("flex flex-col gap-2.5", className)}>
      {items.map((item) => {
        const expanded = open.includes(item.value);
        const buttonId = `${uid}-btn-${item.value}`;
        const panelId = `${uid}-panel-${item.value}`;
        return (
          <div key={item.value} className="rounded-[var(--radius-panel)] bg-white shadow-sm">
            <Heading className="m-0">
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(item.value)}
                className="flex w-full items-center justify-between gap-4 rounded-[var(--radius-panel)] px-[22px] py-5 text-left text-[17px] font-semibold text-night"
              >
                {item.title}
                <span
                  aria-hidden="true"
                  className={clsx("flex size-[34px] shrink-0 items-center justify-center rounded-full transition-colors", expanded ? "bg-brand-red text-white" : "bg-sand text-night")}
                >
                  <Icon name={expanded ? "minus" : "plus"} size={16} strokeWidth={2.4} />
                </span>
              </button>
            </Heading>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!expanded} className="px-[22px] pb-5 text-[15px] leading-relaxed text-muted">
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
