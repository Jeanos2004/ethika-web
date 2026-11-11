/** Configuration éditoriale publique. Les valeurs entre crochets sont à fournir par le client. */

export const site = {
  name: "ETHNIKA",
  tagline: "Tourisme & Voyages",
  /** URL publique : NEXT_PUBLIC_SITE_URL, sinon le domaine de production Vercel (variable système exposée), sinon local. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  description:
    "Agence de tourisme et de voyage à Conakry : billetterie aérienne, circuits et séjours en Guinée, groupes, pèlerinages et voyages d'affaires.",
  contact: {
    phone: "+224 [NUMÉRO]",
    email: "contact@ethnikatour.com",
    /** Adresses par service (maquette Contact.dc.html). */
    emails: ["contact@ethnikatour.com", "billetterie@ethnikatour.com", "reservation@ethnikatour.com"],
    /** Horaires détaillés (à fournir par le client). */
    openingHours: [
      { days: "Lundi – Vendredi", hours: "[HH:MM – HH:MM]" },
      { days: "Samedi", hours: "[HH:MM – HH:MM]" },
      { days: "Dimanche", hours: "Fermé · WhatsApp" },
    ],
    hours: "Lun – Sam · [HORAIRES]",
    address: "[Quartier], Conakry",
    /**
     * Position de l'agence sur la carte de la page Contact. Valeur provisoire : centre de Kaloum (Conakry).
     * Remplacer par les coordonnées exactes (clic droit sur Google Maps → coordonnées) et passer `approximate` à false.
     */
    geo: { lat: 9.5092, lng: -13.7122, approximate: true },
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  },
  legal: {
    licence: "[À COMPLÉTER]",
    rccm: "[À COMPLÉTER]",
  },
  social: {
    facebook: "#",
    instagram: "#",
    linkedin: "#",
    youtube: "#",
    instagramHandle: "@ethnikatour [à confirmer]",
  },
  /** Identifiant YouTube de la vidéo de présentation (vide = placeholder « à produire »). */
  videoId: "",
} as const;

/** Entrée de navigation : le libellé est traduit (messages, espace « nav »). */
export type NavItem = { href: string; key: string };

/** Navigation principale (validée dans la maquette). Le logo ramène à l'accueil. */
export const mainNav: NavItem[] = [
  { href: "/decouvrir-la-guinee", key: "guinee" },
  { href: "/circuits", key: "circuits" },
  { href: "/billetterie", key: "billetterie" },
  { href: "/services", key: "services" },
  { href: "/offres", key: "offres" },
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
];

/** Liens de la barre utilitaire (haut de page). */
export const utilityNav: NavItem[] = [
  { href: "/a-propos", key: "apropos" },
  { href: "/faq", key: "faq" },
];

export const footerNav: { key: string; items: NavItem[] }[] = [
  {
    key: "colDiscover",
    items: [
      { href: "/decouvrir-la-guinee/mali-fouta-djallon", key: "fouta" },
      { href: "/decouvrir-la-guinee/iles-de-loos", key: "loos" },
      { href: "/decouvrir-la-guinee/basse-cote", key: "basseCote" },
      { href: "/decouvrir-la-guinee/infos-pratiques", key: "infos" },
      { href: "/galerie", key: "galerie" },
    ],
  },
  {
    key: "colServices",
    items: [
      { href: "/billetterie", key: "flights" },
      { href: "/circuits", key: "tours" },
      { href: "/services", key: "groups" },
      { href: "/services#professionnels", key: "companies" },
      { href: "/offres", key: "deals" },
    ],
  },
  {
    key: "colAgency",
    items: [
      { href: "/a-propos", key: "apropos" },
      { href: "/blog", key: "blogNews" },
      { href: "/faq", key: "faq" },
      { href: "/contact", key: "contact" },
    ],
  },
];

export const legalNav: NavItem[] = [
  { href: "/mentions-legales", key: "mentions" },
  { href: "/cgv", key: "cgv" },
  { href: "/confidentialite", key: "confidentialite" },
  { href: "/cookies", key: "cookies" },
];

export function whatsappLink(message?: string): string {
  if (!site.contact.whatsapp) return "/contact";
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${site.contact.whatsapp}${text}`;
}

/**
 * Lien « tel: » si le numéro est renseigné (chiffres uniquement), sinon la page Contact.
 * Tant que le placeholder « [NUMÉRO] » est en place, aucun lien d'appel cassé n'est produit.
 */
export function phoneLink(): string {
  const digits = site.contact.phone.replace(/[^\d+]/g, "");
  return /^\+?\d{8,15}$/.test(digits) ? `tel:${digits}` : "/contact";
}
