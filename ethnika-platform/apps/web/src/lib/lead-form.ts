import { leadFormFields, proLeadType } from "@/lib/schemas/lead";
import { proRequestTypes } from "@/lib/schemas/search";
import { extractIata } from "@/content/airports";

/*
 * Lecture d'un formulaire de demande (site public et saisie par un agent dans le back-office) :
 * liste blanche de champs, avant la validation stricte par leadSchema.
 */

/** Vols supplémentaires d'un multi-destinations : champs répétés legFrom / legTo / legDate (4 au plus lus). */
function readLegs(formData: FormData) {
  const text = (k: string) => formData.getAll(k).slice(0, 5).map((v) => (typeof v === "string" ? v.trim() : ""));
  const [froms, tos, dates] = [text("legFrom"), text("legTo"), text("legDate")];
  return froms
    .map((from, i) => ({ from: extractIata(from) ?? from, to: extractIata(tos[i] ?? "") ?? tos[i] ?? "", date: dates[i] ?? "" }))
    .filter((leg) => leg.from || leg.to || leg.date);
}

/** Lit uniquement les champs connus ; une chaîne vide vaut « non renseigné ». */
export function readLeadForm(formData: FormData) {
  const raw: Record<string, unknown> = {};
  for (const key of leadFormFields) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") raw[key] = value;
  }
  raw.consent = formData.get("consent") === "on";
  // Billet : « Paris (CDG) » → « CDG » (la validation stricte reste celle du schéma).
  for (const key of ["from", "to"] as const) {
    if (typeof raw[key] === "string") raw[key] = extractIata(raw[key]) ?? raw[key];
  }
  if (raw.trip === "multi") raw.legs = readLegs(formData);
  // Demande professionnelle : le type enregistré découle de la catégorie choisie, pas d'un champ caché.
  if (typeof raw.request === "string" && Object.hasOwn(proRequestTypes, raw.request)) {
    raw.type = proLeadType(raw.request as keyof typeof proRequestTypes);
  }
  return raw;
}

