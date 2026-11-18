import { z } from "zod";

/*
 * Contenus gérés depuis le back-office (offres, circuits). Mêmes valeurs que le site
 * (apps/web/src/content/circuits.ts, offers.ts). Textes FR obligatoires, EN facultatifs (repli sur le FR).
 */

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slugInvalid").min(3).max(80);
/** Image : chemin du site (/images/…) ou URL HTTPS (CDN). Jamais javascript:, data: ni http en clair. */
const imageUrl = z.string().max(300).refine((v) => /^\/[A-Za-z0-9/_.-]+$/.test(v) || /^https:\/\/[^\s"'<>]+$/.test(v), "imageInvalid");
/** Lien interne du site uniquement (pas de redirection ouverte vers un domaine tiers). */
const internalHref = z.string().max(300).regex(/^\/(?!\/)[A-Za-z0-9/_.?=&#%-]*$/, "hrefInvalid");
const currency = z.enum(["GNF", "XOF", "EUR", "USD"]);
const money = z.number().int().min(0).max(1_000_000_000_000);
const text = (max: number) => z.string().trim().min(1).max(max);

/* ---------- Offres ---------- */

const offerTexts = z.strictObject({ kicker: text(80), title: text(120), description: text(300), imageAlt: text(160) });

export const offerInput = z.strictObject({
  slug,
  type: z.enum(["vol", "pack", "last"]),
  i18n: z.strictObject({ fr: offerTexts, en: offerTexts.partial().optional() }),
  imageUrl,
  href: internalHref,
  priceAmount: money.nullable().optional(),
  currency: currency.nullable().optional(),
  validUntil: z.iso.date().nullable().optional(),
  published: z.boolean().default(false),
  position: z.number().int().min(0).max(10_000).default(0),
});
export const offerUpdate = offerInput.partial();
export type OfferInput = z.infer<typeof offerInput>;

/* ---------- Circuits ---------- */

const day = z.strictObject({ title: text(120), meta: text(80).optional(), text: text(1500), night: text(80).optional(), meals: text(80).optional() });
const circuitTexts = z.strictObject({
  title: text(120),
  headline: text(160),
  summary: text(400),
  place: text(120),
  imageAlt: text(160),
  durationLabel: text(40),
  intro: text(2000).optional(),
  days: z.array(day).max(20).default([]),
  included: z.array(text(160)).max(25).default([]),
  excluded: z.array(text(160)).max(25).default([]),
});

export const circuitInput = z.strictObject({
  slug,
  theme: z.enum(["nature", "plage", "culture", "diaspora"]),
  region: z.enum(["moyenne-guinee", "basse-cote", "conakry", "guinee"]),
  durationDays: z.number().int().min(1).max(30),
  imageUrl,
  priceFrom: money.nullable().optional(),
  currency: currency.nullable().optional(),
  i18n: z.strictObject({ fr: circuitTexts, en: circuitTexts.partial().optional() }),
  departures: z.array(z.strictObject({ dates: text(60), status: z.enum(["available", "last", "request"]), price: text(40) })).max(20).default([]),
  published: z.boolean().default(false),
  position: z.number().int().min(0).max(10_000).default(0),
});
export const circuitUpdate = circuitInput.partial();
export type CircuitInput = z.infer<typeof circuitInput>;

export const localeQuery = z.strictObject({ locale: z.enum(["fr", "en"]).default("fr") });

/** Tranche de durée du filtre du site (« 1 », « 2-4 », « 5+ »). */
export function durationBucket(days: number): "1" | "2-4" | "5+" {
  return days <= 1 ? "1" : days <= 4 ? "2-4" : "5+";
}

/* ---------- Blog ---------- */

export const blogCategories = ["destinations", "conseils", "culture", "billetterie", "actualites"] as const;

const postTexts = z.strictObject({
  title: text(140),
  /** Chapô sous le titre de l'article. */
  lead: text(300),
  /** Résumé des cartes (liste, accueil). */
  excerpt: text(200),
  /** Étiquette courte de l'accueil (ex. « Îles · Guide »). */
  tag: text(40),
  imageAlt: text(160),
  /** Corps en Markdown (sous-ensemble rendu par le site, jamais de HTML brut). */
  body: text(40_000),
  tags: z.array(text(30)).max(8).default([]),
});

export const postInput = z.strictObject({
  slug,
  category: z.enum(blogCategories),
  imageUrl,
  i18n: z.strictObject({ fr: postTexts, en: postTexts.partial().optional() }),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  publishedAt: z.iso.date().nullable().optional(),
  position: z.number().int().min(0).max(10_000).default(0),
});
export const postUpdate = postInput.partial();
export type PostInput = z.infer<typeof postInput>;

/* ---------- Galerie ---------- */

export const galleryCategories = ["fouta", "cote", "loos", "vie"] as const;

const photoTexts = z.strictObject({ alt: text(160), place: text(80) });

export const photoInput = z.strictObject({
  imageUrl,
  category: z.enum(galleryCategories),
  tall: z.boolean().default(false),
  i18n: z.strictObject({ fr: photoTexts, en: photoTexts.partial().optional() }),
  published: z.boolean().default(true),
  position: z.number().int().min(0).max(10_000).default(0),
});
export const photoUpdate = photoInput.partial();
export type PhotoInput = z.infer<typeof photoInput>;

/** Temps de lecture estimé (≈ 200 mots par minute), au moins une minute. */
export function readingMinutes(body: string): number {
  const words = body.replace(/[#>*_|`[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.min(60, Math.max(1, Math.round(words / 200)));
}
