import type { IconName } from "@/components/ui/Icon";
import type { Slide } from "@/components/home/HeroSlider";
import { localize } from "@/lib/localize";
import { homeEn } from "@/content/home.en";

/** Contenus de l'accueil (Home2.dc.html, HomeMobile.dc.html). */

export const heroSlides: Slide[] = [
  {
    image: "/images/cocotiers-couchant.jpg",
    alt: "Cocotiers en silhouette au coucher du soleil sur la côte",
    kicker: "BASSE CÔTE · PLAGES & ÎLES",
    titleA: "La Guinée au cœur,",
    titleB: "le monde en vue.",
    sub: "Billets d'avion vers toutes les destinations et circuits du Fouta Djallon aux îles de Loos, avec une équipe basée à Conakry.",
  },
  {
    image: "/images/collines-brume.jpg",
    alt: "Collines verdoyantes dans la brume",
    kicker: "FOUTA DJALLON · HAUTS PLATEAUX",
    titleA: "Respirez l'air",
    titleB: "des hauts plateaux.",
    sub: "Mont Loura, chutes de Nguilo, villages peuls : des circuits avec véhicule 4×4 et guide local.",
  },
  {
    image: "/images/avion-ciel.jpg",
    alt: "Avion de ligne dans un ciel bleu",
    kicker: "BILLETTERIE · TOUTES DESTINATIONS",
    titleA: "De Conakry",
    titleB: "vers le monde entier.",
    sub: "Aller simple, aller-retour ou multi-destinations : un conseiller compare les tarifs et vous répond par WhatsApp.",
  },
];

export const trust: { icon: IconName; title: string; text: string; tint: string; chip: string }[] = [
  { icon: "pin", title: "Équipe à Conakry", text: "Un interlocuteur local", tint: "bg-red-50 text-red-700", chip: "Équipe à Conakry" },
  { icon: "whatsapp", title: "Réponse par WhatsApp", text: "Devis et suivi du dossier", tint: "bg-green-50 text-green-700", chip: "Réponse WhatsApp" },
  { icon: "globe", title: "Toutes destinations", text: "Afrique, Europe, Amériques, Asie…", tint: "bg-line text-night", chip: "Toutes destinations" },
  { icon: "mountain", title: "Guides locaux", text: "Circuits accompagnés", tint: "bg-gold-50 text-gold-700", chip: "Guides locaux" },
];

export type MosaicItem = { href: string; image: string; alt: string; eyebrow: string; title: string };

export const mosaicFeature = {
  href: "/decouvrir-la-guinee/mali-fouta-djallon",
  image: "/images/collines-brume.jpg",
  alt: "Collines verdoyantes dans la brume matinale",
  badge: "Coup de cœur",
  eyebrow: "Le toit de la Guinée",
  title: "Mali & Fouta Djallon",
  sub: "Mont Loura · Chutes de Nguilo · Villages peuls",
};

export const mosaicGrid: MosaicItem[] = [
  { href: "/decouvrir-la-guinee/iles-de-loos", image: "/images/barque-calme.jpg", alt: "Barque de pêche sur une eau calme", eyebrow: "Au large de Conakry", title: "Îles de Loos" },
  { href: "/decouvrir-la-guinee/basse-cote#bel-air", image: "/images/plage-turquoise.jpg", alt: "Plage de sable et eau turquoise", eyebrow: "7 km de sable fin", title: "Bel-Air, Boffa" },
  { href: "/decouvrir-la-guinee/mali-fouta-djallon#nguilo", image: "/images/chutes-nguilo.jpg", alt: "Grande cascade dans la forêt", eyebrow: "Une demi-journée", title: "Chutes de Nguilo" },
  { href: "/decouvrir-la-guinee/basse-cote#conakry", image: "/images/ville-bord-de-mer.jpg", alt: "Ville au bord d'une mer turquoise", eyebrow: "Escapade d'un jour", title: "Conakry & ses plages" },
];

export const mosaicRow: MosaicItem[] = [
  { href: "/decouvrir-la-guinee/basse-cote#dubreka", image: "/images/dubreka-riviere-pirogue.jpg", alt: "Enfant dans une pirogue sur une rivière", eyebrow: "Pirogues & mangrove", title: "Dubréka" },
  { href: "/decouvrir-la-guinee/basse-cote#sobane", image: "/images/plage-sable-couchant.jpg", alt: "Plage de sable au coucher du soleil", eyebrow: "Nuits à la belle étoile", title: "Sobane" },
  { href: "/decouvrir-la-guinee/basse-cote#boffa", image: "/images/pecheurs-couchant.jpg", alt: "Bateaux de pêche au soleil couchant", eyebrow: "Ville de pêcheurs", title: "Boffa & le Rio Pongo" },
];

export const experiencePoints = ["Culture & patrimoine", "Nature & randonnée", "Plages & îles", "Tourisme de la diaspora"];

export const travelTypes: { icon: IconName; title: string; text: string; href: string }[] = [
  { icon: "mountainSun", title: "Nature", text: "Fouta, cascades", href: "/circuits?theme=nature" },
  { icon: "beach", title: "Balnéaire", text: "Plages & îles", href: "/circuits?theme=plage" },
  { icon: "landmark", title: "Culture", text: "Patrimoine & mémoire", href: "/circuits?theme=culture" },
  { icon: "homeHeart", title: "Diaspora", text: "Retour au pays", href: "/circuits?theme=diaspora" },
  { icon: "briefcase", title: "Affaires", text: "Missions & séminaires", href: "/services#professionnels" },
  { icon: "crescent", title: "Pèlerinages", text: "Groupes accompagnés", href: "/services#pelerinages" },
];

/** Routes mises en avant dans la bande billetterie. Prix : placeholders, jamais inventés. */
export const promoRoutes = [
  { to: "CDG", city: "Paris" },
  { to: "DSS", city: "Dakar" },
  { to: "IST", city: "Istanbul" },
  { to: "JED", city: "Djeddah" },
];

export const facts: { icon: IconName; value: string; label: string; tint: string }[] = [
  { icon: "mountain", value: "1 515 m", label: "Mont Loura", tint: "bg-brand-red text-white" },
  { icon: "waves", value: "7 km", label: "Plage de Bel-Air", tint: "bg-night text-white" },
  { icon: "pin", value: "47", label: "Sites à Mali", tint: "bg-brand-green text-white" },
  { icon: "sun", value: "Nov → Avr", label: "Saison sèche", tint: "bg-brand-gold text-ink" },
];

export const whyUs: { icon: IconName; title: string; text: string; tint: string }[] = [
  { icon: "pin", title: "Proximité", text: "Un interlocuteur local, par téléphone, WhatsApp, e-mail ou en agence.", tint: "bg-red-50 text-brand-red" },
  { icon: "bolt", title: "Rapidité", text: "Réservation et émission en temps réel.", tint: "bg-line text-night" },
  { icon: "sliders", title: "Sur mesure", text: "Selon votre budget, votre calendrier et vos contraintes.", tint: "bg-gold-50 text-gold-700" },
  { icon: "shieldCheck", title: "Accompagnement", text: "Un suivi jusqu'à votre retour, même en cas d'imprévu.", tint: "bg-green-50 text-green-700" },
];

/** Témoignages : à recueillir avec l'accord écrit des clients. Aucun avis inventé. */
export const testimonials = [
  {
    quote: "[Témoignage client à recueillir et à publier avec son accord écrit : voyage d'affaires, retour au pays ou circuit au Fouta.]",
    name: "[Nom du client]",
    origin: "[Entreprise ou ville]",
  },
];

export const instagramImages = [
  { src: "/images/cocotiers-couchant.jpg", alt: "Cocotiers au couchant" },
  { src: "/images/collines-brume.jpg", alt: "Collines dans la brume" },
  { src: "/images/port-barques.jpg", alt: "Barques dans un port" },
  { src: "/images/plage-turquoise.jpg", alt: "Plage turquoise" },
  { src: "/images/pecheurs-couchant.jpg", alt: "Bateaux de pêche au couchant" },
  { src: "/images/chutes-nguilo.jpg", alt: "Cascade" },
];

/** Contenus de l'accueil dans une langue (couche anglaise : content/home.en.ts). */
export function getHomeContent(locale: string) {
  const base = { heroSlides, trust, mosaicFeature, mosaicGrid, mosaicRow, experiencePoints, travelTypes, promoRoutes, facts, whyUs, testimonials, instagramImages };
  if (locale !== "en") return base;
  return {
    heroSlides: localize(heroSlides, homeEn.heroSlides),
    trust: localize(trust, homeEn.trust),
    mosaicFeature: localize(mosaicFeature, homeEn.mosaicFeature),
    mosaicGrid: localize(mosaicGrid, homeEn.mosaicGrid),
    mosaicRow: localize(mosaicRow, homeEn.mosaicRow),
    experiencePoints: localize(experiencePoints, homeEn.experiencePoints),
    travelTypes: localize(travelTypes, homeEn.travelTypes),
    promoRoutes: localize(promoRoutes, homeEn.promoRoutes),
    facts: localize(facts, homeEn.facts),
    whyUs: localize(whyUs, homeEn.whyUs),
    testimonials: localize(testimonials, homeEn.testimonials),
    instagramImages: localize(instagramImages, homeEn.instagramImages),
  };
}
