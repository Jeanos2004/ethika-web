import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render";
import userEvent from "@testing-library/user-event";
import { Tabs } from "./Tabs";

const items = [
  { value: "a", label: "Programme", content: "Contenu A" },
  { value: "b", label: "Inclus", content: "Contenu B" },
  { value: "c", label: "Départs", content: "Contenu C" },
];

describe("Tabs", () => {
  it("relie onglets et panneaux et n'affiche que le panneau actif", () => {
    render(<Tabs label="Détail" items={items} />);
    const tab = screen.getByRole("tab", { name: "Programme" });
    expect(tab.getAttribute("aria-selected")).toBe("true");
    const panel = screen.getByRole("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
    expect(panel.textContent).toBe("Contenu A");
  });

  it("n'expose qu'un seul onglet au Tab (tabindex itinérant)", () => {
    render(<Tabs label="Détail" items={items} defaultValue="b" />);
    const tabbable = screen.getAllByRole("tab").filter((t) => t.tabIndex === 0);
    expect(tabbable.map((t) => t.textContent)).toEqual(["Inclus"]);
  });

  it("navigue aux flèches avec bouclage, Début et Fin", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tabs label="Détail" items={items} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("tab", { name: "Programme" }));
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Départs" }).getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement?.textContent).toBe("Départs");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement?.textContent).toBe("Programme");
    await user.keyboard("{End}");
    expect(document.activeElement?.textContent).toBe("Départs");
    await user.keyboard("{Home}");
    expect(document.activeElement?.textContent).toBe("Programme");
    expect(onValueChange).toHaveBeenLastCalledWith("a");
  });
});
