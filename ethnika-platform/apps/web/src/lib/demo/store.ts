"use client";

import { useSyncExternalStore } from "react";
import type { LeadType } from "@/lib/schemas/lead";

/*
 * Boîte de réception de démonstration, conservée dans le localStorage du visiteur.
 * Remplacée en phase 2 par l'API (module leads) : même forme de données que `LeadRecord` côté API.
 */

export const leadStatuses = ["new", "progress", "confirmed", "cancelled"] as const;
export type LeadStatus = (typeof leadStatuses)[number];
export type LeadSource = "site" | "manual" | "sample";

/** Champs bruts de la demande (sous-ensemble en liste blanche du formulaire). */
export type LeadFields = Partial<Record<(typeof capturedFields)[number], string>>;

export type DemoLead = {
  ref: string;
  type: LeadType;
  name: string;
  phone: string;
  email?: string;
  fields: LeadFields;
  /** Résumé libre (demande saisie à la main) ; sinon calculé à partir de `fields`. */
  summary?: string;
  createdAt: string;
  status: LeadStatus;
  source: LeadSource;
  history: { at: string; status: LeadStatus | "received" | "ack" }[];
};

/** Clé versionnée : changer de version recharge les exemples chez les visiteurs ayant déjà ouvert la démo. */
const KEY = "ethnika_demo_leads_v2";
const PENDING_KEY = "ethnika_demo_pending";
const capturedFields = [
  "type",
  "fullName",
  "email",
  "phone",
  "subject",
  "message",
  "circuit",
  "circuitTitle",
  "travellers",
  "travelDate",
  "trip",
  "from",
  "to",
  "departDate",
  "returnDate",
  "adults",
  "children",
  "infants",
  "cabin",
  "request",
  "organisation",
  "period",
] as const;

function read<T>(storage: () => Storage, key: string): T | undefined {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function write(storage: () => Storage, key: string, value: unknown) {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    // Stockage indisponible (navigation privée, quota) : la démo continue sans persistance.
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

/* ---------- Données d'exemple (maquette AdminDemandes.dc.html, fictives) ---------- */

function daysAgo(days: number, hour: number, minute: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function sample(ref: string, type: LeadType, name: string, n: number, fields: LeadFields, status: LeadStatus, at: string): DemoLead {
  const history: DemoLead["history"] = [
    { at, status: "received" },
    { at, status: "ack" },
  ];
  if (status !== "new") history.push({ at, status });
  return { ref, type, name, phone: `+224 6XX XX XX ${String(n).padStart(2, "0")}`, email: `client${n}@exemple.com`, fields, createdAt: at, status, source: "sample", history };
}

export function sampleLeads(): DemoLead[] {
  return [
    sample("ETH-0421", "billet", "Aminata D.", 1, { trip: "rt", from: "CKY", to: "CDG", adults: "2", cabin: "eco", message: "Souhaite bagage 2 × 23 kg." }, "new", daysAgo(0, 9, 14)),
    sample("ETH-0420", "circuit", "Ibrahima S.", 2, { circuit: "fouta-djallon-cascades-sommets", travellers: "4", message: "Dates flexibles en décembre." }, "new", daysAgo(0, 8, 2)),
    sample(
      "ETH-0419",
      "pro",
      "ONG [Nom]",
      3,
      { request: "ong", travellers: "12", organisation: "ONG [Nom]", message: "Mission à Dakar. Facturation sur bon de commande." },
      "progress",
      daysAgo(1, 17, 40),
    ),
    sample("ETH-0418", "circuit", "Mariama B.", 4, { circuit: "escapade-iles-de-loos", travellers: "2", message: "Week-end du [DATE]." }, "confirmed", daysAgo(1, 11, 5)),
    sample("ETH-0417", "pelerinage", "Association [Nom]", 5, { request: "pelerinage", travellers: "25", message: "Oumra : demande de devis complet." }, "progress", daysAgo(2, 15, 22)),
    sample("ETH-0416", "billet", "Ousmane K.", 6, { trip: "ow", from: "CKY", to: "IST", adults: "1", cabin: "eco", message: "Le client a trouvé ailleurs." }, "cancelled", daysAgo(3, 10, 48)),
    sample("ETH-0415", "billet", "Fatoumata C.", 7, { trip: "rt", from: "CKY", to: "ABJ", adults: "1", cabin: "eco", message: "Billet émis." }, "confirmed", daysAgo(4, 9, 30)),
    ...olderSamples(),
  ];
}

/** Historique fictif sur trois semaines (tableau de bord : tendance, taux de confirmation, file prioritaire). */
function olderSamples(): DemoLead[] {
  const rows: [LeadType, string, LeadFields, LeadStatus, number, number][] = [
    ["billet", "Mamadou B.", { trip: "rt", from: "CKY", to: "DSS", adults: "1", cabin: "eco" }, "new", 2, 10],
    ["circuit", "Hawa T.", { circuit: "bel-air-sobane-kitikata", travellers: "3" }, "progress", 5, 14],
    ["billet", "Sékou C.", { trip: "rt", from: "CKY", to: "IST", adults: "2", cabin: "business" }, "confirmed", 6, 9],
    ["contact", "Kadiatou S.", { subject: "Visa", message: "Question sur le visa pour la France." }, "confirmed", 7, 16],
    ["billet", "Alpha O.", { trip: "ow", from: "CKY", to: "ABJ", adults: "1", cabin: "eco" }, "confirmed", 8, 11],
    ["groupe", "École [Nom]", { request: "groupe", travellers: "30", message: "Sortie scolaire aux îles de Loos." }, "progress", 9, 15],
    ["circuit", "Famille Bah", { circuit: "fouta-djallon-cascades-sommets", travellers: "5" }, "confirmed", 10, 18],
    ["billet", "Aïssatou K.", { trip: "rt", from: "CKY", to: "CMN", adults: "1", cabin: "eco" }, "cancelled", 11, 8],
    ["pro", "Entreprise [Nom]", { request: "entreprise", travellers: "6", message: "Séminaire à Dakar, 3 nuits." }, "confirmed", 12, 10],
    ["billet", "Thierno D.", { trip: "rt", from: "CKY", to: "CDG", adults: "3", cabin: "eco" }, "confirmed", 14, 13],
    ["circuit", "Nènè C.", { circuit: "dubreka-pirogues-cascades", travellers: "2" }, "cancelled", 15, 17],
    ["billet", "Lansana K.", { trip: "rt", from: "CKY", to: "JED", adults: "2", cabin: "eco" }, "confirmed", 17, 9],
    ["pelerinage", "Mosquée [Nom]", { request: "pelerinage", travellers: "40", message: "Hajj 2027 : pré-inscription." }, "progress", 19, 12],
    ["billet", "Fanta S.", { trip: "ow", from: "CKY", to: "DSS", adults: "1", cabin: "eco" }, "confirmed", 20, 15],
  ];
  return rows.map(([type, name, fields, status, days, hour], i) => sample(`ETH-${String(414 - i).padStart(4, "0")}`, type, name, 8 + i, fields, status, daysAgo(days, hour, (i * 17) % 60)));
}

/* ---------- Magasin observable ---------- */

let cache: DemoLead[] | undefined;
const listeners = new Set<() => void>();
const EMPTY: DemoLead[] = [];

function load(): DemoLead[] {
  if (!cache) {
    cache = read<DemoLead[]>(local, KEY) ?? sampleLeads();
  }
  return cache;
}

function commit(next: DemoLead[]) {
  cache = next;
  write(local, KEY, next);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Demandes, plus récentes d'abord. Vide pendant le rendu serveur. */
export function useDemoLeads(): DemoLead[] {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

/** Vrai une fois monté côté client (le rendu serveur ne connaît pas le localStorage). */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function setLeadStatus(ref: string, status: LeadStatus) {
  const at = new Date().toISOString();
  commit(load().map((l) => (l.ref === ref && l.status !== status ? { ...l, status, history: [...l.history, { at, status }] } : l)));
}

/** Référence locale au format ETHNIKA, unique dans la boîte de démo. */
function nextRef(existing: DemoLead[]) {
  const max = existing.reduce((m, l) => Math.max(m, Number.parseInt(l.ref.replace(/\D/g, "").slice(-4), 10) || 0), 421);
  return `ETH-${String(max + 1).padStart(4, "0")}`;
}

export function addManualLead(input: { type: LeadType; name: string; phone: string; email?: string; summary: string; note?: string }) {
  const all = load();
  const at = new Date().toISOString();
  const lead: DemoLead = {
    ref: nextRef(all),
    type: input.type,
    name: input.name,
    phone: input.phone,
    email: input.email || undefined,
    summary: input.summary,
    fields: { message: input.note },
    createdAt: at,
    status: "new",
    source: "manual",
    history: [{ at, status: "received" }],
  };
  commit([lead, ...all]);
  return lead.ref;
}

export function resetDemo() {
  commit(sampleLeads());
}

/* ---------- Capture depuis les formulaires publics ---------- */

/** Mémorise les champs d'un formulaire au moment de l'envoi (la référence n'est connue qu'après). */
export function capturePending(form: HTMLFormElement) {
  const data = new FormData(form);
  const fields: LeadFields = {};
  for (const key of capturedFields) {
    const v = data.get(key);
    if (typeof v === "string" && v.trim()) fields[key] = v.trim().slice(0, 3000);
  }
  write(session, PENDING_KEY, fields);
}

/** Enregistre la demande en attente sous la référence renvoyée par le serveur. Idempotent. */
export function commitPending(ref: string) {
  const fields = read<LeadFields>(session, PENDING_KEY);
  if (!fields?.fullName || !fields.phone) return;
  const all = load();
  if (all.some((l) => l.ref === ref)) return;
  const at = new Date().toISOString();
  const type = (fields.type ?? "contact") as LeadType;
  const lead: DemoLead = {
    ref,
    type: type === "pro" && fields.request ? proType(fields.request) : type,
    name: fields.fullName,
    phone: fields.phone,
    email: fields.email,
    fields,
    createdAt: at,
    status: "new",
    source: "site",
    history: [
      { at, status: "received" },
      { at, status: "ack" },
    ],
  };
  commit([lead, ...all]);
  try {
    session().removeItem(PENDING_KEY);
  } catch {
    // ignoré
  }
}

function proType(request: string): LeadType {
  return request === "groupe" ? "groupe" : request === "pelerinage" ? "pelerinage" : "pro";
}
