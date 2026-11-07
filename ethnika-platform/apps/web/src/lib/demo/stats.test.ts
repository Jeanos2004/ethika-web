import { describe, expect, it } from "vitest";
import type { DemoLead } from "./store";
import { ageLabel, dailyCounts, kpis, priorityQueue, recentActivity } from "./stats";

const now = new Date("2026-11-07T12:00:00Z");
const ago = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
const lead = (ref: string, status: DemoLead["status"], hoursAgo: number): DemoLead => ({
  ref,
  type: "billet",
  name: ref,
  phone: "+224",
  fields: {},
  createdAt: ago(hoursAgo),
  status,
  source: "sample",
  history: [
    { at: ago(hoursAgo), status: "received" },
    { at: ago(hoursAgo), status: "ack" },
  ],
});

const leads = [lead("A", "new", 2), lead("B", "new", 30), lead("C", "progress", 50), lead("D", "confirmed", 100), lead("E", "confirmed", 200), lead("F", "cancelled", 220)];

describe("statistiques du tableau de bord", () => {
  it("compte les demandes par jour, du plus ancien au plus récent", () => {
    const days = dailyCounts(leads, 14, now);
    expect(days).toHaveLength(14);
    expect(days.at(-1)).toMatchObject({ key: "2026-11-07", count: 1 });
    expect(days.reduce((s, d) => s + d.count, 0)).toBe(6);
  });

  it("calcule les indicateurs", () => {
    expect(kpis(leads, now)).toEqual({ toTreat: 2, overdue: 1, inProgress: 1, confirmationRate: 2 / 3, last7: 4, prev7: 2 });
    expect(kpis([lead("X", "new", 1)], now).confirmationRate).toBeNull();
  });

  it("classe la file prioritaire : nouvelles puis en cours, les plus anciennes d'abord", () => {
    expect(priorityQueue(leads).map((l) => l.ref)).toEqual(["B", "A", "C"]);
  });

  it("liste l'activité récente sans les accusés de réception", () => {
    const events = recentActivity(leads, 3);
    expect(events.map((e) => e.ref)).toEqual(["A", "B", "C"]);
    expect(events.every((e) => e.status !== "ack")).toBe(true);
  });

  it("formate l'âge", () => {
    expect(ageLabel(ago(3), now)).toBe("3 h");
    expect(ageLabel(ago(50), now)).toBe("2 j");
  });
});
