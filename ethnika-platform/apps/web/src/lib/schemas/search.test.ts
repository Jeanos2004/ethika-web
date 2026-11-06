import { describe, expect, it } from "vitest";
import { circuitsHref, parseCircuitFilters, parseFlightPrefill, parseProPrefill } from "./search";

describe("parseCircuitFilters", () => {
  it("garde les valeurs de la liste blanche", () => {
    expect(parseCircuitFilters({ theme: "nature", region: "basse-cote", duree: "1", tri: "duree", page: "2" })).toEqual({ theme: "nature", region: "basse-cote", duree: "1", tri: "duree", page: 2 });
  });
  it("ignore les valeurs inconnues ou hostiles", () => {
    expect(parseCircuitFilters({ theme: "<script>", region: ["x", "y"], tri: "prix", page: "-3" })).toEqual({ theme: undefined, region: undefined, duree: undefined, tri: "populaires", page: 1 });
  });
  it("ignore les clés héritées du prototype", () => {
    expect(parseCircuitFilters({ theme: "constructor" }).theme).toBeUndefined();
  });
});

describe("circuitsHref", () => {
  it("n'inclut que les filtres utiles", () => {
    expect(circuitsHref({ theme: "plage", tri: "populaires", page: 1 })).toBe("/circuits?theme=plage");
    expect(circuitsHref({})).toBe("/circuits");
  });
});

describe("parseFlightPrefill", () => {
  it("extrait les codes IATA et valide dates et adultes", () => {
    expect(parseFlightPrefill({ de: "Conakry (CKY)", vers: "paris", depart: "2027-03-01", adultes: "3", classe: "business" })).toEqual({
      trip: undefined,
      from: "CKY",
      to: "CDG",
      depart: "2027-03-01",
      back: undefined,
      adults: 3,
      cabin: "business",
    });
  });
  it("rejette les dates et nombres invalides", () => {
    const p = parseFlightPrefill({ depart: "01/03/2027", adultes: "42", vers: "Atlantide" });
    expect(p.depart).toBeUndefined();
    expect(p.adults).toBeUndefined();
    expect(p.to).toBeUndefined();
  });
});

describe("parseProPrefill", () => {
  it("borne les participants et nettoie le texte libre", () => {
    expect(parseProPrefill({ type: "groupe", participants: "20", destination: "<b>Kindia</b>" })).toEqual({ type: "groupe", participants: 20, destination: "bKindia/b", periode: undefined });
    expect(parseProPrefill({ participants: "5000" }).participants).toBeUndefined();
  });
});
