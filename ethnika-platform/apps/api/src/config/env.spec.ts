import { loadEnv } from "./env";

const base = { DATABASE_URL: "postgresql://u:p@localhost:5432/db", INTERNAL_API_KEY: "k".repeat(40), DATA_ENCRYPTION_KEY: "a".repeat(64) };

describe("loadEnv", () => {
  it("considère les variables vides comme absentes", () => {
    const env = loadEnv({ ...base, SMTP_URL: "", AGENCY_NOTIFY_EMAIL: " ", DUFFEL_TOKEN: "" });
    expect(env.SMTP_URL).toBeUndefined();
    expect(env.AGENCY_NOTIFY_EMAIL).toBeUndefined();
    expect(env.FLIGHT_PROVIDER).toBe("mock");
  });

  it("refuse une clé interne trop courte sans divulguer sa valeur", () => {
    expect(() => loadEnv({ ...base, INTERNAL_API_KEY: "court" })).toThrow(/INTERNAL_API_KEY/);
    expect(() => loadEnv({ ...base, INTERNAL_API_KEY: "court" })).not.toThrow(/court/);
  });

  it("exige un jeton Duffel quand le fournisseur Duffel est choisi", () => {
    expect(() => loadEnv({ ...base, FLIGHT_PROVIDER: "duffel" })).toThrow(/DUFFEL_TOKEN/);
  });
});
