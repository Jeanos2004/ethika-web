"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";

export type SectionLink = { id: string; label: string };

/**
 * Barre d'ancres collante sous l'en-tête (Destination.dc.html § TABS, sommaires).
 * La section visible est soulignée et marquée `aria-current="location"`.
 * Sans JavaScript : simples liens d'ancre.
 */
export function SectionNav({ sections, label: labelProp, variant = "bar" }: { sections: readonly SectionLink[]; label?: string; variant?: "bar" | "toc" | "pills" | "links" }) {
  const [active, setActive] = useState(sections[0]?.id);
  const t = useTranslations("ui");
  const label = labelProp ?? t("sections");

  useEffect(() => {
    const targets = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    // La section « active » est la dernière dont le haut a franchi le tiers supérieur de l'écran.
    const observer = new IntersectionObserver(
      () => {
        const line = window.innerHeight / 3;
        const current = targets.filter((t) => t.getBoundingClientRect().top <= line).at(-1) ?? targets[0];
        if (current) setActive(current.id);
      },
      { rootMargin: "0px 0px -60% 0px", threshold: [0, 1] },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [sections]);

  if (variant === "links") {
    return (
      <nav aria-label={label}>
        <ol className="flex flex-col gap-1">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "location" : undefined}
                className={clsx("block py-1.5 text-[15px] transition-colors", active === s.id ? "font-bold text-brand-red" : "text-muted hover:text-night")}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  if (variant === "pills") {
    return (
      <nav aria-label={label} className="container-site relative z-10 -mt-9">
        <ul className="flex flex-wrap gap-2 rounded-[var(--radius-md)] bg-white p-3.5 shadow-[0_20px_50px_rgb(22_33_28/0.12)]">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "location" : undefined}
                className={clsx("block rounded-full px-5 py-3 text-[15px] font-semibold transition-colors", active === s.id ? "bg-night text-white" : "bg-sand text-night hover:bg-line")}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  if (variant === "toc") {
    return (
      <nav aria-label={label} className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-white p-[22px] shadow-[0_14px_40px_rgb(22_33_28/0.07)]">
        <span className="mb-2 font-mono text-[11px] tracking-[0.14em] text-subtle">{t("toc")}</span>
        <ol className="flex flex-col gap-1">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "location" : undefined}
                className={clsx("block rounded-xl px-3 py-2.5 text-[15px] transition-colors", active === s.id ? "bg-sand font-semibold text-night" : "text-muted hover:bg-sand/60 hover:text-night")}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label={label} className="sticky top-[var(--header-h)] z-20 border-b border-line bg-white shadow-[0_6px_20px_rgb(18_24_21/0.05)]">
      <ul className="container-site flex gap-x-[34px] overflow-x-auto text-[15px] font-semibold whitespace-nowrap [scrollbar-width:none]">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              className={clsx("block border-b-[3px] py-5 transition-colors", active === s.id ? "border-brand-red text-brand-red" : "border-transparent text-night hover:text-brand-red")}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
