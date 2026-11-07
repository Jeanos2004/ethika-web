import { csvCell } from "./csv";

describe("csvCell", () => {
  it("neutralise les formules", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });
  it("échappe le séparateur", () => {
    expect(csvCell("a;b")).toBe('"a;b"');
  });
});
