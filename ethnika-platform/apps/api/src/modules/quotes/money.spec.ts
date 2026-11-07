import { formatMoney, quoteTotal } from "./money";
import { quoteHtml } from "../pdf/templates/quote";

describe("montants des devis", () => {
  it("calcule un total exact en entiers", () => {
    expect(quoteTotal([{ quantity: 2, unitAmount: 4_500_000 }, { quantity: 1, unitAmount: 750_000 }])).toBe(9_750_000n);
    expect(quoteTotal([{ quantity: 3, unitAmount: 10 }])).toBe(30n); // 3 × 0,10 € sans erreur d'arrondi
  });

  it("formate GNF sans décimales et EUR avec centimes", () => {
    expect(formatMoney(9_750_000n, "GNF").replace(/\s/g, " ")).toMatch(/9 750 000\s?GNF/);
    expect(formatMoney(81240, "EUR").replace(/\s/g, " ")).toMatch(/812,40\s?€/);
  });

  it("le gabarit échappe les libellés", () => {
    const html = quoteHtml(
      {
        number: "DEV-2026-0001",
        currency: "GNF",
        lines: [{ label: "<b>Vol</b> CKY → CDG", quantity: 1, unitAmount: 9_000_000 }],
        totalAmount: 9_000_000n,
        validUntil: new Date("2030-01-01"),
        notes: null,
        createdAt: new Date(),
        lead: { reference: "ETH-ABCDEF", fullName: "Aminata", phone: "+224", email: null },
        agentName: "Conseiller",
      },
      { address: "Conakry", phone: "+224", email: "contact@ethnikatour.com", licence: "[X]", site: "ethnikatour.com" },
    );
    expect(html).toContain("&lt;b&gt;Vol&lt;/b&gt;");
    expect(html).toContain("DEV-2026-0001");
  });
});
