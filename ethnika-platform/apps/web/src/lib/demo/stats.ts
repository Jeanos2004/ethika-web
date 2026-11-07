import type { DemoLead, LeadStatus } from "@/lib/demo/store";

/*
 * Indicateurs du tableau de bord du back-office, calculés à partir des demandes.
 * Fonctions pures (testées) : la même logique servira avec les données de l'API.
 */

const DAY = 24 * 3600_000;

/** Clé AAAA-MM-JJ d'une date, dans le fuseau de Conakry (UTC+0). */
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Nombre de demandes reçues par jour sur les `days` derniers jours (aujourd'hui inclus), du plus ancien au plus récent. */
export function dailyCounts(leads: DemoLead[], days = 14, now = new Date()) {
  const counts = new Map<string, number>();
  for (const l of leads) counts.set(dayKey(new Date(l.createdAt)), (counts.get(dayKey(new Date(l.createdAt))) ?? 0) + 1);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getTime() - (days - 1 - i) * DAY);
    const key = dayKey(date);
    return { key, date, count: counts.get(key) ?? 0 };
  });
}

export type Kpis = {
  toTreat: number;
  overdue: number;
  inProgress: number;
  /** Confirmées / (confirmées + annulées), null s'il n'y a encore aucune demande clôturée. */
  confirmationRate: number | null;
  last7: number;
  prev7: number;
};

export function kpis(leads: DemoLead[], now = new Date()): Kpis {
  const t = now.getTime();
  const age = (l: DemoLead) => t - new Date(l.createdAt).getTime();
  const is = (s: LeadStatus) => (l: DemoLead) => l.status === s;
  const confirmed = leads.filter(is("confirmed")).length;
  const cancelled = leads.filter(is("cancelled")).length;
  return {
    toTreat: leads.filter(is("new")).length,
    overdue: leads.filter((l) => l.status === "new" && age(l) > DAY).length,
    inProgress: leads.filter(is("progress")).length,
    confirmationRate: confirmed + cancelled > 0 ? confirmed / (confirmed + cancelled) : null,
    last7: leads.filter((l) => age(l) < 7 * DAY).length,
    prev7: leads.filter((l) => age(l) >= 7 * DAY && age(l) < 14 * DAY).length,
  };
}

/** Demandes ouvertes (nouvelles puis en cours), les plus anciennes d'abord. */
export function priorityQueue(leads: DemoLead[], limit = 5) {
  const rank = { new: 0, progress: 1, confirmed: 2, cancelled: 3 } as const;
  return leads
    .filter((l) => l.status === "new" || l.status === "progress")
    .sort((a, b) => rank[a.status] - rank[b.status] || a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}

/** Derniers événements (réception, accusé, changements de statut), toutes demandes confondues. */
export function recentActivity(leads: DemoLead[], limit = 6) {
  return leads
    .flatMap((l) => l.history.filter((h) => h.status !== "ack").map((h) => ({ ref: l.ref, name: l.name, at: h.at, status: h.status })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

/** Âge lisible d'une demande : « 3 h », « 2 j ». */
export function ageLabel(iso: string, now = new Date()) {
  const hours = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 3600_000));
  return hours < 24 ? `${hours} h` : `${Math.floor(hours / 24)} j`;
}
