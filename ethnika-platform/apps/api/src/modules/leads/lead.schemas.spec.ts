import { leadInput, leadQuery, splitLead } from "./lead.schemas";

const base = { fullName: "Aminata Diallo", phone: "+224 620 00 00 00", consent: true as const };

describe("leadInput", () => {
  it("accepte une demande de billet valide", () => {
    const r = leadInput.safeParse({ ...base, type: "billet", email: "a@example.com", trip: "rt", from: "CKY", to: "CDG", departDate: "2027-01-10", returnDate: "2027-01-20", adults: 2, children: 0, infants: 0, cabin: "eco" });
    expect(r.success).toBe(true);
  });

  it("refuse un champ inconnu (liste blanche stricte)", () => {
    const r = leadInput.safeParse({ ...base, type: "contact", email: "a@example.com", message: "Bonjour, une question.", isAdmin: true });
    expect(r.success).toBe(false);
  });

  it("refuse un trajet identique et trop de bébés", () => {
    const r = leadInput.safeParse({ ...base, type: "billet", email: "a@example.com", trip: "ow", from: "CKY", to: "CKY", departDate: "2027-01-10", adults: 1, children: 0, infants: 2, cabin: "eco" });
    expect(r.success).toBe(false);
  });

  it("exige le consentement", () => {
    const r = leadInput.safeParse({ ...base, consent: false, type: "contact", email: "a@example.com", message: "Bonjour, une question." });
    expect(r.success).toBe(false);
  });
});

describe("splitLead", () => {
  it("sépare colonnes communes et détails, sans le consentement", () => {
    const input = leadInput.parse({ ...base, type: "circuit", email: "a@example.com", circuit: "escapade-iles-de-loos", travellers: 2 });
    expect(splitLead(input)).toEqual({ type: "circuit", fullName: "Aminata Diallo", phone: "+224 620 00 00 00", email: "a@example.com", locale: "fr", message: undefined, details: { circuit: "escapade-iles-de-loos", travellers: 2 } });
  });
});

describe("leadQuery", () => {
  it("borne la pagination", () => {
    expect(leadQuery.safeParse({ pageSize: "500" }).success).toBe(false);
    expect(leadQuery.parse({})).toMatchObject({ page: 1, pageSize: 25 });
  });
});
