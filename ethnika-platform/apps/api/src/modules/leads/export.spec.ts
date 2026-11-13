import ExcelJS from "exceljs";
import { leadsCsv, leadsWorkbook, type ExportLead } from "./export";

const lead = (over: Partial<ExportLead> = {}): ExportLead => ({
  reference: "ETH-ABC234",
  createdAt: new Date("2026-11-11T14:40:00Z"),
  status: "in_progress",
  type: "billet",
  fullName: "Aminata Diallo",
  phone: "+224620000000",
  email: "aminata@example.com",
  details: { trip: "rt", from: "CKY", to: "CDG", departDate: "2026-12-22", returnDate: "2027-01-05", adults: 1, children: 0, infants: 0, cabin: "eco" },
  message: null,
  source: "site",
  assignedTo: { name: "Mariama Bah" },
  ...over,
});

describe("exports des demandes", () => {
  it("CSV : colonnes lisibles, date de Conakry, résumé en clair, formules neutralisées", () => {
    const csv = leadsCsv([lead(), lead({ reference: "ETH-XYZ789", fullName: "=HYPERLINK(\"x\")", source: "manual", assignedTo: null, status: "new" })]);
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines[0]).toBe("Référence;Reçue le;Statut;Type;Client;Téléphone;E-mail;Demande;Message;En charge;Origine");
    expect(lines[1]).toContain("11/11/2026 14:40");
    expect(lines[1]).toContain("En cours;Billetterie");
    expect(lines[1]).toMatch(/CKY.*CDG/);
    expect(lines[1]).toContain("Mariama Bah;Site web");
    expect(lines[2]).toContain("'=HYPERLINK");
    expect(lines[2]).toContain("Non attribuée;Saisie équipe");
    expect(csv).not.toContain("{");
  });

  it("Excel : feuilles Demandes et Synthèse, en-tête figé et filtré, vraies dates", async () => {
    const buf = await leadsWorkbook([lead(), lead({ status: "confirmed", type: "circuit", details: { circuit: "fouta", travellers: 2 } })], { generatedAt: new Date(), filters: "aucun" });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Demandes")!;
    expect(ws.getRow(1).getCell(1).value).toBe("Référence");
    expect(ws.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(ws.autoFilter).toBeTruthy();
    expect(ws.getRow(2).getCell(2).value).toBeInstanceOf(Date);
    expect(ws.rowCount).toBe(3);
    const synth = wb.getWorksheet("Synthèse")!;
    const values = synth.getSheetValues().flat().filter((v) => typeof v === "string" || typeof v === "number");
    expect(values).toEqual(expect.arrayContaining(["Par statut", "Confirmée", "Par type", "Circuit"]));
  });
});
