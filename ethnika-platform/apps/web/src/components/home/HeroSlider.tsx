"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { Icon } from "@/components/ui/Icon";

export type Slide = {
  image: string;
  alt: string;
  kicker: string;
  titleA: string;
  titleB: string;
  sub: string;
};

const INTERVAL_MS = 7000;

/**
 * Bannière d'accueil à 3 diapositives (Home2.dc.html).
 * - Défilement automatique toutes les 7 s, suspendu au survol et au focus, arrêté si l'utilisateur
 *   réduit les animations ; bouton Pause/Lecture (WCAG 2.2.2).
 * - Le titre de la diapositive courante est le h1 de la page (rendu serveur : diapositive 1).
 * - Seule la première image est rendue au chargement : les suivantes, superposées dans la zone visible,
 *   seraient téléchargées aussitôt malgré loading="lazy" et retarderaient l'image principale (LCP).
 */
export function HeroSlider({ slides }: { slides: readonly Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduced = usePrefersReducedMotion();
  const t = useTranslations("slider");
  const playing = !paused && !hovered && !reduced;
  const count = slides.length;
  const current = slides[index] ?? slides[0];

  const [warm, setWarm] = useState(false);
  useEffect(() => {
    const warmUp = () => setWarm(true);
    if (document.readyState === "complete") {
      const id = window.setTimeout(warmUp, 0);
      return () => window.clearTimeout(id);
    }
    window.addEventListener("load", warmUp, { once: true });
    return () => window.removeEventListener("load", warmUp);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, count]);

  if (!current) return null;
  const go = (i: number) => setIndex((i + count) % count);

  return (
    <section
      aria-roledescription={t("carousel")}
      aria-label={t("label")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
      }}
      className="relative flex min-h-[720px] flex-col overflow-hidden text-white sm:min-h-[860px]"
    >
      {slides.map((s, i) =>
        i === 0 || i === index || warm ? (
          <Image
            key={s.image}
            src={s.image}
            alt={i === index ? s.alt : ""}
            aria-hidden={i === index ? undefined : true}
            fill
            priority={i === 0}
            sizes="100vw"
            quality={90}
            className={clsx("object-cover transition-opacity duration-1000", i === index ? "opacity-100" : "opacity-0")}
          />
        ) : null,
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_24_21/0.78)_0%,rgb(18_24_21/0.25)_30%,rgb(18_24_21/0.3)_60%,rgb(18_24_21/0.88)_100%)]" />

      <div
        aria-live={playing ? "off" : "polite"}
        aria-roledescription={t("slide")}
        aria-label={t("position", { current: index + 1, total: count })}
        className="container-site relative flex flex-1 flex-col justify-end gap-3.5 pt-40 pb-[148px] sm:justify-center sm:gap-6 sm:pt-48 sm:pb-10"
      >
        <span className="self-start rounded-full border border-white/30 bg-white/15 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.14em]">
          {current.kicker}
        </span>
        <h1 className="max-w-[980px] text-[48px] leading-[0.96] font-bold tracking-[-0.045em] sm:text-[clamp(52px,7.6vw,116px)] sm:leading-[0.95]">
          {current.titleA} <span className="font-serif font-normal tracking-[-0.02em] text-brand-gold italic">{current.titleB}</span>
        </h1>
        <p className="max-w-[560px] text-[15px] leading-relaxed text-on-dark-2 sm:text-[19px]">{current.sub}</p>
        <div className="mt-1.5 hidden flex-wrap gap-3 sm:flex">
          <ButtonLink href="/billetterie" variant="gold" className="h-[58px] px-[30px]">
            {t("ctaTicket")} <Icon name="arrowRight" size={18} strokeWidth={2.2} />
          </ButtonLink>
          <ButtonLink href="/circuits" variant="outline-light" className="h-[58px] px-[30px]">
            {t("ctaCircuits")}
          </ButtonLink>
        </div>
      </div>

      <div className="container-site relative hidden items-center justify-between gap-4 pb-7 sm:flex">
        <div className="flex items-center gap-3.5">
          <span className="font-mono text-sm" aria-hidden="true">
            <strong className="text-[22px] font-medium">{String(index + 1).padStart(2, "0")}</strong> / {String(count).padStart(2, "0")}
          </span>
          <Dots count={count} index={index} onPick={go} />
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused || reduced ? t("play") : t("pause")}
            aria-pressed={paused}
            disabled={reduced}
            className="flex size-[52px] items-center justify-center rounded-full border-[1.5px] border-white/60 text-white hover:bg-white/10 disabled:hidden"
          >
            <Icon name={paused ? "play" : "pause"} size={18} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label={t("previous")}
            className="flex size-[52px] items-center justify-center rounded-full border-[1.5px] border-white/60 text-white hover:bg-white/10"
          >
            <Icon name="arrowLeft" size={20} />
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label={t("next")} className="flex size-[52px] items-center justify-center rounded-full bg-white text-night hover:bg-cream">
            <Icon name="arrowRight" size={20} />
          </button>
        </div>
      </div>
      {/* Mobile : points seuls, au-dessus de la barre de recherche */}
      <div className="container-site absolute inset-x-0 bottom-[104px] sm:hidden">
        <Dots count={count} index={index} onPick={go} small />
      </div>
    </section>
  );
}

function Dots({ count, index, onPick, small }: { count: number; index: number; onPick: (i: number) => void; small?: boolean }) {
  const t = useTranslations("slider");
  return (
    <div className="flex">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(i)}
          aria-label={t("goTo", { n: i + 1 })}
          aria-current={i === index ? "true" : undefined}
          // Zone de clic de 24px de haut (WCAG 2.5.8) autour d'une barre fine.
          className="group flex h-6 min-w-6 items-center justify-center px-1"
        >
          <span
            className={clsx(
              "block rounded-[3px] transition-all",
              small ? "h-[5px]" : "h-1.5",
              i === index ? clsx("bg-brand-gold", small ? "w-7" : "w-10") : clsx("bg-white/45 group-hover:bg-white/70", small ? "w-3" : "w-4"),
            )}
          />
        </button>
      ))}
    </div>
  );
}
