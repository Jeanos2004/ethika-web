import type { OfferCardData, OfferType } from "@/components/cards/OfferCard";

/** Offres & promotions (maquette Offres.dc.html). Prix et dates de validité : placeholders, à saisir par l'agence. */
export const offers: OfferCardData[] = [
  { type: "vol", href: "/billetterie?vers=CDG#demande", kicker: "Conakry → Paris", title: "Aller-retour Paris, saison basse", description: "Bagage en soute inclus, modification possible selon conditions.", image: "/images/avion-ciel.jpg", imageAlt: "Avion dans le ciel" },
  { type: "pack", href: "/circuits/fouta-djallon-cascades-sommets", kicker: "Fouta Djallon · 4 j", title: "Fouta Djallon tout compris", description: "4x4, guide, hébergement et pension complète.", image: "/images/fouta-sommets.jpg", imageAlt: "Sommets rocheux" },
  { type: "last", href: "/circuits/escapade-iles-de-loos", kicker: "Îles de Loos · 2 j", title: "Week-end à Loos ce samedi", description: "Quelques places restantes au départ de Boulbinet.", image: "/images/loos-pirogue-couchant.jpg", imageAlt: "Pirogue au couchant" },
  { type: "vol", href: "/billetterie?vers=DSS#demande", kicker: "Conakry → Dakar", title: "Dakar, aller-retour régional", description: "Idéal pour les voyages d'affaires dans la sous-région.", image: "/images/ville-bord-de-mer.jpg", imageAlt: "Ville en bord de mer" },
  { type: "pack", href: "/circuits/bel-air-sobane-kitikata", kicker: "Bel-Air · 3 j", title: "Bel-Air & Kitikata en famille", description: "Tarif enfant réduit, transferts inclus.", image: "/images/bel-air-cocotiers.jpg", imageAlt: "Plage de cocotiers" },
  { type: "last", href: "/circuits/dubreka-pirogues-cascades", kicker: "Dubréka · 1 j", title: "Journée nature à Dubréka", description: "Départ dimanche, déjeuner inclus.", image: "/images/dubreka-riviere-pirogue.jpg", imageAlt: "Rivière et pirogue" },
];

/** Traduction anglaise, dans le même ordre que `offers`. */
const offersEn: Pick<OfferCardData, "kicker" | "title" | "description" | "imageAlt">[] = [
  { kicker: "Conakry → Paris", title: "Paris round trip, low season", description: "Checked baggage included, changes possible depending on conditions.", imageAlt: "Plane in the sky" },
  { kicker: "Fouta Djallon · 4 d", title: "All-inclusive Fouta Djallon", description: "4x4, guide, accommodation and full board.", imageAlt: "Rocky peaks" },
  { kicker: "Loos Islands · 2 d", title: "Weekend in Loos this Saturday", description: "A few seats left, departing from Boulbinet.", imageAlt: "Canoe at sunset" },
  { kicker: "Conakry → Dakar", title: "Dakar, regional round trip", description: "Ideal for business trips within the sub-region.", imageAlt: "Seaside city" },
  { kicker: "Bel-Air · 3 d", title: "Bel-Air & Kitikata with the family", description: "Reduced child fare, transfers included.", imageAlt: "Beach with coconut palms" },
  { kicker: "Dubréka · 1 d", title: "Nature day in Dubréka", description: "Sunday departure, lunch included.", imageAlt: "River and canoe" },
];

export function getOffers(locale: string): OfferCardData[] {
  return locale === "en" ? offers.map((o, i) => ({ ...o, ...offersEn[i] })) : offers;
}

/** Filtres de la page Offres ; libellés traduits dans les messages (offres.filters). */
export const offerFilters: (OfferType | undefined)[] = [undefined, "vol", "pack", "last"];
