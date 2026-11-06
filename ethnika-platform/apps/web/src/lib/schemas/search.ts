import { z } from "zod";
import { circuitDurations, circuitRegions, circuitThemes, type CircuitDuration, type CircuitRegion, type CircuitTheme } from "@/content/circuits";
import { extractIata } from "@/content/airports";

/*
 * Paramètres d'URL (searchParams) : entrées externes, donc validées.
 * Une valeur invalide est ignorée (retour à la valeur par défaut) plutôt que de provoquer une erreur.
 */

type RawParams = Record<string, string | string[] | undefined>;

/** Première valeur d'un paramètre, bornée en longueur. */
function first(params: RawParams, key: string, max = 80): string | undefined {
  const v = params[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s === undefined ? undefined : s.slice(0, max);
}

function pick<T extends string>(value: string | undefined, allowed: Record<T, unknown>): T | undefined {
  return value !== undefined && Object.hasOwn(allowed, value) ? (value as T) : undefined;
}

const isoDate = z.iso.date();

/* ---------------- Circuits ---------------- */

export const circuitSorts = { populaires: "Populaires", duree: "Durée" } as const;
export type CircuitSort = keyof typeof circuitSorts;

export type CircuitFilters = {
  theme?: CircuitTheme;
  region?: CircuitRegion;
  duree?: CircuitDuration;
  tri: CircuitSort;
  page: number;
};

export function parseCircuitFilters(params: RawParams): CircuitFilters {
  const page = Number.parseInt(first(params, "page", 4) ?? "1", 10);
  return {
    theme: pick(first(params, "theme"), circuitThemes),
    region: pick(first(params, "region"), circuitRegions),
    duree: pick(first(params, "duree"), circuitDurations),
    tri: pick(first(params, "tri"), circuitSorts) ?? "populaires",
    page: Number.isInteger(page) && page >= 1 && page <= 50 ? page : 1,
  };
}

/** Construit une URL /circuits en ne gardant que les filtres renseignés. */
export function circuitsHref(filters: Partial<CircuitFilters>) {
  const q = new URLSearchParams();
  if (filters.theme) q.set("theme", filters.theme);
  if (filters.region) q.set("region", filters.region);
  if (filters.duree) q.set("duree", filters.duree);
  if (filters.tri && filters.tri !== "populaires") q.set("tri", filters.tri);
  if (filters.page && filters.page > 1) q.set("page", String(filters.page));
  const s = q.toString();
  return s ? `/circuits?${s}` : "/circuits";
}

/* ---------------- Billetterie (préremplissage) ---------------- */

export const tripTypes = { rt: "Aller-retour", ow: "Aller simple", multi: "Multi-destinations" } as const;
export type TripType = keyof typeof tripTypes;

export const cabins = { eco: "Économique", business: "Affaires", first: "Première" } as const;
export type Cabin = keyof typeof cabins;

export type FlightPrefill = { trip?: TripType; from?: string; to?: string; depart?: string; back?: string; adults?: number; cabin?: Cabin };

export function parseFlightPrefill(params: RawParams): FlightPrefill {
  const date = (key: string) => {
    const v = first(params, key, 10);
    return v && isoDate.safeParse(v).success ? v : undefined;
  };
  const iata = (key: string) => {
    const v = first(params, key);
    return v ? extractIata(v) : undefined;
  };
  const adults = Number.parseInt(first(params, "adultes", 2) ?? "", 10);
  return {
    trip: pick(first(params, "trajet"), tripTypes),
    from: iata("de"),
    to: iata("vers"),
    depart: date("depart"),
    back: date("retour"),
    adults: adults >= 1 && adults <= 9 ? adults : undefined,
    cabin: pick(first(params, "classe"), cabins),
  };
}

/* ---------------- Services (devis groupe / pro) ---------------- */

export const proRequestTypes = { groupe: "Groupe", pelerinage: "Pèlerinage", entreprise: "Entreprise / Institution", ong: "ONG" } as const;
export type ProRequestType = keyof typeof proRequestTypes;

export type ProPrefill = { type?: ProRequestType; participants?: number; destination?: string; periode?: string };

export function parseProPrefill(params: RawParams): ProPrefill {
  const participants = Number.parseInt(first(params, "participants", 4) ?? "", 10);
  const text = (key: string) => first(params, key, 80)?.replace(/[<>]/g, "").trim() || undefined;
  return {
    type: pick(first(params, "type"), proRequestTypes),
    participants: participants >= 1 && participants <= 999 ? participants : undefined,
    destination: text("destination"),
    periode: text("periode"),
  };
}
