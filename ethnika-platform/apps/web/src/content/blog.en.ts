import type { Post } from "@/content/blog";

/**
 * Traduction anglaise des métadonnées du blog (titres, chapôs, extraits).
 * Le corps des articles (MDX) n'existe qu'en français : la version anglaise l'indique au lecteur.
 */
export const postsEn: Record<string, Partial<Pick<Post, "title" | "lead" | "excerpt" | "tag" | "imageAlt" | "tags">>> = {
  "iles-de-loos-quelle-ile-choisir": { title: "Kassa, Tamara or Roume: which Loos island should you choose?", lead: "Party, wild nature or total calm: our guide to choosing the island that suits you, 30 minutes from Conakry.", excerpt: "Party, wild nature or total calm: choose the island that suits you.", tag: "Islands · Guide", imageAlt: "Sea horizon seen from an island" },
  "quand-partir-en-guinee": { title: "When to go to Guinea? Coast and Fouta, season by season", lead: "Dry season, rainy season, harmattan: the right time depending on your destination.", excerpt: "Dry season, rainy season: the right time depending on your destination.", tag: "Tips · Seasons", imageAlt: "Winding road in a green valley" },
  "fievre-jaune-paludisme-precautions": { title: "Yellow fever, malaria: precautions before you leave", lead: "Mandatory vaccines, malaria prevention and travel kit.", excerpt: "Mandatory vaccines, malaria prevention and travel kit.", tag: "Health · Before you go", imageAlt: "Plane in the sky" },
  "cascades-du-fouta-djallon": { title: "The most beautiful waterfalls of the Fouta Djallon", lead: "Nguilo, Kambadaga, Ditinn: where and when to see them at their best.", excerpt: "Nguilo, Kambadaga, Ditinn: where and when to see them at their best.", tag: "Fouta · Nature", imageAlt: "Waterfall" },
  "preparer-premier-voyage-guinee": { title: "Preparing your first trip to Guinea", lead: "Vaccines, visa, budget, luggage: the complete checklist.", excerpt: "Vaccines, visa, budget, luggage: the complete checklist.", tag: "Tips · Preparation", imageAlt: "Traveller" },
  "bagages-conditions-tarifaires": { title: "Baggage: what fare conditions really say", lead: "Allowance, excess, cabin baggage: we explain.", excerpt: "Allowance, excess, cabin baggage: we explain.", tag: "Flights · Baggage", imageAlt: "Plane in the sky" },
  "journee-pecheurs-basse-cote": { title: "A day with the fishermen of the Lower Coast", lead: "Leaving at dawn, back for the market: life to the rhythm of the tides.", excerpt: "Leaving at dawn, back for the market: life to the rhythm of the tides.", tag: "Culture · Lower Coast", imageAlt: "Fishermen at sunset" },
  "bel-air-guide-week-end": { title: "Bel-Air: the guide to a successful weekend", lead: "Access, accommodation, best season and activities.", excerpt: "Access, accommodation, best season and activities.", tag: "Beaches · Guide", imageAlt: "Beach with coconut palms" },
  "ethnika-ouvre-ses-portes": { title: "ETHNIKA opens its doors in Conakry", lead: "A new agency to discover Guinea differently.", excerpt: "A new agency to discover Guinea differently.", tag: "News · Agency", imageAlt: "Seaside city" },
};
