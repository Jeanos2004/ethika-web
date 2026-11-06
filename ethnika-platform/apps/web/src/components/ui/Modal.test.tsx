import { useState } from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Demander un devis" description="Circuit Fouta">
        <p>Contenu</p>
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("s'ouvre avec titre et description accessibles", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Ouvrir" }));
    const dialog = screen.getByRole("dialog", { name: "Demander un devis" });
    expect(dialog).toHaveProperty("open", true);
    expect(dialog.getAttribute("aria-describedby")).toBe(screen.getByText("Circuit Fouta").id);
  });

  it("se ferme avec le bouton Fermer et rend le focus au déclencheur", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Ouvrir" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Fermer" }));
    expect(document.querySelector("dialog")).toHaveProperty("open", false);
    expect(document.activeElement).toBe(trigger);
  });
});
