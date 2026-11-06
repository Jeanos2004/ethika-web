import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Violations bloquantes : sérieuses et critiques (cf. docs/PROMPT_CLAUDE_CODE.md § 4). */
async function blockingViolations(page: import("@playwright/test").Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

test.describe("Kit UI", () => {
  test("ne présente aucune violation axe sérieuse ou critique", async ({ page }) => {
    await page.goto("/kit");
    expect(await blockingViolations(page)).toEqual([]);
  });

  test("n'a pas de défilement horizontal", async ({ page }) => {
    await page.goto("/kit");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("capture de référence", async ({ page }, testInfo) => {
    await page.goto("/kit");
    // Charger toutes les images différées (après l'hydratation), puis attendre qu'elles soient décodées.
    await page.waitForLoadState("networkidle");
    await page.evaluate(async () => {
      const images = [...document.images];
      images.forEach((img) => (img.loading = "eager"));
      await Promise.all(images.map((img) => (img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true })))));
    });
    // L'en-tête doit être revenu à sa position normale (pas de version fixe dans la capture).
    await expect(page.locator("header").first()).not.toHaveCSS("position", "fixed");
    await page.screenshot({ path: testInfo.outputPath(`kit-${testInfo.project.name}.png`), fullPage: true });
  });

  test("modale : Échap ferme et rend le focus", async ({ page }) => {
    await page.goto("/kit");
    const trigger = page.getByRole("button", { name: "Ouvrir la modale" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Demander un devis" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("onglets : navigation au clavier", async ({ page }) => {
    await page.goto("/kit");
    const first = page.getByRole("tab", { name: "Programme" });
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Inclus" })).toBeFocused();
    await expect(page.getByRole("tab", { name: "Inclus" })).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("En-tête", () => {
  test("devient solide et fixe au-delà de 80px de défilement", async ({ page }) => {
    await page.goto("/contact");
    const header = page.locator("header").first();
    await expect(header).not.toHaveCSS("position", "fixed");
    await page.mouse.wheel(0, 600);
    await expect(header).toHaveCSS("position", "fixed");
    await expect(header.getByRole("img", { name: "ETHNIKA" })).toHaveAttribute("src", /logo-horizontal-couleur/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).not.toHaveCSS("position", "fixed");
  });

  test("menu mobile : le focus entre et revient au burger", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "menu burger sous 1100px");
    await page.goto("/contact");
    const burger = page.getByRole("button", { name: "Ouvrir le menu" });
    await burger.click();
    await expect(page.getByRole("dialog", { name: "Menu" }).getByRole("button", { name: "Fermer le menu" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(burger).toBeFocused();
  });
});

test("contact : aucune violation axe sérieuse ou critique", async ({ page }) => {
  await page.goto("/contact");
  expect(await blockingViolations(page)).toEqual([]);
});
