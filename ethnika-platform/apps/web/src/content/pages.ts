import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { localePrefix, routing, type Locale } from "@/i18n/routing";
import { site } from "@/lib/site";

/**
 * Registre des pages : route publique ↔ maquette de référence ↔ structure.
 * Les textes (titre SEO, description, accroche, titre de bannière, alt de l'image) sont dans
 * messages/{fr,en}.json, espace « meta.<clé> ».
 * `status: "todo"` = la route existe mais la page reste à intégrer depuis la maquette.
 */
type PageStructure = {
  path: string;
  design: string; // fichier dans design/maquettes/
  image?: string; // bannière (public/images)
  headerVariant: "transparent" | "solid";
  status: "done" | "todo";
};

export type PageEntry = PageStructure & { title: string; description: string; kicker: string; heading: string; imageAlt?: string };

export const pages = {
  home: { path: "/", design: "Home2.dc.html", image: "/images/fouta-sommets.jpg", headerVariant: "transparent", status: "done" },
  guinee: { path: "/decouvrir-la-guinee", design: "Guinee.dc.html", image: "/images/cote-verte-aerien.jpg", headerVariant: "transparent", status: "done" },
  fouta: { path: "/decouvrir-la-guinee/mali-fouta-djallon", design: "Destination.dc.html", image: "/images/collines-brume.jpg", headerVariant: "transparent", status: "done" },
  loos: { path: "/decouvrir-la-guinee/iles-de-loos", design: "Loos.dc.html", image: "/images/loos-pirogue-couchant.jpg", headerVariant: "transparent", status: "done" },
  basseCote: { path: "/decouvrir-la-guinee/basse-cote", design: "BasseCote.dc.html", image: "/images/bel-air-cocotiers.jpg", headerVariant: "transparent", status: "done" },
  infos: { path: "/decouvrir-la-guinee/infos-pratiques", design: "InfosPratiques.dc.html", image: "/images/voyageur-panorama.jpg", headerVariant: "transparent", status: "done" },
  circuits: { path: "/circuits", design: "Circuits.dc.html", image: "/images/vallee-route.jpg", headerVariant: "transparent", status: "done" },
  billetterie: { path: "/billetterie", design: "Billetterie.dc.html", image: "/images/avion-ciel.jpg", headerVariant: "transparent", status: "done" },
  services: { path: "/services", design: "Services.dc.html", image: "/images/avion-ciel.jpg", headerVariant: "transparent", status: "done" },
  offres: { path: "/offres", design: "Offres.dc.html", image: "/images/plage-turquoise.jpg", headerVariant: "transparent", status: "done" },
  blog: { path: "/blog", design: "Blog.dc.html", headerVariant: "solid", status: "done" },
  galerie: { path: "/galerie", design: "Galerie.dc.html", headerVariant: "solid", status: "done" },
  apropos: { path: "/a-propos", design: "APropos.dc.html", image: "/images/voyageur-panorama.jpg", headerVariant: "transparent", status: "done" },
  contact: { path: "/contact", design: "Contact.dc.html", image: "/images/port-barques.jpg", headerVariant: "transparent", status: "done" },
  faq: { path: "/faq", design: "FAQ.dc.html", headerVariant: "solid", status: "done" },
  mentions: { path: "/mentions-legales", design: "Legal.dc.html", headerVariant: "solid", status: "done" },
  cgv: { path: "/cgv", design: "Legal.dc.html", headerVariant: "solid", status: "done" },
  confidentialite: { path: "/confidentialite", design: "Legal.dc.html", headerVariant: "solid", status: "done" },
  cookies: { path: "/cookies", design: "Legal.dc.html", headerVariant: "solid", status: "done" },
  merci: { path: "/merci", design: "Merci.dc.html", headerVariant: "solid", status: "done" },
} satisfies Record<string, PageStructure>;

export type PageKey = keyof typeof pages;

/** Entrée de page avec ses textes dans la langue demandée. */
export async function getPage(key: PageKey, locale: Locale): Promise<PageEntry> {
  const t = await getTranslations({ locale, namespace: `meta.${key}` });
  const p: PageStructure = pages[key];
  return {
    ...p,
    title: t("title"),
    description: t("description"),
    kicker: t("kicker"),
    heading: t("heading"),
    imageAlt: t.has("imageAlt") ? t("imageAlt") : undefined,
  };
}

/** URL absolue-relative d'un chemin dans une langue (FR sans préfixe). */
export function localizedPath(path: string, locale: Locale) {
  const prefix = localePrefix(locale);
  return path === "/" ? prefix || "/" : `${prefix}${path}`;
}

/** Variantes hreflang d'un chemin (+ x-default sur la version française). */
export function languageAlternates(path: string) {
  return {
    ...Object.fromEntries(routing.locales.map((l) => [l, localizedPath(path, l)])),
    "x-default": localizedPath(path, routing.defaultLocale),
  };
}

export async function pageMetadata(key: PageKey, locale: Locale): Promise<Metadata> {
  const p = await getPage(key, locale);
  const url = localizedPath(p.path, locale);
  return {
    title: key === "home" ? { absolute: `${site.name} · ${p.title}` } : p.title,
    description: p.description,
    alternates: { canonical: url, languages: languageAlternates(p.path) },
    openGraph: {
      title: p.title,
      description: p.description,
      url,
    }, // image : fichier opengraph-image.tsx de la route (src/lib/og.tsx)
    robots: key === "merci" ? { index: false, follow: false } : undefined,
  };
}

/** Raccourci pour les pages : `export const generateMetadata = metadataFor("faq");` */
export function metadataFor(key: PageKey) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    return pageMetadata(key, locale as Locale);
  };
}
