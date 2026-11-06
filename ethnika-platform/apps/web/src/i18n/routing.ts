import { defineRouting } from "next-intl/routing";

/**
 * Langues du site. Le français est la langue par défaut, sans préfixe (/circuits) ;
 * l'anglais est servi sous /en (/en/circuits). Pas de redirection automatique selon le navigateur :
 * l'utilisateur choisit sa langue (sélecteur FR / EN), ce qui garde des URL stables pour le référencement.
 */
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  localeDetection: false,
  // hreflang émis par les métadonnées (src/content/pages.ts) à partir de site.url ; l'en-tête Link de next-intl
  // utiliserait l'hôte de la requête (adresse interne derrière un reverse proxy).
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];

/** Préfixe d'URL d'une langue ("" pour le français). */
export function localePrefix(locale: string): string {
  return locale === routing.defaultLocale ? "" : `/${locale}`;
}
