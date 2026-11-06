import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render";
import { Checkbox, Input } from "./Field";

describe("Input", () => {
  it("relie le libellé et l'aide", () => {
    render(<Input label="Nom complet" hint="Comme sur le passeport" />);
    const input = screen.getByLabelText("Nom complet");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(document.getElementById(input.getAttribute("aria-describedby") ?? "")?.textContent).toBe("Comme sur le passeport");
  });

  it("signale l'erreur via aria-invalid et aria-describedby", () => {
    render(<Input label="E-mail" error="Adresse e-mail incomplète" hint="Aide" />);
    const input = screen.getByLabelText("E-mail");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const described = (input.getAttribute("aria-describedby") ?? "").split(" ").map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual(["Adresse e-mail incomplète", "Aide"]);
  });
});

describe("Checkbox", () => {
  it("est cochable via son libellé et expose l'erreur", () => {
    render(<Checkbox label="J'accepte" error="Votre accord est nécessaire" />);
    const box = screen.getByRole("checkbox", { name: "J'accepte" });
    expect(box.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Votre accord est nécessaire").id).toBe(box.getAttribute("aria-describedby"));
  });
});
