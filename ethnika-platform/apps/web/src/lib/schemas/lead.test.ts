import { describe, expect, it } from "vitest";
import { leadSchema } from "./lead";

const identity = { fullName: "Aminata Diallo", email: "aminata@example.com", phone: "+224 620 00 00 00", consent: true };
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const contact = { ...identity, type: "contact", message: "Je souhaite un devis pour le Fouta." };
const flight = { ...identity, type: "billet", trip: "rt", from: "CKY", to: "CDG", departDate: inDays(10), returnDate: inDays(20), adults: "2", children: "0", infants: "0", cabin: "eco" };

describe("leadSchema — contact", () => {
  it("accepte une demande valide", () => {
    expect(leadSchema.safeParse(contact).success).toBe(true);
  });
  it("refuse un type hors liste blanche", () => {
    expect(leadSchema.safeParse({ ...contact, type: "admin" }).success).toBe(false);
  });
  it("exige le consentement", () => {
    expect(leadSchema.safeParse({ ...contact, consent: false }).success).toBe(false);
  });
  it("rejette le pot de miel rempli", () => {
    expect(leadSchema.safeParse({ ...contact, website: "spam.example" }).success).toBe(false);
  });
  it("borne la longueur du message", () => {
    expect(leadSchema.safeParse({ ...contact, message: "x".repeat(3001) }).success).toBe(false);
  });
});

describe("leadSchema — circuit", () => {
  const circuit = { ...identity, type: "circuit", circuit: "fouta-djallon-cascades-sommets", travellers: "2" };
  it("accepte un devis sans message ni date", () => {
    expect(leadSchema.safeParse(circuit).success).toBe(true);
  });
  it("refuse un circuit inconnu", () => {
    expect(leadSchema.safeParse({ ...circuit, circuit: "../admin" }).success).toBe(false);
  });
  it("refuse une date passée et un nombre de voyageurs hors bornes", () => {
    expect(leadSchema.safeParse({ ...circuit, travelDate: "2020-01-01" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...circuit, travellers: "40" }).success).toBe(false);
  });
});

describe("leadSchema — billet", () => {
  it("accepte un aller-retour cohérent", () => {
    expect(leadSchema.safeParse(flight).success).toBe(true);
  });
  it("exige la date de retour pour un aller-retour, postérieure au départ", () => {
    expect(leadSchema.safeParse({ ...flight, returnDate: undefined }).success).toBe(false);
    expect(leadSchema.safeParse({ ...flight, returnDate: inDays(5) }).success).toBe(false);
  });
  it("limite les bébés au nombre d'adultes", () => {
    expect(leadSchema.safeParse({ ...flight, adults: "1", infants: "2" }).success).toBe(false);
  });
  it("valide les codes IATA et refuse départ = destination", () => {
    expect(leadSchema.safeParse({ ...flight, to: "PARIS" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...flight, to: "CKY" }).success).toBe(false);
  });
  it("exige au moins un second vol, dans l'ordre chronologique, pour un multi-destinations", () => {
    const multi = { ...flight, trip: "multi", returnDate: undefined };
    expect(leadSchema.safeParse(multi).success).toBe(false);
    expect(leadSchema.safeParse({ ...multi, legs: [{ from: "CDG", to: "IST", date: inDays(15) }] }).success).toBe(true);
    expect(leadSchema.safeParse({ ...multi, legs: [{ from: "CDG", to: "IST", date: inDays(5) }] }).success).toBe(false);
  });
});

describe("leadSchema — groupe / pro", () => {
  const pro = { fullName: "Mamadou Bah", phone: "+224 620 00 00 00", consent: true, type: "pro", request: "entreprise", travellers: "25", message: "Séminaire à Kindia pour 25 personnes." };
  it("accepte une demande sans e-mail", () => {
    expect(leadSchema.safeParse(pro).success).toBe(true);
  });
  it("refuse une catégorie inconnue", () => {
    expect(leadSchema.safeParse({ ...pro, request: "autre" }).success).toBe(false);
  });
});
