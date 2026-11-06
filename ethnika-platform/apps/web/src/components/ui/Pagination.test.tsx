import { describe, expect, it } from "vitest";
import { pageSlots } from "./Pagination";

describe("pageSlots", () => {
  it("affiche toutes les pages quand il y en a peu", () => {
    expect(pageSlots(1, 3)).toEqual([1, 2, 3]);
  });

  it("insère des ellipses autour de la page courante", () => {
    expect(pageSlots(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
  });

  it("gère les extrémités", () => {
    expect(pageSlots(1, 10)).toEqual([1, 2, "gap", 10]);
    expect(pageSlots(10, 10)).toEqual([1, "gap", 9, 10]);
  });
});
