import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render";
import userEvent from "@testing-library/user-event";
import { Accordion } from "./Accordion";

const items = [
  { value: "q1", title: "Faut-il un visa ?", content: "Réponse 1" },
  { value: "q2", title: "Comment payer ?", content: "Réponse 2" },
];

describe("Accordion", () => {
  it("ouvre le panneau par défaut et relie bouton et région", () => {
    render(<Accordion items={items} defaultOpen={["q1"]} />);
    const button = screen.getByRole("button", { name: /visa/ });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const region = screen.getByRole("region", { name: /visa/ });
    expect(region.id).toBe(button.getAttribute("aria-controls"));
    expect(screen.getByText("Réponse 2").closest("[hidden]")).not.toBeNull();
  });

  it("n'ouvre qu'un panneau à la fois par défaut", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} defaultOpen={["q1"]} />);
    await user.click(screen.getByRole("button", { name: /payer/ }));
    expect(screen.getByRole("button", { name: /payer/ }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: /visa/ }).getAttribute("aria-expanded")).toBe("false");
  });

  it("garde plusieurs panneaux ouverts en mode multiple, et referme au second clic", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} defaultOpen={["q1"]} multiple />);
    await user.click(screen.getByRole("button", { name: /payer/ }));
    expect(screen.getAllByRole("region")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: /visa/ }));
    expect(screen.getByRole("button", { name: /visa/ }).getAttribute("aria-expanded")).toBe("false");
  });
});
