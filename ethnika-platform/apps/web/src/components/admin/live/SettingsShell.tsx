import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { AdminShell, type LiveAccount } from "@/components/admin/AdminShell";
import { Icon, type IconName } from "@/components/ui/Icon";

export type SettingsTab = "profile" | "security" | "sessions" | "agency" | "system";

const tabs: { key: SettingsTab; href: string; icon: IconName; adminOnly?: boolean }[] = [
  { key: "profile", href: "/admin/parametres", icon: "users" },
  { key: "security", href: "/admin/parametres/securite", icon: "shieldCheck" },
  { key: "sessions", href: "/admin/parametres/sessions", icon: "globe" },
  { key: "agency", href: "/admin/parametres/agence", icon: "homeHeart", adminOnly: true },
  { key: "system", href: "/admin/parametres/systeme", icon: "sliders", adminOnly: true },
];

/** Paramètres : sous-menu à gauche (≥ 1024 px) ou onglets défilants (mobile), contenu à droite. */
export async function SettingsShell({ tab, live, children }: { tab: SettingsTab; live: LiveAccount; children: ReactNode }) {
  const t = await getTranslations({ locale: "fr", namespace: "admin.live.settings" });
  const visible = tabs.filter((x) => !x.adminOnly || live.role === "admin");
  return (
    <AdminShell section="settings" title={t("title")} live={live}>
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.03em] text-night">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label={t("navLabel")} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
          <ul className="flex gap-1.5 lg:flex-col">
            {visible.map((x) => (
              <li key={x.key} className="shrink-0">
                <Link
                  href={x.href}
                  aria-current={tab === x.key ? "page" : undefined}
                  className={clsx(
                    "flex min-h-11 items-center gap-2.5 rounded-xl px-3.5 text-sm font-semibold whitespace-nowrap",
                    tab === x.key ? "bg-night text-white" : "text-ink hover:bg-white",
                  )}
                >
                  <Icon name={x.icon} size={16} />
                  {t(`tabs.${x.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-4">{children}</div>
      </div>
    </AdminShell>
  );
}

/** Carte de paramètres : titre, description, contenu. */
export function SettingsCard({ title, hint, children, action }: { title: string; hint?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-xl flex-col gap-1">
          <h2 className="text-base font-bold text-night">{title}</h2>
          {hint && <p className="text-sm leading-relaxed text-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Ligne libellé / valeur des fiches de paramètres. */
export function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-line py-3 text-sm first:border-0 first:pt-0 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-night">{children}</dd>
    </div>
  );
}
