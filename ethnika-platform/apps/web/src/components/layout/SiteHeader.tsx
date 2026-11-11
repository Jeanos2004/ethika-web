"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { mainNav, site, utilityNav } from "@/lib/site";
import { pages } from "@/content/pages";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const transparentPrefixes = Object.values(pages)
  .filter((p) => p.headerVariant === "transparent")
  .map((p) => p.path);

function isTransparent(pathname: string) {
  if (pathname.startsWith("/circuits/")) return true; // fiches circuit : bannière photo
  return transparentPrefixes.includes(pathname);
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * En-tête du site.
 * - "transparent" : posé sur la bannière photo (logo inversé, liens blancs).
 * - "solid"       : fond crème (pages de contenu).
 * Au-delà de 80px de défilement (Composants §09), la barre de navigation passe en "solid",
 * fixée en haut avec une ombre. Un emplacement de hauteur fixe évite tout saut de mise en page.
 */
/** `contact` : coordonnées de Paramètres > Agence (ou de repli), lues par le layout côté serveur. */
export function SiteHeader({ contact }: { contact: { phone: string; email: string; hours: string } }) {
  const pathname = usePathname() ?? "/";
  const t = useTranslations("header");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const transparent = isTransparent(pathname);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const solid = !transparent || scrolled;

  // Fermer le menu mobile à chaque navigation (ajustement d'état pendant le rendu, pattern React recommandé).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Sentinelle placée à 80px du haut de page : dès qu'elle sort de l'écran, l'en-tête devient fixe.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(entry ? !entry.isIntersecting && entry.boundingClientRect.top < 0 : false));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // Piège de focus : Tab / Maj+Tab restent dans le menu ouvert.
      if (e.key !== "Tab") return;
      const items = document.getElementById("menu-mobile")?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!items?.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const trigger = burger.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className={clsx("z-30 w-full", transparent ? "absolute inset-x-0 top-0" : "relative")}>
      <div ref={sentinel} aria-hidden="true" className="pointer-events-none absolute top-20 left-0 h-px w-px" />
      {/* Barre utilitaire */}
      <div className={clsx("text-[13px]", transparent ? "border-b border-white/15 text-on-dark-2" : "bg-night text-on-dark-2")}>
        <div className="container-site flex flex-wrap justify-between gap-x-6 gap-y-2 py-2.5">
          <div className="hidden flex-wrap gap-x-5 gap-y-2 sm:flex">
            <span>{contact.phone}</span>
            <a href={`mailto:${contact.email}`} className="hover:text-white">
              {contact.email}
            </a>
            <span>{contact.hours}</span>
          </div>
          <div className="flex items-center gap-4">
            {utilityNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={clsx("hover:text-white", isActive(pathname, item.href) && "text-brand-gold")}
              >
                {tNav(item.key)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <div className="h-[84px] lg:h-[94px]">
        <header
          className={clsx(
            "h-[84px] lg:h-[94px]",
            scrolled ? "fixed inset-x-0 top-0 z-40 border-b border-line bg-cream shadow-sm motion-safe:animate-header-in" : !transparent && "border-b border-line bg-cream",
          )}
        >
          <div className="container-site flex h-full items-center justify-between gap-4">
            <Link href="/" aria-label={t("homeLabel", { name: site.name })} aria-current={pathname === "/" ? "page" : undefined} className="-ml-2.5 flex shrink-0">
              <Image
                src={solid ? "/brand/logo-horizontal-couleur.svg" : "/brand/logo-horizontal-inverse.svg"}
                alt={site.name}
                width={196}
                height={62}
                priority
                className="h-[42px] w-auto min-[380px]:h-[52px] lg:h-[62px]"
              />
            </Link>

            <nav aria-label={tNav("main")} className="hidden nav:block">
              <ul className="flex gap-6 text-[15px] font-semibold">
                {mainNav.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={clsx(
                          "pb-1",
                          solid ? "text-night hover:text-brand-red" : "text-white hover:text-brand-gold",
                          active && (solid ? "border-b-2 border-brand-red text-brand-red!" : "border-b-2 border-brand-gold text-brand-gold!"),
                        )}
                      >
                        {tNav(item.key)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher tone={solid ? "light" : "dark"} />
              <div className="hidden sm:block">
                <ButtonLink href="/billetterie">{tCommon("requestQuote")}</ButtonLink>
              </div>
              <button
                ref={burger}
                type="button"
                className={clsx("flex size-11 items-center justify-center rounded-full nav:hidden", solid ? "bg-night text-white" : "bg-white/15 text-white")}
                aria-expanded={open}
                aria-controls="menu-mobile"
                aria-label={open ? t("closeMenu") : t("openMenu")}
                onClick={() => setOpen((v) => !v)}
              >
                <Icon name={open ? "close" : "menu"} size={22} />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Menu mobile plein écran, rendu dans <body> (portail) : aucun élément de la page (bandeau, barres fixes) ne peut le recouvrir. */}
      {open &&
        createPortal(
          <div id="menu-mobile" role="dialog" aria-modal="true" aria-label={t("menu")} className="fixed inset-0 z-50 flex flex-col bg-night text-white nav:hidden">
            <div className="container-site flex items-center justify-between py-4">
              <Image src="/brand/logo-horizontal-inverse.svg" alt={site.name} width={152} height={48} className="h-11 w-auto" />
              <button ref={closeButton} type="button" onClick={() => setOpen(false)} aria-label={t("closeMenu")} className="flex size-11 items-center justify-center rounded-full bg-night-2">
                <Icon name="close" size={22} />
              </button>
            </div>
            <nav aria-label={tNav("mobile")} className="container-site flex-1 overflow-y-auto">
              <ul className="flex flex-col text-[26px] font-bold tracking-tight">
                {mainNav.map((item) => (
                  <li key={item.href} className="border-b border-night-line">
                    <Link href={item.href} className={clsx("block py-3", isActive(pathname, item.href) && "text-brand-gold")} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
                      {tNav(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="container-site flex flex-col gap-3 pb-6">
              <ButtonLink href="/billetterie" size="lg">
                {tCommon("requestQuote")}
              </ButtonLink>
              <div className="flex items-center justify-between text-[13px] text-on-dark-muted">
                <span className="flex gap-1.5">
                  {utilityNav.map((i, n) => (
                    <span key={i.href} className="flex gap-1.5">
                      {n > 0 && <span aria-hidden="true">·</span>}
                      <Link href={i.href} className="hover:text-white">
                        {tNav(i.key)}
                      </Link>
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
