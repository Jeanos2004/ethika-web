"use client";

import { useLocale, useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Sélecteur FR / EN : mène à la même page dans l'autre langue.
 * La langue courante est marquée (aria-current) ; chaque lien annonce la langue cible (hreflang, lang).
 */
export function LanguageSwitcher({ className, tone = "dark" }: { className?: string; tone?: "dark" | "muted" }) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");
  return (
    <nav aria-label={t("language")} className={clsx("flex items-center gap-2 font-mono", className)}>
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
            className={clsx("inline-flex min-h-6 min-w-6 items-center justify-center uppercase hover:text-white", current ? "text-white" : tone === "dark" ? "text-on-dark-muted" : "text-on-dark-muted")}
          >
            {l}
          </Link>
        );
      })}
    </nav>
  );
}
