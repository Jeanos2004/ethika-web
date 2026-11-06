import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("neutralise les formules", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("+224 620")).toBe("'+224 620");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });

  it("échappe séparateurs, guillemets et retours à la ligne", () => {
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell('dit "oui"')).toBe('"dit ""oui"""');
    expect(csvCell("l1\nl2")).toBe('"l1\nl2"');
  });

  it("laisse le texte simple intact", () => {
    expect(csvCell("Aminata D.")).toBe("Aminata D.");
    expect(csvCell(undefined)).toBe("");
  });
});

describe("toCsv", () => {
  it("ajoute le BOM et des fins de ligne CRLF", () => {
    expect(toCsv(["a", "b"], [[1, "x"]])).toBe("﻿a;b\r\n1;x\r\n");
  });
});
