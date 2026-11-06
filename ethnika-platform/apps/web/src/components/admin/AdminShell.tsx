"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { resetDemo, useDemoLeads } from "@/lib/demo/store";

type Section = "dashboard" | "leads";

const soon = ["circuits", "offers", "blog", "gallery", "users"] as const;

/**
 * Coquille du back-office (AdminDemandes.dc.html) :
 * - ≥ 1024 px : barre latérale fixe de 248 px ;
 * - en dessous : barre supérieure + menu en tiroir (Échap, clic sur le voile, focus rendu au bouton).
 */
export function AdminShell({ section, children }: { section: Section; children: ReactNode }) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const leads = useDemoLeads();
  const newCount = leads.filter((l) => l.status === "new").length;

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const trigger = menuButton.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  const nav = (
    <nav aria-label={t("navLabel")} className="flex flex-col gap-1 text-[15px] font-semibold">
      <NavLink href="/admin" current={section === "dashboard"} icon="grid">
        {t("nav.dashboard")}
      </NavLink>
      <NavLink href="/admin/demandes" current={section === "leads"} icon="mail" badge={newCount || undefined}>
        {t("nav.leads")}
      </NavLink>
      {soon.map((k) => (
        <span key={k} aria-disabled="true" className="flex min-h-11 items-center justify-between gap-2 rounded-xl px-3.5 text-on-dark-muted">
          {t(`nav.${k}`)}
          <span className="rounded-full border border-night-muted px-2 py-0.5 font-mono text-[10px] tracking-wide">{t("soon")}</span>
        </span>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-auto flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 rounded-[14px] bg-night-2 p-3.5 text-[13px] text-on-dark">
        <strong className="text-white">{t("agentName")}</strong>
        <span>{t("agentRole")}</span>
      </div>
      <Link href="/" className="flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-on-dark hover:bg-night-2 hover:text-white">
        <Icon name="arrowRight" size={16} className="rotate-180" /> {t("viewSite")}
      </Link>
      <button type="button" onClick={() => resetDemo()} className="flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-left text-sm font-semibold text-on-dark hover:bg-night-2 hover:text-white">
        <Icon name="refresh" size={16} /> {t("reset")}
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh lg:flex">
      {/* Barre latérale (≥ 1024 px) */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-6 overflow-y-auto bg-night px-4 py-[22px] text-on-dark lg:flex">
        <Image src="/brand/logo-horizontal-inverse.svg" alt="ETHNIKA" width={152} height={48} className="h-12 w-auto self-start" />
        <span className="px-2.5 font-mono text-[11px] tracking-[0.14em] text-on-dark-muted">{t("backOffice")}</span>
        {nav}
        {footer}
      </aside>

      {/* Barre supérieure (< 1024 px) */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 bg-night px-4 text-white lg:hidden">
        <Image src="/brand/logo-horizontal-inverse.svg" alt="ETHNIKA" width={120} height={38} className="h-[38px] w-auto" />
        <span className="hidden font-mono text-[11px] tracking-[0.14em] text-on-dark-muted sm:inline">{t("backOffice")}</span>
        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="admin-menu"
          aria-label={t("openMenu")}
          className="relative flex size-11 items-center justify-center rounded-full bg-night-2"
        >
          <Icon name="menu" size={20} />
          {newCount > 0 && <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[11px] font-bold">{newCount}</span>}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-hidden="true" tabIndex={-1} onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/60" />
          <div
            id="admin-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t("navLabel")}
            className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col gap-6 overflow-y-auto bg-night px-4 py-5 text-on-dark"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 font-mono text-[11px] tracking-[0.14em] text-on-dark-muted">{t("backOffice")}</span>
              <button
                ref={closeButton}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("closeMenu")}
                className="flex size-11 items-center justify-center rounded-full bg-night-2 text-white"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <p role="note" className="bg-gold-50 px-4 py-2.5 text-[13px] leading-snug text-gold-700 sm:px-7">
          {t("demoBanner")}
        </p>
        <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 sm:p-7">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ href, current, icon, badge, children }: { href: string; current: boolean; icon: "grid" | "mail"; badge?: number; children: ReactNode }) {
  return (
    <a
      href={href}
      aria-current={current ? "page" : undefined}
      className={clsx("flex min-h-11 items-center justify-between gap-2 rounded-xl px-3.5", current ? "bg-night-2 text-white" : "hover:bg-night-2 hover:text-white")}
    >
      <span className="flex items-center gap-2.5">
        <Icon name={icon} size={17} />
        {children}
      </span>
      {badge !== undefined && <span className="rounded-full bg-brand-red px-2 py-0.5 text-xs text-white">{badge}</span>}
    </a>
  );
}
