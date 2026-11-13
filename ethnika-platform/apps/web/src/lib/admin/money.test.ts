import { describe, expect, it } from "vitest";
import { formatMoney, toMinorUnits } from "./money";

describe("montants des devis", () => {
  it("convertit en unités entières selon la devise", () => {
    expect(toMinorUnits("1 250 000", "GNF")).toBe(1_250_000);
    expect(toMinorUnits("812,40", "EUR")).toBe(81_240);
    expect(toMinorUnits("812.4", "EUR")).toBe(81_240);
    expect(toMinorUnits("15", "USD")).toBe(1_500);
  });

  it("refuse les montants invalides", () => {
    expect(toMinorUnits("12,5", "GNF")).toBeNull();
    expect(toMinorUnits("1,234", "EUR")).toBeNull();
    expect(toMinorUnits("-3", "EUR")).toBeNull();
    expect(toMinorUnits("abc", "EUR")).toBeNull();
  });

  it("formate en français", () => {
    expect(formatMoney(81_240, "EUR").replace(/\s/g, " ")).toBe("812,40 €");
    expect(formatMoney("1250000", "GNF").replace(/\s/g, " ")).toMatch(/^1 250 000 GNF$/);
  });
});
