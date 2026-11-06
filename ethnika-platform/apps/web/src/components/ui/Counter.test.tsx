import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render";
import userEvent from "@testing-library/user-event";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("respecte les bornes et désactive les boutons aux limites", async () => {
    const user = userEvent.setup();
    render(<Counter label="Adultes" min={1} max={2} defaultValue={1} />);
    const minus = screen.getByRole("button", { name: "Diminuer : Adultes" });
    const plus = screen.getByRole("button", { name: "Augmenter : Adultes" });
    expect(minus).toHaveProperty("disabled", true);
    await user.click(plus);
    expect(screen.getByRole("status").textContent).toBe("2");
    expect(plus).toHaveProperty("disabled", true);
  });

  it("en mode contrôlé, remonte la valeur bornée sans changer seul", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Counter label="Bébés" max={1} value={1} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Diminuer : Bébés" }));
    expect(onValueChange).toHaveBeenCalledWith(0);
    expect(screen.getByRole("status").textContent).toBe("1");
  });

  it("envoie la valeur avec le formulaire quand name est fourni", () => {
    const { container } = render(<Counter label="Enfants" name="children" defaultValue={3} />);
    expect(container.querySelector<HTMLInputElement>('input[name="children"]')?.value).toBe("3");
  });
});
