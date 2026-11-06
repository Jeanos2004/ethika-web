import { localize } from "@/lib/localize";
import { circuitLabelsEn, circuitsEn } from "@/content/circuits.en";

/**
 * Circuits & séjours — données des maquettes Circuits.dc.html et CircuitDetail.dc.html.
 * Les valeurs entre crochets sont à fournir par le client : ne jamais inventer de prix, de durée ou de date.
 * Phase 2 : ces données viendront de l'API NestJS.
 */

export const circuitThemes = {
  nature: "Nature",
  plage: "Plages & îles",
  culture: "Culture",
  diaspora: "Diaspora",
} as const;
export type CircuitTheme = keyof typeof circuitThemes;

export const circuitRegions = {
  "moyenne-guinee": "Moyenne Guinée",
  "basse-cote": "Basse Côte",
  conakry: "Conakry",
  guinee: "Toute la Guinée",
} as const;
export type CircuitRegion = keyof typeof circuitRegions;

/** Tranche de durée utilisée par le filtre (indépendante du libellé affiché, qui peut rester un placeholder). */
export const circuitDurations = {
  "1": "1 jour",
  "2-4": "2 à 4 jours",
  "5+": "5 jours et plus",
} as const;
export type CircuitDuration = keyof typeof circuitDurations;

export type TagTone = "red" | "night" | "green" | "gold";

export type CircuitDay = { title: string; meta: string; text: string; night: string; meals: string };
export type Departure = { dates: string; status: "available" | "last" | "request"; price: string };

export type Circuit = {
  slug: string;
  theme: CircuitTheme;
  region: CircuitRegion;
  durationBucket: CircuitDuration;
  /** Rang « populaires » (1 = en tête). */
  rank: number;
  tag: { label: string; tone: TagTone };
  /** Titre court des cartes. */
  title: string;
  /** Titre de la fiche (h1). */
  headline: string;
  place: string;
  durationLabel: string;
  summary: string;
  image: string;
  imageAlt: string;
  detail?: {
    themeLabel: string;
    regionLabel: string;
    facts: { duration: string; departure: string; level: string; group: string };
    intro: string;
    gallery: { src: string; alt: string }[];
    days: CircuitDay[];
    included: string[];
    excluded: string[];
    departures: Departure[];
    priceBasis: string;
  };
};

export const circuits: Circuit[] = [
  {
    slug: "fouta-djallon-cascades-sommets",
    theme: "nature",
    region: "moyenne-guinee",
    durationBucket: "2-4",
    rank: 1,
    tag: { label: "Nature", tone: "red" },
    title: "Le toit du Fouta Djallon",
    headline: "Fouta Djallon, cascades & sommets",
    place: "Mali, Moyenne Guinée",
    durationLabel: "[X] jours",
    summary: "Mont Loura, chutes de Nguilo, roches de Koumba et villages peuls, en 4×4 avec guide.",
    image: "/images/fouta-sommets.jpg",
    imageAlt: "Sommets rocheux dans la brume",
    detail: {
      themeLabel: "Nature & randonnée",
      regionLabel: "Moyenne Guinée",
      facts: { duration: "4 jours · 3 nuits", departure: "Conakry", level: "Modéré", group: "2 à 12 pers." },
      intro:
        "Quatre jours sur les hauts plateaux, entre le Mont Loura et ses 1 515 m, les chutes de Nguilo à 5 km de Mali, les roches de Koumba et la culture peule. Un circuit accessible, encadré par un guide local, avec des nuits au calme et la fraîcheur des plateaux.",
      gallery: [
        { src: "/images/chutes-nguilo.jpg", alt: "Cascade" },
        { src: "/images/roches-koumba.jpg", alt: "Formations rocheuses" },
        { src: "/images/fouta-plateau-couchant.jpg", alt: "Plateau au coucher du soleil" },
        { src: "/images/vallee-route.jpg", alt: "Route dans une vallée" },
      ],
      days: [
        {
          title: "Conakry → Mali",
          meta: "Route · environ [X] h",
          text: "Départ matinal de Conakry, traversée de la Basse Guinée puis montée vers les hauts plateaux. Pauses panoramiques en chemin, installation à Mali en fin de journée.",
          night: "Mali",
          meals: "Déjeuner, dîner",
        },
        {
          title: "Mont Loura",
          meta: "Randonnée · 1 515 m",
          text: "Ascension du Mont Loura, point culminant de la région, avec la célèbre falaise de la « Dame de Mali ». Panorama jusqu'aux frontières voisines par temps clair.",
          night: "Mali",
          meals: "Pension complète",
        },
        {
          title: "Chutes de Nguilo & Koumba",
          meta: "Nature · 5 km de Mali",
          text: "Matinée aux chutes de Nguilo, baignade si le débit le permet. Après-midi aux roches de Koumba et rencontre avec un village peul.",
          night: "Mali",
          meals: "Pension complète",
        },
        {
          title: "Retour à Conakry",
          meta: "Route",
          text: "Dernier lever de soleil sur le plateau, marché local puis retour vers Conakry. Arrivée en soirée.",
          night: "—",
          meals: "Petit-déjeuner, déjeuner",
        },
      ],
      included: ["Transport en 4x4 avec chauffeur", "Guide local francophone", "3 nuits en hébergement sélectionné", "Pension complète", "Entrées des sites et taxes locales"],
      excluded: ["Vols internationaux (voir Billetterie)", "Assurance voyage", "Boissons et dépenses personnelles", "Pourboires"],
      departures: [
        { dates: "[DATE] → [DATE]", status: "available", price: "[PRIX] GNF" },
        { dates: "[DATE] → [DATE]", status: "last", price: "[PRIX] GNF" },
        { dates: "Date libre", status: "request", price: "Sur devis" },
      ],
      priceBasis: "par personne, base 4 personnes",
    },
  },
  {
    slug: "escapade-iles-de-loos",
    theme: "plage",
    region: "conakry",
    durationBucket: "2-4",
    rank: 2,
    tag: { label: "Îles", tone: "night" },
    title: "Escapade aux îles de Loos",
    headline: "Escapade aux îles de Loos",
    place: "Départ du port de Boulbinet",
    durationLabel: "[X] jours",
    summary: "Kassa la fêtarde, Tamara la sauvage, Roume la tranquille. Sable rouge au couchant.",
    image: "/images/port-barques.jpg",
    imageAlt: "Barques dans un port",
  },
  {
    slug: "bel-air-sobane-kitikata",
    theme: "plage",
    region: "basse-cote",
    durationBucket: "2-4",
    rank: 3,
    tag: { label: "Balnéaire", tone: "green" },
    title: "Bel-Air, Sobane & Kitikata",
    headline: "Bel-Air, Sobane & Kitikata",
    place: "Boffa, Basse Côte",
    durationLabel: "[X] jours",
    summary: "7 km de plage bordée de cocotiers, bungalows simples et percussions au bord de l'océan.",
    image: "/images/cocotiers-couchant.jpg",
    imageAlt: "Cocotiers au coucher du soleil",
  },
  {
    slug: "boffa-memoire-de-la-cote",
    theme: "culture",
    region: "basse-cote",
    durationBucket: "2-4",
    rank: 4,
    tag: { label: "Patrimoine", tone: "red" },
    title: "Boffa, mémoire de la côte",
    headline: "Boffa, mémoire de la côte",
    place: "Boffa, estuaire du Rio Pongo",
    durationLabel: "[X] jours",
    summary: "Vieux port sur le fleuve Fatala, l'église et les lieux de mémoire de la traite négrière.",
    image: "/images/pecheurs-couchant.jpg",
    imageAlt: "Bateaux de pêche au couchant",
  },
  {
    slug: "dubreka-pirogues-cascades",
    theme: "nature",
    region: "basse-cote",
    durationBucket: "1",
    rank: 5,
    tag: { label: "Nature", tone: "red" },
    title: "Dubréka, pirogues & cascades",
    headline: "Dubréka, pirogues & cascades",
    place: "Dubréka, nord de Conakry",
    durationLabel: "[X] jours",
    summary: "Accès en pirogue, piscines naturelles, village de Bondabon et chutes du mont Dixinn.",
    image: "/images/dubreka-riviere-pirogue.jpg",
    imageAlt: "Rivière et pirogue dans la verdure",
  },
  {
    slug: "plages-de-conakry",
    theme: "plage",
    region: "conakry",
    durationBucket: "1",
    rank: 6,
    tag: { label: "1 jour", tone: "red" },
    title: "Les plages de Conakry",
    headline: "Les plages de Conakry",
    place: "Conakry",
    durationLabel: "1 jour",
    summary: "Lambanyi, Rogbané, Camayenne, Kipé, Sogbané et Milo, sans quitter la capitale.",
    image: "/images/conakry-plage-ilot.jpg",
    imageAlt: "Vague et îlot au large",
  },
  {
    slug: "retour-au-pays",
    theme: "diaspora",
    region: "guinee",
    durationBucket: "5+",
    rank: 7,
    tag: { label: "Sur mesure", tone: "red" },
    title: "Retour au pays",
    headline: "Retour au pays",
    place: "Toute la Guinée",
    durationLabel: "Sur mesure",
    summary: "Billets, transferts et découvertes pour la diaspora et les familles, à votre rythme.",
    image: "/images/promeneurs-reflet.jpg",
    imageAlt: "Promeneurs au coucher du soleil",
  },
];

export const circuitSlugs = circuits.map((c) => c.slug) as [string, ...string[]];

export function getCircuit(slug: string): Circuit | undefined {
  return circuits.find((c) => c.slug === slug);
}

/** Circuits mis en avant sur l'accueil (maquette Home2 : Fouta, Loos, Bel-Air). */
export const featuredCircuits = circuits.filter((c) => c.rank <= 3);

/* ---------------- Langues ---------------- */


type Lang = "fr" | "en";

/** Libellés des filtres (thème, région, durée) dans une langue. */
export function circuitLabels(locale: string) {
  return locale === "en" ? circuitLabelsEn : { themes: circuitThemes, regions: circuitRegions, durations: circuitDurations };
}

/** Circuits traduits (le français est la base ; l'anglais est fusionné par slug). */
export function getCircuits(locale: string): Circuit[] {
  return (locale as Lang) === "en" ? circuits.map((c) => localize(c, circuitsEn[c.slug])) : circuits;
}

export function getLocalizedCircuit(slug: string, locale: string): Circuit | undefined {
  return getCircuits(locale).find((c) => c.slug === slug);
}
