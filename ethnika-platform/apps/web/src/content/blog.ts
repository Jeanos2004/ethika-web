import { z } from "zod";
import { bodiesEn, postsEn } from "@/content/blog.en";

/**
 * Index du blog (maquettes Blog.dc.html, Article.dc.html et bloc « Préparez votre voyage » de l'accueil).
 * Le corps de chaque article est un fichier MDX : src/content/blog/<slug>.mdx (traduction : <slug>.en.mdx).
 * Les métadonnées sont validées par Zod au chargement : une entrée invalide fait échouer le build.
 */

export const blogCategories = ["Destinations", "Conseils", "Culture", "Billetterie", "Actualités"] as const;
export type BlogCategory = (typeof blogCategories)[number];

/** Catégorie dans l'URL (?categorie=) : liste blanche, sans accent. */
export const categorySlugs: Record<BlogCategory, string> = {
  Destinations: "destinations",
  Conseils: "conseils",
  Culture: "culture",
  Billetterie: "billetterie",
  Actualités: "actualites",
};

const postSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(5).max(140),
  /** Chapô (sous le titre de l'article). */
  lead: z.string().max(300),
  excerpt: z.string().max(200),
  category: z.enum(blogCategories),
  /** Étiquette courte affichée sur l'accueil (ex. « Îles · Guide »). */
  tag: z.string().max(40),
  readingMinutes: z.number().int().min(1).max(60),
  image: z.string().startsWith("/images/"),
  imageAlt: z.string(),
  /** Date ISO ou placeholder « [Date] » tant que le client n'a pas validé la publication. */
  published: z.string(),
  updated: z.string(),
  /** Article dont le texte est encore à rédiger par le client. */
  draft: z.boolean().default(false),
  tags: z.array(z.string().max(30)).max(8).default([]),
});

export type Post = z.infer<typeof postSchema>;

const raw: z.input<typeof postSchema>[] = [
  {
    slug: "iles-de-loos-quelle-ile-choisir",
    title: "Kassa, Tamara ou Roume : quelle île de Loos choisir ?",
    lead: "Fête, nature sauvage ou calme absolu : notre guide pour choisir l'île qui vous ressemble, à 30 minutes de Conakry.",
    excerpt: "Fête, nature sauvage ou calme absolu : choisir l'île qui vous ressemble.",
    category: "Destinations",
    tag: "Îles · Guide",
    readingMinutes: 6,
    image: "/images/loos-horizon.jpg",
    imageAlt: "Horizon marin vu depuis une île",
    published: "[Date]",
    updated: "[Date]",
    tags: ["Loos", "Conakry", "Plages", "Week-end"],
  },
  {
    slug: "quand-partir-en-guinee",
    title: "Quand partir en Guinée ? Côte et Fouta, saison par saison",
    lead: "Saison sèche, saison des pluies, harmattan : le bon moment selon votre destination.",
    excerpt: "Saison sèche, saison des pluies : le bon moment selon votre destination.",
    category: "Conseils",
    tag: "Conseils · Saisons",
    readingMinutes: 5,
    image: "/images/vallee-route.jpg",
    imageAlt: "Route sinueuse dans une vallée verdoyante",
    published: "[Date]",
    updated: "[Date]",
    draft: true,
  },
  {
    slug: "fievre-jaune-paludisme-precautions",
    title: "Fièvre jaune, paludisme : les précautions avant le départ",
    lead: "Vaccins obligatoires, prévention du paludisme et trousse de voyage.",
    excerpt: "Vaccins obligatoires, prévention du paludisme et trousse de voyage.",
    category: "Conseils",
    tag: "Santé · Avant de partir",
    readingMinutes: 4,
    image: "/images/avion-ciel.jpg",
    imageAlt: "Avion dans le ciel",
    published: "[Date]",
    updated: "[Date]",
    draft: true,
  },
  {
    slug: "cascades-du-fouta-djallon",
    title: "Les plus belles cascades du Fouta Djallon",
    lead: "Nguilo, Kambadaga, Ditinn : où et quand les voir en pleine forme.",
    excerpt: "Nguilo, Kambadaga, Ditinn : où et quand les voir en pleine forme.",
    category: "Destinations",
    tag: "Fouta · Nature",
    readingMinutes: 5,
    image: "/images/chutes-nguilo.jpg",
    imageAlt: "Cascade",
    published: "[Date]",
    updated: "[Date]",
    draft: true,
  },
  {
    slug: "preparer-premier-voyage-guinee",
    title: "Préparer son premier voyage en Guinée",
    lead: "Vaccins, visa, budget, valise : la check-list complète.",
    excerpt: "Vaccins, visa, budget, valise : la check-list complète.",
    category: "Conseils",
    tag: "Conseils · Préparation",
    readingMinutes: 4,
    image: "/images/voyageuse.jpg",
    imageAlt: "Voyageuse",
    published: "[Date]",
    updated: "[Date]",
    draft: true,
  },
  {
    slug: "bagages-conditions-tarifaires",
    title: "Bagages : ce que disent vraiment les conditions tarifaires",
    lead: "Franchise, excédent, bagage cabine : on vous explique.",
    excerpt: "Franchise, excédent, bagage cabine : on vous explique.",
    category: "Billetterie",
    tag: "Billetterie · Bagages",
    readingMinutes: 3,
    image: "/images/avion-ciel.jpg",
    imageAlt: "Avion dans le ciel",
    published: "[Date]",
    updated: "[Date]",
    draft: true,
  },
  {
    slug: "journee-pecheurs-basse-cote",
    title: "Une journée avec les pêcheurs de la Basse Côte",
    lead: "Départ à l'aube, retour au marché : la vie au rythme des marées.",
    excerpt: "Départ à l'aube, retour au marché : la vie au rythme des marées.",
    category: "Culture",
    tag: "Culture · Basse Côte",
    readingMinutes: 6,
    image: "/images/pecheurs-couchant.jpg",
    imageAlt: "Pêcheurs au couchant",
    published: "[Date]",
    updated: "[Date]",
    draft: true,
  },
  {
    slug: "bel-air-guide-week-end",
    title: "Bel-Air : le guide pour un week-end réussi",
    lead: "Accès, hébergements, meilleure saison et activités.",
    excerpt: "Accès, hébergements, meilleure saison et activités.",
    category: "Destinations",
    tag: "Plages · Guide",
    readingMinutes: 4,
    image: "/images/bel-air-cocotiers.jpg",
    imageAlt: "Plage de cocotiers",
    published: "[Date]",
    updated: "[Date]",
    draft: true,
  },
  {
    slug: "ethnika-ouvre-ses-portes",
    title: "ETHNIKA ouvre ses portes à Conakry",
    lead: "Une nouvelle agence pour faire découvrir la Guinée autrement.",
    excerpt: "Une nouvelle agence pour faire découvrir la Guinée autrement.",
    category: "Actualités",
    tag: "Actualités · Agence",
    readingMinutes: 2,
    image: "/images/ville-bord-de-mer.jpg",
    imageAlt: "Ville en bord de mer",
    published: "[Date]",
    updated: "[Date]",
    draft: true,
  },
];

export const posts: Post[] = raw.map((p) => postSchema.parse(p));

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Articles du bloc « Préparez votre voyage » de l'accueil. */
export const homePosts = ["iles-de-loos-quelle-ile-choisir", "quand-partir-en-guinee", "fievre-jaune-paludisme-precautions"]
  .map(getPost)
  .filter((p): p is Post => p !== undefined);

/** Articles dans une langue (métadonnées traduites ; le corps MDX reste en français). */
export function getPosts(locale: string): Post[] {
  return locale === "en" ? posts.map((p) => ({ ...p, ...postsEn[p.slug] })) : posts;
}

/** Langue du corps MDX d'un article statique : anglais quand sa traduction existe, sinon français. */
export function staticBodyLocale(slug: string, locale: string): "fr" | "en" {
  return locale === "en" && bodiesEn.has(slug) ? "en" : "fr";
}

/** Fichier MDX du corps (slug en liste blanche à vérifier avant). */
export function bodyFile(slug: string, locale: string): string {
  return staticBodyLocale(slug, locale) === "en" ? `${slug}.en.mdx` : `${slug}.mdx`;
}

export function getLocalizedPost(slug: string, locale: string): Post | undefined {
  return getPosts(locale).find((p) => p.slug === slug);
}

export function getHomePosts(locale: string): Post[] {
  const all = getPosts(locale);
  return homePosts.map((h) => all.find((p) => p.slug === h.slug)).filter((p): p is Post => p !== undefined);
}
