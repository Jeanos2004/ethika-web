/**
 * Motif « carte entièrement cliquable » : le lien du titre s'étend sur toute la carte
 * (un seul lien par carte au clavier et pour les lecteurs d'écran).
 * L'anneau de focus est porté par la carte, pas par le titre.
 */
export const stretchedLink = "after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none";

export const cardFocus = "has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-3 has-[a:focus-visible]:outline-brand-gold";
