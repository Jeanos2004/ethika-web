"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";
import { resetDemo, useDemoLeads } from "@/lib/demo/store";
import { NotificationBell } from "@/components/admin/live/NotificationBell";
import type { ApiNotifications } from "@/lib/admin/types";
import { logout } from "@/lib/admin/auth-actions";

type Section = "dashboard" | "leads" | "flights" | "payments" | "security" | "settings" | "users" | "audit" | "offers" | "circuits" | "blog" | "gallery";

/** Back-office connecté à l'API : compte en cours et compteur des nouvelles demandes (sinon : démo locale). */
export type LiveAccount = { name: string; role: "admin" | "agent"; newCount: number; notifications?: ApiNotifications };

const soon = ["circuits", "offers", "blog", "gallery", "users"] as const;

/** Outils réservés aux administrateurs (back-office connecté) : retirés de la liste « bientôt ». */
const adminTools = [
  { key: "circuits", href: "/admin/circuits", icon: "mountain" },
  { key: "offers", href: "/admin/offres", icon: "ticket" },
  { key: "blog", href: "/admin/blog", icon: "globe" },
  { key: "gallery", href: "/admin/galerie", icon: "image" },
  { key: "users", href: "/admin/utilisateurs", icon: "users" },
  { key: "audit", href: "/admin/journal", icon: "shieldCheck" },
] as const;

function toolsFor(live?: LiveAccount) {
  return live?.role === "admin" ? adminTools : [];
}

/**
 * Rubrique « à venir » : démo = tout le futur back-office ; administrateur = ce qui n'existe pas encore
 * (plus rien aujourd'hui) ; agent = rien (circuits, offres et comptes existent, mais ne le concernent pas).
 */
function soonFor(live?: LiveAccount) {
  if (live?.role === "agent") return [];
  const tools = toolsFor(live).map((x) => x.key as string);
  return soon.filter((k) => !tools.includes(k));
}

/**
 * Coquille du back-office.
 * - ≥ 1024 px : barre latérale fixe (navigation, compte, démo).
 * - < 1024 px : barre supérieure compacte (logo + titre) et barre d'onglets en bas d'écran, à portée de pouce :
 *   Accueil · Demandes · Nouvelle (action principale) · Plus (panneau des options secondaires).
 */
export function AdminShell({ section, title, live, children }: { section: Section; title: string; live?: LiveAccount; children: ReactNode }) {
  const t = useTranslations("admin");
  const [moreOpen, setMoreOpen] = useState(false);
  const leads = useDemoLeads();
  const newCount = live ? live.newCount : leads.filter((l) => l.status === "new").length;

  return (
    <div className="min-h-dvh lg:flex">
      {/* Barre latérale (≥ 1024 px) */}
      <aside className="sticky top-0 hidden h-dvh w-[252px] shrink-0 flex-col gap-7 overflow-y-auto bg-night px-4 py-6 text-on-dark lg:flex">
        <div className="flex items-start justify-between gap-2 px-2">
          <div className="flex flex-col gap-2">
            <Image src="/brand/logo-horizontal-inverse.svg" alt="ETHNIKA" width={152} height={48} className="h-11 w-auto self-start" />
            <span className="font-mono text-[11px] tracking-[0.14em] text-on-dark-muted">{t("backOffice")}</span>
          </div>
        </div>
        <nav aria-label={t("navLabel")} className="flex flex-col gap-1 text-[15px] font-semibold">
          <SideLink href="/admin" current={section === "dashboard"} icon="grid">
            {t("nav.dashboard")}
          </SideLink>
          <SideLink href="/admin/demandes" current={section === "leads"} icon="mail" badge={newCount || undefined}>
            {t("nav.leads")}
          </SideLink>
          {live && (
            <SideLink href="/admin/vols" current={section === "flights"} icon="plane">
              {t("nav.flights")}
            </SideLink>
          )}
          {live && (
            <SideLink href="/admin/paiements" current={section === "payments"} icon="briefcase">
              {t("nav.payments")}
            </SideLink>
          )}
          {toolsFor(live).map((x) => (
            <SideLink key={x.key} href={x.href} current={section === x.key} icon={x.icon}>
              {t(`nav.${x.key}`)}
            </SideLink>
          ))}
          {soonFor(live).length > 0 && <span className="mt-4 mb-1 px-3.5 font-mono text-[10px] tracking-[0.14em] text-on-dark-muted">{(live ? t("live.soon") : t("soon")).toUpperCase()}</span>}
          {soonFor(live).map((k) => (
            <span key={k} aria-disabled="true" className="flex min-h-10 items-center rounded-xl px-3.5 text-[14px] font-medium text-on-dark-muted">
              {t(`nav.${k}`)}
            </span>
          ))}
        </nav>
        <AccountFooter live={live} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure (< 1024 px) */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-night-line bg-night px-4 text-white lg:hidden">
          <Image src="/brand/symbole-or.svg" alt="ETHNIKA" width={28} height={28} className="size-7" />
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</span>
        </header>

        {!live && (
          <p role="note" className="border-b border-line bg-white px-4 py-2.5 text-[13px] leading-snug text-muted sm:px-7">
            {t("demoBanner")}
          </p>
        )}
        {/* Espace réservé en bas pour la barre d'onglets mobile (+ zone de sécurité des écrans à encoche). */}
        <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-7 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-7">{children}</main>
      </div>

      {/* Cloche flottante, en bas à droite au-dessus du contenu (toutes tailles d'écran). */}
      {live?.notifications && <NotificationBell key={live.notifications.unread} data={live.notifications} />}

      {/* Barre d'onglets (< 1024 px) */}
      <nav
        aria-label={t("mobileNav.label")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-white/85 lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
          <TabLink href="/admin" current={section === "dashboard"} icon="grid" label={t("mobileNav.dashboard")} />
          <TabLink href="/admin/demandes" current={section === "leads"} icon="mail" label={t("mobileNav.leads")} badge={newCount || undefined} />
          <li className="flex items-center justify-center">
            <Link href={live ? "/admin/demandes/nouvelle" : "/admin/demandes?nouvelle=1"} className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-ink">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-gold shadow-sm">
                <Icon name="plus" size={20} strokeWidth={2.4} />
              </span>
              {t("mobileNav.new")}
            </Link>
          </li>
          <li className="flex">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted"
            >
              <Icon name="menu" size={20} />
              {t("mobileNav.more")}
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && <MoreSheet live={live} onClose={() => setMoreOpen(false)} />}
    </div>
  );
}

function SideLink({ href, current, icon, badge, children }: { href: string; current: boolean; icon: IconName; badge?: number; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={clsx("flex min-h-11 items-center justify-between gap-2 rounded-xl px-3.5", current ? "bg-night-2 text-white" : "hover:bg-night-2 hover:text-white")}
    >
      <span className="flex items-center gap-2.5">
        <Icon name={icon} size={17} />
        {children}
      </span>
      {badge !== undefined && <span className="rounded-full bg-brand-red px-2 py-0.5 text-xs text-white tabular-nums">{badge}</span>}
    </Link>
  );
}

function TabLink({ href, current, icon, label, badge }: { href: string; current: boolean; icon: IconName; label: string; badge?: number }) {
  return (
    <li className="flex">
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className={clsx("relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold", current ? "text-night" : "text-muted")}
      >
        <span className="relative">
          <Icon name={icon} size={20} />
          {badge !== undefined && (
            <span className="absolute -top-1.5 -right-2.5 flex min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] text-white tabular-nums">{badge}</span>
          )}
        </span>
        {label}
        {current && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-night" />}
      </Link>
    </li>
  );
}

function AccountFooter({ live }: { live?: LiveAccount }) {
  const t = useTranslations("admin");
  const name = live?.name ?? t("agentName");
  const initials = name
    .split(/s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="mt-auto flex flex-col gap-1">
      <div className="mb-2 flex items-center gap-3 rounded-xl bg-night-2 p-3">
        <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-brand-gold text-sm font-bold text-ink">
          {initials}
        </span>
        <span className="flex min-w-0 flex-col text-[13px]">
          <strong className="truncate text-white">{name}</strong>
          <span className="truncate text-on-dark-muted">{live ? t(`live.roles.${live.role}`) : t("agentRole")}</span>
        </span>
      </div>
      <Link href="/" className="flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-medium text-on-dark hover:bg-night-2 hover:text-white">
        <Icon name="arrowLeft" size={16} /> {t("viewSite")}
      </Link>
      {live ? (
        <>
          <Link href="/admin/parametres" className="flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-medium text-on-dark hover:bg-night-2 hover:text-white">
            <Icon name="sliders" size={16} /> {t("nav.settings")}
          </Link>
          <form action={logout} className="mt-1">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark"
            >
              <Icon name="arrowLeft" size={16} /> {t("live.logout")}
            </button>
          </form>
        </>
      ) : (
        <button type="button" onClick={() => resetDemo()} className="flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-left text-sm font-medium text-on-dark hover:bg-night-2 hover:text-white">
          <Icon name="refresh" size={16} /> {t("reset")}
        </button>
      )}
    </div>
  );
}

/** Panneau « Plus » (mobile) : monte du bas, rendu dans <body>, Échap et clic sur le voile pour fermer, focus géré. */
function MoreSheet({ live, onClose }: { live?: LiveAccount; onClose: () => void }) {
  const t = useTranslations("admin");
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.querySelector<HTMLElement>("button, a")?.focus();
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" aria-hidden="true" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink/50" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={t("mobileNav.moreTitle")}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col gap-5 overflow-y-auto rounded-t-3xl bg-night px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-on-dark"
      >
        <span aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-night-muted" />
        <div className="flex items-center justify-between">
          <strong className="text-white">{t("mobileNav.moreTitle")}</strong>
          <button type="button" onClick={onClose} aria-label={t("closeMenu")} className="flex size-10 items-center justify-center rounded-full bg-night-2 text-white">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {live && (
            <Link href="/admin/vols" className="flex min-h-11 items-center gap-2.5 text-[15px] font-semibold text-white">
              <Icon name="plane" size={17} /> {t("nav.flights")}
            </Link>
          )}
          {live && (
            <Link href="/admin/paiements" className="flex min-h-11 items-center gap-2.5 text-[15px] font-semibold text-white">
              <Icon name="briefcase" size={17} /> {t("nav.payments")}
            </Link>
          )}
          {toolsFor(live).map((x) => (
            <Link key={x.key} href={x.href} className="flex min-h-11 items-center gap-2.5 text-[15px] font-semibold text-white">
              <Icon name={x.icon} size={17} /> {t(`nav.${x.key}`)}
            </Link>
          ))}
          {soonFor(live).length > 0 && <span className="mt-2 mb-1 font-mono text-[10px] tracking-[0.14em] text-on-dark-muted">{(live ? t("live.soon") : t("soon")).toUpperCase()}</span>}
          {soonFor(live).map((k) => (
            <span key={k} aria-disabled="true" className="flex min-h-10 items-center text-[15px] text-on-dark-muted">
              {t(`nav.${k}`)}
            </span>
          ))}
        </div>
        <AccountFooter live={live} />
      </div>
    </div>,
    document.body,
  );
}
