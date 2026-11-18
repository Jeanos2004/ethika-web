import type { DeepPartial } from "@/lib/localize";
import type * as Home from "@/content/home";

/** Traduction anglaise des contenus de l'accueil (fusionnée sur la base française). */
export const homeEn: { [K in keyof typeof Home]?: DeepPartial<(typeof Home)[K]> } = {
  heroSlides: [
    { alt: "Coconut palms silhouetted at sunset on the coast", kicker: "LOWER COAST · BEACHES & ISLANDS", titleA: "Guinea at heart,", titleB: "the world in sight.", sub: "Plane tickets to every destination and tours from the Fouta Djallon to the Loos Islands, with a team based in Conakry." },
    { alt: "Green hills in the mist", kicker: "FOUTA DJALLON · HIGHLANDS", titleA: "Breathe the air", titleB: "of the highlands.", sub: "Mount Loura, Nguilo Falls, Fula villages: tours with a 4×4 vehicle and a local guide." },
    { alt: "Airliner in a blue sky", kicker: "FLIGHTS · ALL DESTINATIONS", titleA: "From Conakry", titleB: "to the whole world.", sub: "One way, round trip or multi-city: an adviser compares fares and replies on WhatsApp." },
  ],
  trust: [
    { title: "Team in Conakry", text: "A local contact person", chip: "Team in Conakry" },
    { title: "Replies on WhatsApp", text: "Quotes and file follow-up", chip: "WhatsApp replies" },
    { title: "All destinations", text: "Africa, Europe, Americas, Asia…", chip: "All destinations" },
    { title: "Local guides", text: "Guided tours", chip: "Local guides" },
  ],
  mosaicFeature: { alt: "Green hills in the morning mist", badge: "Our favourite", eyebrow: "The roof of Guinea", title: "Mali & Fouta Djallon", sub: "Mount Loura · Nguilo Falls · Fula villages" },
  mosaicGrid: [
    { alt: "Fishing boat on calm water", eyebrow: "Off Conakry", title: "Loos Islands" },
    { alt: "Sandy beach and turquoise water", eyebrow: "7 km of fine sand", title: "Bel-Air, Boffa" },
    { alt: "Large waterfall in the forest", eyebrow: "A half-day trip", title: "Nguilo Falls" },
    { alt: "Town by a turquoise sea", eyebrow: "A day trip", title: "Conakry & its beaches" },
  ],
  mosaicRow: [
    { alt: "Child in a canoe on a river", eyebrow: "Canoes & mangroves", title: "Dubréka" },
    { alt: "Sandy beach at sunset", eyebrow: "Nights under the stars", title: "Sobane" },
    { alt: "Fishing boats at sunset", eyebrow: "A fishing town", title: "Boffa & the Rio Pongo" },
  ],
  experiencePoints: ["Culture & heritage", "Nature & hiking", "Beaches & islands", "Diaspora tourism"],
  travelTypes: [
    { title: "Nature", text: "Fouta, waterfalls" },
    { title: "Beach", text: "Beaches & islands" },
    { title: "Culture", text: "Heritage & memory" },
    { title: "Diaspora", text: "Back home" },
    { title: "Business", text: "Missions & seminars" },
    { title: "Pilgrimages", text: "Guided groups" },
  ],
  promoRoutes: [{ city: "Paris" }, { city: "Dakar" }, { city: "Istanbul" }, { city: "Jeddah" }],
  facts: [
    { value: "1,515 m", label: "Mount Loura" },
    { value: "7 km", label: "Bel-Air beach" },
    { value: "47", label: "Sites in Mali" },
    { value: "Nov → Apr", label: "Dry season" },
  ],
  whyUs: [
    { title: "Proximity", text: "A local contact person, by phone, WhatsApp, email or at the agency." },
    { title: "Speed", text: "Real-time booking and ticketing." },
    { title: "Tailor-made", text: "Based on your budget, your schedule and your constraints." },
    { title: "Support", text: "Follow-up until you are back, even when the unexpected happens." },
  ],
  testimonials: [{ quote: "[Customer testimonial to be collected and published with their written consent: business trip, return home or Fouta tour.]", name: "[Customer name]", origin: "[Company or city]" }],
  instagramImages: [{ alt: "Coconut palms at sunset" }, { alt: "Hills in the mist" }, { alt: "Boats in a harbour" }, { alt: "Turquoise beach" }, { alt: "Fishing boats at sunset" }, { alt: "Waterfall" }],
};
