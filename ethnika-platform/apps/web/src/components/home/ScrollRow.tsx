"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

/**
 * Rangée défilante à accroche (scroll-snap), pilotée par deux flèches.
 * Le contenu reste une liste défilable au doigt, au trackpad et au clavier (zone focusable).
 * Les flèches se désactivent aux extrémités.
 */
export function ScrollRow({
  label,
  heading,
  children,
  className,
  itemClassName = "w-[min(290px,82vw)] sm:w-[calc((100%-48px)/3)]",
}: {
  label: string;
  heading: ReactNode;
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const t = useTranslations("ui");
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    const first = el?.firstElementChild;
    if (!el || !(first instanceof HTMLElement)) return;
    el.scrollBy({ left: dir * (first.offsetWidth + 24), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const arrow = "flex size-[52px] items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={clsx("flex flex-col gap-6 sm:gap-11", className)}>
      <div className="flex flex-wrap items-end justify-between gap-5">
        {heading}
        <div className="hidden gap-2.5 sm:flex">
          <button type="button" onClick={() => scroll(-1)} disabled={edges.start} aria-label={t("previousItems", { label })} className={clsx(arrow, "border-[1.5px] border-line-strong bg-white text-night hover:border-night")}>
            <Icon name="arrowLeft" size={20} />
          </button>
          <button type="button" onClick={() => scroll(1)} disabled={edges.end} aria-label={t("nextItems", { label })} className={clsx(arrow, "bg-brand-red text-white hover:bg-brand-red-dark")}>
            <Icon name="arrowRight" size={20} />
          </button>
        </div>
      </div>
      <ul
        ref={track}
        onScroll={measure}
        aria-label={label}
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3.5 overflow-x-auto px-4 pt-1 pb-4 sm:mx-0 sm:scroll-px-0 sm:gap-6 sm:px-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {children.map((child, i) => (
          <li key={i} className={clsx("shrink-0 snap-start", itemClassName)}>
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}
