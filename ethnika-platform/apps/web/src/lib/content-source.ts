import "server-only";
import { env } from "@/lib/env";
import { circuitLabels, getCircuits, type Circuit, type CircuitDuration, type CircuitRegion, type CircuitTheme, type Departure, type TagTone } from "@/content/circuits";
import { getOffers } from "@/content/offers";
import { blogCategories, categorySlugs, getHomePosts, getPosts, type BlogCategory, type Post } from "@/content/blog";
import { getGallery, type GalleryFilter, type GalleryPhoto } from "@/content/gallery";
import { site } from "@/lib/site";
import type { OfferCardData, OfferType } from "@/components/cards/OfferCard";
import { formatMoney } from "@/lib/admin/money";

/*
 * Contenus du site (circuits, offres, blog, galerie) : l'API est la source de vérité dès qu'elle est configurée et qu'elle publie
 * au moins un élément ; sinon le site garde ses contenus statiques (src/content). Un circuit publié par l'API reprend
 * la version statique du même slug comme base (galerie, informations pratiques), ce que l'API ne gère pas encore.
 * Appels mis en cache 60 s (ISR) et bornés à 5 s : une API indisponible ne casse jamais une page publique.
 */

const REVALIDATE_S = 60;

async function publicGet<T>(path: string): Promise<T | null> {
  if (!env.API_BASE_URL) return null;
  try {
    const res = await fetch(new URL(path, env.API_BASE_URL), {
      headers: { accept: "application/json", "x-internal-key": env.API_INTERNAL_KEY ?? "" },
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      next: { revalidate: REVALIDATE_S, tags: ["content"] },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[content] API indisponible pour ${path.split("?")[0]} : contenu statique utilisé (${e instanceof Error ? e.message : "erreur"})`);
    return null;
  }
}

type ApiPublicCircuit = {
  slug: string;
  theme: CircuitTheme;
  region: CircuitRegion;
  durationBucket: CircuitDuration;
  image: string;
  title: string;
  headline: string;
  summary: string;
  place: string;
  imageAlt: string;
  durationLabel: string;
  intro?: string;
  days?: { title: string; meta?: string; text: string; night?: string; meals?: string }[];
  included?: string[];
  excluded?: string[];
  departures?: Departure[];
};

const toneByTheme: Record<CircuitTheme, TagTone> = { nature: "red", plage: "night", culture: "red", diaspora: "gold" };

/** Circuit de l'API → modèle du site, sur la base statique du même slug quand elle existe. */
export function fromApiCircuit(a: ApiPublicCircuit, locale: string, position: number, base?: Circuit): Circuit {
  const labels = circuitLabels(locale);
  const detail = a.days
    ? {
        themeLabel: base?.detail?.themeLabel ?? labels.themes[a.theme],
        regionLabel: base?.detail?.regionLabel ?? labels.regions[a.region],
        facts: base?.detail?.facts ?? { duration: a.durationLabel, departure: "Conakry", level: "—", group: "—" },
        intro: a.intro ?? a.summary,
        gallery: base?.detail?.gallery ?? [],
        days: a.days.map((d) => ({ title: d.title, meta: d.meta ?? "", text: d.text, night: d.night ?? "—", meals: d.meals ?? "—" })),
        included: a.included ?? [],
        excluded: a.excluded ?? [],
        departures: a.departures ?? [],
        priceBasis: base?.detail?.priceBasis ?? "",
      }
    : base?.detail;
  return {
    slug: a.slug,
    theme: a.theme,
    region: a.region,
    durationBucket: a.durationBucket,
    rank: position + 1,
    tag: base?.tag ?? { label: labels.themes[a.theme], tone: toneByTheme[a.theme] },
    title: a.title,
    headline: a.headline,
    place: a.place,
    durationLabel: a.durationLabel,
    summary: a.summary,
    image: a.image,
    imageAlt: a.imageAlt,
    detail,
  };
}

/** Circuits publiés (liste, accueil, suggestions). */
export async function siteCircuits(locale: string): Promise<Circuit[]> {
  const fallback = getCircuits(locale);
  const fromApi = await publicGet<ApiPublicCircuit[]>(`/v1/public/circuits?locale=${locale === "en" ? "en" : "fr"}`);
  if (!fromApi?.length) return fallback;
  return fromApi.map((a, i) => fromApiCircuit(a, locale, i, fallback.find((c) => c.slug === a.slug)));
}

/** Fiche d'un circuit : version publiée par l'API, sinon statique (tant que l'API ne publie rien). */
export async function siteCircuit(slug: string, locale: string): Promise<Circuit | undefined> {
  const fallback = getCircuits(locale);
  const base = fallback.find((c) => c.slug === slug);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined;
  const lang = locale === "en" ? "en" : "fr";
  const [one, all] = await Promise.all([publicGet<ApiPublicCircuit>(`/v1/public/circuits/${slug}?locale=${lang}`), publicGet<ApiPublicCircuit[]>(`/v1/public/circuits?locale=${lang}`)]);
  if (one) return fromApiCircuit(one, locale, all?.findIndex((c) => c.slug === slug) ?? 0, base);
  // L'API publie des circuits mais pas celui-ci : il a été retiré ou dépublié par l'agence.
  if (all?.length) return undefined;
  return base;
}

type ApiPublicOffer = { slug: string; type: OfferType; href: string; image: string; price: string | null; currency: string | null; kicker: string; title: string; description: string; imageAlt: string };

/** Offres publiées et en cours de validité. */
export async function siteOffers(locale: string): Promise<OfferCardData[]> {
  const fromApi = await publicGet<ApiPublicOffer[]>(`/v1/public/offers?locale=${locale === "en" ? "en" : "fr"}`);
  if (!fromApi?.length) return getOffers(locale);
  return fromApi.map((o) => ({
    type: o.type,
    href: o.href,
    kicker: o.kicker,
    title: o.title,
    description: o.description,
    image: o.image,
    imageAlt: o.imageAlt,
    ...(o.price !== null && o.currency && { price: formatMoney(o.price, o.currency) }),
  }));
}

/* ---------- Blog ---------- */

type ApiPublicPost = {
  slug: string;
  category: string;
  image: string;
  featured: boolean;
  publishedAt: string | null;
  updatedAt: string | null;
  readingMinutes: number;
  title: string;
  lead: string;
  excerpt: string;
  tag: string;
  imageAlt: string;
  tags: string[];
  body?: string;
  bodyLocale?: "fr" | "en";
};

/** Article du site, avec son corps Markdown quand il vient du back-office (sinon fichier MDX). */
export type SitePost = Post & { body?: string; bodyLocale?: "fr" | "en"; featured?: boolean; publishedIso?: string; updatedIso?: string };

const categoryBySlug = Object.fromEntries(blogCategories.map((c) => [categorySlugs[c], c])) as Record<string, BlogCategory>;

function displayDate(iso: string | null, locale: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

function fromApiPost(a: ApiPublicPost, locale: string): SitePost {
  return {
    slug: a.slug,
    title: a.title,
    lead: a.lead,
    excerpt: a.excerpt,
    category: categoryBySlug[a.category] ?? "Actualités",
    tag: a.tag,
    readingMinutes: a.readingMinutes,
    image: a.image,
    imageAlt: a.imageAlt,
    published: displayDate(a.publishedAt, locale),
    updated: displayDate(a.updatedAt, locale),
    draft: false,
    tags: a.tags,
    featured: a.featured,
    ...(a.publishedAt && { publishedIso: a.publishedAt }),
    ...(a.updatedAt && { updatedIso: a.updatedAt }),
    ...(a.body !== undefined && { body: a.body, bodyLocale: a.bodyLocale ?? "fr" }),
  };
}

/** Articles publiés (liste, suggestions). */
export async function sitePosts(locale: string): Promise<SitePost[]> {
  const fromApi = await publicGet<ApiPublicPost[]>(`/v1/public/posts?locale=${locale === "en" ? "en" : "fr"}`);
  if (!fromApi?.length) return getPosts(locale);
  return fromApi.map((a) => fromApiPost(a, locale));
}

/** Un article : version du back-office (avec son corps), sinon statique tant que l'API ne publie rien. */
export async function sitePost(slug: string, locale: string): Promise<SitePost | undefined> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined;
  const lang = locale === "en" ? "en" : "fr";
  const [one, all] = await Promise.all([publicGet<ApiPublicPost>(`/v1/public/posts/${slug}?locale=${lang}`), publicGet<ApiPublicPost[]>(`/v1/public/posts?locale=${lang}`)]);
  if (one) return fromApiPost(one, locale);
  // L'API publie des articles mais pas celui-ci : retiré ou dépublié par l'agence.
  if (all?.length) return undefined;
  return getPosts(locale).find((p) => p.slug === slug);
}

/** Bloc « Préparez votre voyage » de l'accueil : articles mis en avant (sinon les plus récents), trois au plus. */
export async function siteHomePosts(locale: string): Promise<SitePost[]> {
  const fromApi = await publicGet<ApiPublicPost[]>(`/v1/public/posts?locale=${locale === "en" ? "en" : "fr"}`);
  if (!fromApi?.length) return getHomePosts(locale);
  const posts = fromApi.map((a) => fromApiPost(a, locale));
  return [...posts.filter((p) => p.featured), ...posts.filter((p) => !p.featured)].slice(0, 3);
}

/* ---------- Galerie ---------- */

type ApiPublicPhoto = { id: string; image: string; category: GalleryFilter; tall: boolean; alt: string; place: string };

/** Photos publiées de la galerie. */
export async function siteGallery(locale: string): Promise<GalleryPhoto[]> {
  const fromApi = await publicGet<ApiPublicPhoto[]>(`/v1/public/gallery?locale=${locale === "en" ? "en" : "fr"}`);
  if (!fromApi?.length) return getGallery(locale);
  return fromApi.map((p) => ({ src: p.image, alt: p.alt, place: p.place, category: p.category, tall: p.tall }));
}

export type AgencyPublic = {
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  licence: string;
  rccm: string;
  openingHours: string;
  hours: { weekdays: string; saturday: string; sunday: string };
  geo: { lat: number; lng: number };
  /** Faux tant que les coordonnées sont fictives (repère « position indicative » sur la carte). */
  verified: boolean;
};

/** Coordonnées de l'agence : Paramètres > Agence via l'API, sinon les valeurs de repli de site.ts. */
export async function getAgency(): Promise<AgencyPublic> {
  const api = await publicGet<AgencyPublic>("/v1/public/agency");
  if (api) return api;
  const h = site.contact.openingHours;
  return {
    address: site.contact.address,
    phone: site.contact.phone,
    whatsapp: site.contact.whatsapp,
    email: site.contact.email,
    licence: site.legal.licence,
    rccm: site.legal.rccm,
    openingHours: site.contact.hours,
    hours: { weekdays: h[0]?.hours ?? "", saturday: h[1]?.hours ?? "", sunday: h[2]?.hours ?? "" },
    geo: { lat: site.contact.geo.lat, lng: site.contact.geo.lng },
    verified: !site.contact.geo.approximate,
  };
}
