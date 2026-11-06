"use client";

import { useLocale, useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Sélecteur FR / EN en commutateur segmenté, toujours visible dans la barre principale de l'en-tête.
 * Mène à la même page dans l'autre langue. La langue courante est marquée (aria-current) ;
 * chaque lien annonce la langue cible (hreflang, lang) et son nom accessible contient le texte visible.
 * `tone` : « dark » sur un en-tête transparent posé sur une photo, « light » sur fond clair.
 */
export function LanguageSwitcher({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");
  return (
    <nav
      aria-label={t("language")}
      className={clsx("flex shrink-0 rounded-full border p-0.5 font-mono text-[13px] font-medium", tone === "dark" ? "border-white/45 bg-ink/20" : "border-line-strong bg-white", className)}
    >
      {routing.locales.map((l) => {
        const current = l === locale;
        return (
          <Link
            key={l}
            href={pathname}
            locale={l}
            hrefLang={l}
            lang={l}
            aria-current={current ? "true" : undefined}
            aria-label={t("switchTo", { code: l.toUpperCase(), lang: t(l) })}
            className={clsx(
              "inline-flex h-9 min-w-10 items-center justify-center rounded-full px-2.5 uppercase transition-colors",
              current ? (tone === "dark" ? "bg-white text-night" : "bg-night text-white") : tone === "dark" ? "text-white hover:bg-white/15" : "text-night hover:bg-sand",
            )}
          >
            {l}
          </Link>
        );
      })}
    </nav>
  );
}
