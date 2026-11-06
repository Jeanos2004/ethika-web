/**
 * Aéroports proposés en suggestion (datalist) dans les formulaires de billetterie.
 * Ce n'est pas une liste fermée : tout code IATA de 3 lettres est accepté (validation serveur ^[A-Z]{3}$).
 * Sélection orientée vers les départs de Conakry et les destinations de la diaspora.
 */
export const airports = [
  { code: "CKY", city: "Conakry", en: "Conakry" },
  { code: "CDG", city: "Paris", en: "Paris" },
  { code: "BRU", city: "Bruxelles", en: "Brussels" },
  { code: "CMN", city: "Casablanca", en: "Casablanca" },
  { code: "IST", city: "Istanbul", en: "Istanbul" },
  { code: "DSS", city: "Dakar", en: "Dakar" },
  { code: "ABJ", city: "Abidjan", en: "Abidjan" },
  { code: "BKO", city: "Bamako", en: "Bamako" },
  { code: "FNA", city: "Freetown", en: "Freetown" },
  { code: "ROB", city: "Monrovia", en: "Monrovia" },
  { code: "ACC", city: "Accra", en: "Accra" },
  { code: "LOS", city: "Lagos", en: "Lagos" },
  { code: "LFW", city: "Lomé", en: "Lomé" },
  { code: "ADD", city: "Addis-Abeba", en: "Addis Ababa" },
  { code: "JED", city: "Djeddah", en: "Jeddah" },
  { code: "MED", city: "Médine", en: "Medina" },
  { code: "DXB", city: "Dubaï", en: "Dubai" },
  { code: "MAD", city: "Madrid", en: "Madrid" },
  { code: "LIS", city: "Lisbonne", en: "Lisbon" },
  { code: "FCO", city: "Rome", en: "Rome" },
  { code: "FRA", city: "Francfort", en: "Frankfurt" },
  { code: "LHR", city: "Londres", en: "London" },
  { code: "JFK", city: "New York", en: "New York" },
  { code: "IAD", city: "Washington", en: "Washington" },
  { code: "YUL", city: "Montréal", en: "Montreal" },
  { code: "PEK", city: "Pékin", en: "Beijing" },
] as const;

export type Airport = (typeof airports)[number];

/** Nom de ville d'un aéroport dans une langue. */
export function airportCity(a: { city: string; en?: string }, locale = "fr") {
  return locale === "en" && a.en ? a.en : a.city;
}

export function airportLabel(a: { code: string; city: string; en?: string }, locale = "fr") {
  return `${airportCity(a, locale)} (${a.code})`;
}

/** Retrouve la ville d'un code IATA connu (sinon le code seul). */
export function cityOf(code: string, locale = "fr"): string {
  const a = airports.find((x) => x.code === code);
  return a ? airportCity(a, locale) : code;
}

/** « Paris (CDG) », « cdg », « CDG » ou « London » → « CDG ». Renvoie undefined si aucun code n'est reconnaissable. */
export function extractIata(input: string): string | undefined {
  const trimmed = input.trim();
  const inParens = /\(([A-Za-z]{3})\)\s*$/.exec(trimmed)?.[1];
  const code = (inParens ?? (/^[A-Za-z]{3}$/.test(trimmed) ? trimmed : undefined))?.toUpperCase();
  if (code) return code;
  const same = (a: string) => a.localeCompare(trimmed, "fr", { sensitivity: "base" }) === 0;
  return airports.find((a) => same(a.city) || same(a.en))?.code;
}
