import { leadSummaryHtml } from "./lead-summary";

const agency = { address: "[Quartier], Conakry", phone: "+224", email: "contact@ethnikatour.com", licence: "[X]", site: "ethnikatour.com" };

describe("leadSummaryHtml", () => {
  it("échappe les données du client", () => {
    const html = leadSummaryHtml(
      { reference: "ETH-ABCDEF", type: "contact", fullName: '<script>alert("x")</script> Kadi', phone: "+224 620", email: null, message: "<img src=x onerror=1>", details: { subject: "<b>" }, createdAt: new Date("2026-11-06T10:00:00Z") },
      agency,
    );
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("affiche le trajet d'une demande de billet", () => {
    const html = leadSummaryHtml(
      { reference: "ETH-ABCDEF", type: "billet", fullName: "Aminata Diallo", phone: "+224", email: "a@example.com", message: null, details: { from: "CKY", to: "CDG", trip: "rt", departDate: "2027-01-10", adults: 2, cabin: "eco" }, createdAt: new Date() },
      agency,
    );
    expect(html).toContain("CKY → CDG");
    expect(html).toContain("10/01/2027");
    expect(html).toContain("Bonjour Aminata,");
  });
});
