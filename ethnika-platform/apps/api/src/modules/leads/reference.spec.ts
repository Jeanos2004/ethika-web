import { newReference, REFERENCE_PATTERN } from "./reference";

describe("newReference", () => {
  it("produit ETH- + 6 caractères sans ambiguïté", () => {
    for (let i = 0; i < 500; i++) expect(newReference()).toMatch(REFERENCE_PATTERN);
  });

  it("varie d'un tirage à l'autre", () => {
    const refs = new Set(Array.from({ length: 1000 }, newReference));
    expect(refs.size).toBeGreaterThan(995);
  });
});
