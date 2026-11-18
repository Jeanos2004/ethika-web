/** Photos de la galerie (Galerie.dc.html). Photos d'illustration Unsplash (3840 px), à remplacer par celles de l'agence. */

export const galleryFilters = {
  fouta: "Fouta Djallon",
  cote: "Basse Côte",
  loos: "Îles de Loos",
  vie: "Vie locale",
} as const;
export type GalleryFilter = keyof typeof galleryFilters;

export type GalleryPhoto = { src: string; alt: string; place: string; category: GalleryFilter; tall?: boolean };

export const gallery: GalleryPhoto[] = [
  { src: "/images/fouta-sommets.jpg", alt: "Sommets du plateau", place: "Fouta Djallon", category: "fouta", tall: true },
  { src: "/images/plage-turquoise.jpg", alt: "Eaux turquoise", place: "Basse Côte", category: "cote" },
  { src: "/images/loos-pirogue-couchant.jpg", alt: "Pirogue au couchant", place: "Îles de Loos", category: "loos" },
  { src: "/images/chutes-nguilo.jpg", alt: "Cascade", place: "Fouta Djallon", category: "fouta", tall: true },
  { src: "/images/bel-air-cocotiers.jpg", alt: "Cocotiers de Bel-Air", place: "Basse Côte", category: "cote" },
  { src: "/images/pecheurs-couchant.jpg", alt: "Pêcheurs au retour", place: "Basse Côte", category: "vie" },
  { src: "/images/loos-horizon.jpg", alt: "Horizon marin", place: "Îles de Loos", category: "loos", tall: true },
  { src: "/images/roches-koumba.jpg", alt: "Roches sculptées", place: "Fouta Djallon", category: "fouta" },
  { src: "/images/port-barques.jpg", alt: "Port et barques", place: "Conakry", category: "vie" },
  { src: "/images/dubreka-riviere-pirogue.jpg", alt: "Enfant en pirogue sur la rivière", place: "Dubréka", category: "cote" },
  { src: "/images/conakry-plage-ilot.jpg", alt: "Île vue du ciel", place: "Îles de Loos", category: "loos" },
  { src: "/images/promeneurs-reflet.jpg", alt: "Promeneurs au soleil couchant", place: "Conakry", category: "vie" },
  { src: "/images/fouta-plateau-couchant.jpg", alt: "Plateau au couchant", place: "Fouta Djallon", category: "fouta" },
  { src: "/images/collines-brume.jpg", alt: "Collines dans la brume", place: "Fouta Djallon", category: "fouta" },
];

/** Traduction anglaise (même ordre que `gallery`). */
const galleryEn: Pick<GalleryPhoto, "alt" | "place">[] = [
  { alt: "Plateau peaks", place: "Fouta Djallon" },
  { alt: "Turquoise water", place: "Lower Coast" },
  { alt: "Canoe at sunset", place: "Loos Islands" },
  { alt: "Waterfall", place: "Fouta Djallon" },
  { alt: "Bel-Air coconut palms", place: "Lower Coast" },
  { alt: "Fishermen coming back", place: "Lower Coast" },
  { alt: "Sea horizon", place: "Loos Islands" },
  { alt: "Sculpted rocks", place: "Fouta Djallon" },
  { alt: "Harbour and boats", place: "Conakry" },
  { alt: "Child in a canoe on the river", place: "Dubréka" },
  { alt: "Island seen from above", place: "Loos Islands" },
  { alt: "People walking at sunset", place: "Conakry" },
  { alt: "Plateau at sunset", place: "Fouta Djallon" },
  { alt: "Hills in the mist", place: "Fouta Djallon" },
];

const galleryFiltersEn: Record<GalleryFilter, string> = { fouta: "Fouta Djallon", cote: "Lower Coast", loos: "Loos Islands", vie: "Local life" };

export function getGallery(locale: string): GalleryPhoto[] {
  return locale === "en" ? gallery.map((p, i) => ({ ...p, ...galleryEn[i] })) : gallery;
}

export function getGalleryFilters(locale: string): Record<GalleryFilter, string> {
  return locale === "en" ? galleryFiltersEn : galleryFilters;
}
