import type { DeepPartial } from "@/lib/localize";
import type { Circuit } from "@/content/circuits";

/** Traduction anglaise des circuits (couche fusionnée sur la base française, par slug). */
export const circuitsEn: Record<string, DeepPartial<Circuit>> = {
  "fouta-djallon-cascades-sommets": {
    tag: { label: "Nature" },
    title: "The roof of the Fouta Djallon",
    headline: "Fouta Djallon, waterfalls & peaks",
    place: "Mali, Middle Guinea",
    durationLabel: "[X] days",
    summary: "Mount Loura, Nguilo Falls, Koumba rocks and Fula villages, by 4×4 with a guide.",
    imageAlt: "Rocky peaks in the mist",
    detail: {
      themeLabel: "Nature & hiking",
      regionLabel: "Middle Guinea",
      facts: { duration: "4 days · 3 nights", departure: "Conakry", level: "Moderate", group: "2 to 12 people" },
      intro:
        "Four days on the highlands, between Mount Loura and its 1,515 m, the Nguilo Falls 5 km from Mali, the Koumba rocks and Fula culture. An accessible tour led by a local guide, with quiet nights and the cool air of the plateaus.",
      gallery: [{ alt: "Waterfall" }, { alt: "Rock formations" }, { alt: "Plateau at sunset" }, { alt: "Road through a valley" }],
      days: [
        { title: "Conakry → Mali", meta: "Road · about [X] h", text: "Early departure from Conakry, across Lower Guinea and up to the highlands. Scenic stops along the way, check-in at Mali at the end of the day.", night: "Mali", meals: "Lunch, dinner" },
        { title: "Mount Loura", meta: "Hike · 1,515 m", text: "Climb of Mount Loura, the highest point of the region, with the famous “Lady of Mali” cliff. On clear days the view reaches the neighbouring borders.", night: "Mali", meals: "Full board" },
        { title: "Nguilo Falls & Koumba", meta: "Nature · 5 km from Mali", text: "Morning at the Nguilo Falls, swimming if the flow allows. Afternoon at the Koumba rocks and meeting with a Fula village.", night: "Mali", meals: "Full board" },
        { title: "Back to Conakry", meta: "Road", text: "Last sunrise over the plateau, local market, then drive back to Conakry. Arrival in the evening.", night: "—", meals: "Breakfast, lunch" },
      ],
      included: ["4x4 transport with driver", "French-speaking local guide", "3 nights in selected accommodation", "Full board", "Site entrance fees and local taxes"],
      excluded: ["International flights (see Flights)", "Travel insurance", "Drinks and personal expenses", "Tips"],
      departures: [{ dates: "[DATE] → [DATE]", price: "[PRICE] GNF" }, { dates: "[DATE] → [DATE]", price: "[PRICE] GNF" }, { dates: "Flexible date", price: "On request" }],
      priceBasis: "per person, based on 4 people",
    },
  },
  "escapade-iles-de-loos": {
    tag: { label: "Islands" },
    title: "Loos Islands getaway",
    headline: "Loos Islands getaway",
    place: "Departure from Boulbinet harbour",
    durationLabel: "[X] days",
    summary: "Lively Kassa, wild Tamara, peaceful Roume. Red sand at sunset.",
    imageAlt: "Boats in a harbour",
  },
  "bel-air-sobane-kitikata": {
    tag: { label: "Beach" },
    place: "Boffa, Lower Coast",
    durationLabel: "[X] days",
    summary: "7 km of beach lined with coconut palms, simple bungalows and drumming by the ocean.",
    imageAlt: "Coconut palms at sunset",
  },
  "boffa-memoire-de-la-cote": {
    tag: { label: "Heritage" },
    title: "Boffa, memory of the coast",
    headline: "Boffa, memory of the coast",
    place: "Boffa, Rio Pongo estuary",
    durationLabel: "[X] days",
    summary: "Old port on the Fatala river, the church and the memorial sites of the slave trade.",
    imageAlt: "Fishing boats at sunset",
  },
  "dubreka-pirogues-cascades": {
    tag: { label: "Nature" },
    title: "Dubréka, canoes & waterfalls",
    headline: "Dubréka, canoes & waterfalls",
    place: "Dubréka, north of Conakry",
    durationLabel: "[X] days",
    summary: "Access by canoe, natural pools, Bondabon village and the Mount Dixinn falls.",
    imageAlt: "River and canoe in the greenery",
  },
  "plages-de-conakry": {
    tag: { label: "1 day" },
    title: "The beaches of Conakry",
    headline: "The beaches of Conakry",
    durationLabel: "1 day",
    summary: "Lambanyi, Rogbané, Camayenne, Kipé, Sogbané and Milo, without leaving the capital.",
    imageAlt: "Wave and islet offshore",
  },
  "retour-au-pays": {
    tag: { label: "Tailor-made" },
    title: "Back home",
    headline: "Back home",
    place: "All of Guinea",
    durationLabel: "Tailor-made",
    summary: "Flights, transfers and discoveries for the diaspora and families, at your own pace.",
    imageAlt: "People walking at sunset",
  },
};

export const circuitLabelsEn = {
  themes: { nature: "Nature", plage: "Beaches & islands", culture: "Culture", diaspora: "Diaspora" },
  regions: { "moyenne-guinee": "Middle Guinea", "basse-cote": "Lower Coast", conakry: "Conakry", guinee: "All of Guinea" },
  durations: { "1": "1 day", "2-4": "2 to 4 days", "5+": "5 days or more" },
} as const;
