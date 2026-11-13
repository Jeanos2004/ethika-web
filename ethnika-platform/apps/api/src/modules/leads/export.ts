import ExcelJS from "exceljs";
import { csvCell } from "../../common/csv";
import { leadSummary } from "./summary";

/*
 * Exports des demandes (CSV et Excel) : mêmes colonnes lisibles, dans l'ordre d'un tableau de suivi d'agence.
 * Détails résumés en clair (trajet, circuit, effectif), dates à l'heure de Conakry, agent en charge.
 * CSV : cellules commençant par = + - @ neutralisées (csvCell). Excel : valeurs écrites comme texte, jamais comme formules.
 */

export const statusLabels = { new: "Nouvelle", in_progress: "En cours", confirmed: "Confirmée", cancelled: "Annulée" } as const;
export const typeLabels = { contact: "Contact", billet: "Billetterie", circuit: "Circuit", groupe: "Groupe", pelerinage: "Pèlerinage", pro: "Entreprise / ONG" } as const;
const sourceLabels: Record<string, string> = { site: "Site web", manual: "Saisie équipe" };

export type ExportLead = {
  reference: string;
  createdAt: Date;
  status: keyof typeof statusLabels;
  type: keyof typeof typeLabels;
  fullName: string;
  phone: string;
  email: string | null;
  details: unknown;
  message: string | null;
  source: string;
  assignedTo: { name: string } | null;
};

const columns = [
  { header: "Référence", key: "reference", width: 13 },
  { header: "Reçue le", key: "createdAt", width: 17 },
  { header: "Statut", key: "status", width: 12 },
  { header: "Type", key: "type", width: 16 },
  { header: "Client", key: "fullName", width: 24 },
  { header: "Téléphone", key: "phone", width: 18 },
  { header: "E-mail", key: "email", width: 28 },
  { header: "Demande", key: "summary", width: 46 },
  { header: "Message", key: "message", width: 46 },
  { header: "En charge", key: "assignee", width: 20 },
  { header: "Origine", key: "source", width: 14 },
] as const;

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Conakry" });

/** Résumé lisible ; pour un billet, le trajet en tête (« CKY → CDG · Aller-retour · … »). */
function summaryOf(l: ExportLead) {
  const { summary, route } = leadSummary(l.type, (l.details ?? {}) as Record<string, unknown>, "fr");
  return route?.from && route.to ? `${route.from} → ${route.to} · ${summary}` : summary;
}

function row(l: ExportLead) {
  return {
    reference: l.reference,
    createdAt: l.createdAt,
    status: statusLabels[l.status],
    type: typeLabels[l.type],
    fullName: l.fullName,
    phone: l.phone,
    email: l.email ?? "",
    summary: summaryOf(l),
    message: l.message ?? "",
    assignee: l.assignedTo?.name ?? "Non attribuée",
    source: sourceLabels[l.source] ?? l.source,
  };
}

/** CSV « ; » avec BOM UTF-8, lisible tel quel dans Excel français. */
export function leadsCsv(items: ExportLead[]) {
  const lines = [columns.map((c) => csvCell(c.header)).join(";")];
  for (const l of items) {
    const r = row(l);
    lines.push(columns.map((c) => csvCell(c.key === "createdAt" ? dateTime.format(r.createdAt).replace(",", "") : r[c.key])).join(";"));
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}

/**
 * Classeur Excel : feuille « Demandes » (en-tête aux couleurs ETHNIKA, figé, filtres automatiques, vraies dates,
 * lignes alternées, statut coloré) et feuille « Synthèse » (totaux par statut et par type).
 */
export async function leadsWorkbook(items: ExportLead[], meta: { generatedAt: Date; filters: string }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ETHNIKA back-office";
  wb.created = meta.generatedAt;

  const NIGHT = "FF16211C";
  const GOLD = "FFE3A935";
  const SAND = "FFF5EEE3";
  const LINE = "FFE3D8C8";
  const statusFill: Record<string, string> = { Nouvelle: "FFEDE9E4", "En cours": "FFF8E6C4", Confirmée: "FFD3E7DA", Annulée: "FFF8DADB" };

  const ws = wb.addWorksheet("Demandes", { views: [{ state: "frozen", ySplit: 1 }], properties: { defaultRowHeight: 18 } });
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  const header = ws.getRow(1);
  header.height = 24;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NIGHT } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "medium", color: { argb: GOLD } } };
  });

  items.forEach((l, i) => {
    const r = row(l);
    // Cellules texte (chaînes partagées) : jamais évaluées comme formules, donc aucun préfixe nécessaire, contrairement au CSV.
    const added = ws.addRow(r);
    added.getCell("createdAt").numFmt = "dd/mm/yyyy hh:mm";
    added.getCell("reference").font = { name: "Consolas", size: 10 };
    added.getCell("summary").alignment = { wrapText: true, vertical: "top" };
    added.getCell("message").alignment = { wrapText: true, vertical: "top" };
    added.eachCell((cell) => {
      cell.border = { bottom: { style: "thin", color: { argb: LINE } } };
      if (!cell.alignment) cell.alignment = { vertical: "top" };
      if (i % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBF5" } };
    });
    const status = added.getCell("status");
    status.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusFill[r.status] ?? SAND } };
    status.font = { bold: true };
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, items.length + 1), column: columns.length } };

  // Synthèse
  const sum = wb.addWorksheet("Synthèse");
  sum.columns = [
    { key: "a", width: 28 },
    { key: "b", width: 14 },
  ];
  const title = sum.addRow(["ETHNIKA · export des demandes"]);
  title.font = { bold: true, size: 14, color: { argb: NIGHT } };
  sum.addRow([`Généré le ${dateTime.format(meta.generatedAt)}`]).font = { color: { argb: "FF6B6259" } };
  sum.addRow([`Filtres : ${meta.filters}`]).font = { color: { argb: "FF6B6259" } };
  sum.addRow([]);
  const section = (label: string, entries: [string, number][]) => {
    const h = sum.addRow([label, "Demandes"]);
    h.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NIGHT } };
    });
    for (const [k, n] of entries) sum.addRow([k, n]).getCell(2).alignment = { horizontal: "right" };
    const total = sum.addRow(["Total", entries.reduce((s, [, n]) => s + n, 0)]);
    total.font = { bold: true };
    total.getCell(1).border = total.getCell(2).border = { top: { style: "thin", color: { argb: GOLD } } };
    sum.addRow([]);
  };
  const count = <K extends string>(labels: Record<K, string>, pick: (l: ExportLead) => K) => Object.entries(labels).map(([k, v]) => [v as string, items.filter((l) => pick(l) === k).length] as [string, number]);
  section("Par statut", count(statusLabels, (l) => l.status));
  section("Par type", count(typeLabels, (l) => l.type));
  section("Par origine", [
    ["Site web", items.filter((l) => l.source === "site").length],
    ["Saisie équipe", items.filter((l) => l.source === "manual").length],
  ]);

  return Buffer.from(await wb.xlsx.writeBuffer());
}
