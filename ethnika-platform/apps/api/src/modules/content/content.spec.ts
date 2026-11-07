import { circuitInput, durationBucket, offerInput } from "./content.schemas";
import { localize } from "./content.service";

const offer = {
  slug: "paris-saison-basse",
  type: "vol",
  i18n: { fr: { kicker: "Conakry → Paris", title: "Paris aller-retour", description: "Bagage inclus.", imageAlt: "Avion" } },
  imageUrl: "/images/avion-ciel.jpg",
  href: "/billetterie?vers=CDG#demande",
};

describe("schémas des contenus", () => {
  it("accepte une offre valide avec valeurs par défaut", () => {
    expect(offerInput.parse(offer)).toMatchObject({ published: false, position: 0 });
  });

  it.each([
    ["href externe (redirection ouverte)", { href: "https://evil.example.com" }],
    ["href protocole-relatif", { href: "//evil.example.com/x" }],
    ["href javascript:", { href: "javascript:alert(1)" }],
    ["image javascript:", { imageUrl: "javascript:alert(1)" }],
    ["image http en clair", { imageUrl: "http://cdn.example.com/a.jpg" }],
    ["slug invalide", { slug: "Paris Saison!" }],
    ["champ inconnu", { secret: true }],
  ])("refuse : %s", (_label, patch) => {
    expect(offerInput.safeParse({ ...offer, ...patch }).success).toBe(false);
  });

  it("accepte une image sur CDN en HTTPS", () => {
    expect(offerInput.safeParse({ ...offer, imageUrl: "https://cdn.example.com/a.jpg" }).success).toBe(true);
  });

  it("valide un circuit et ses départs", () => {
    const base = {
      slug: "escapade-iles-de-loos",
      theme: "plage",
      region: "conakry",
      durationDays: 2,
      imageUrl: "/images/loos.jpg",
      i18n: { fr: { title: "Escapade", headline: "Escapade aux îles de Loos", summary: "Kassa et Roume.", place: "Boulbinet", imageAlt: "Pirogue", durationLabel: "2 jours" } },
    };
    expect(circuitInput.parse(base)).toMatchObject({ departures: [], published: false });
    expect(circuitInput.safeParse({ ...base, departures: [{ dates: "12–13 déc.", status: "complet", price: "[PRIX]" }] }).success).toBe(false);
  });

  it("calcule la tranche de durée du filtre du site", () => {
    expect([1, 2, 4, 5, 9].map(durationBucket)).toEqual(["1", "2-4", "2-4", "5+", "5+"]);
  });
});

describe("localize", () => {
  const i18n = { fr: { title: "Titre", summary: "Résumé", days: ["J1"] }, en: { title: "Title", days: [] } };

  it("renvoie le français", () => {
    expect(localize(i18n, "fr")).toEqual(i18n.fr);
  });

  it("complète l'anglais par le français, champ par champ", () => {
    expect(localize(i18n, "en")).toEqual({ title: "Title", summary: "Résumé", days: ["J1"] });
  });
});
