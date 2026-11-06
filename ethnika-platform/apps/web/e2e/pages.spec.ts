import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Contrôles communs à toutes les pages publiques : accessibilité (axe, violations sérieuses et critiques),
 * absence de défilement horizontal, un seul h1, et capture pleine page de référence.
 * Filtrer une page : `pnpm --filter @ethnika/web exec playwright test pages -g "accueil"`.
 */
const routes: { name: string; path: string }[] = [
  { name: "accueil", path: "/" },
  { name: "guinee", path: "/decouvrir-la-guinee" },
  { name: "fouta", path: "/decouvrir-la-guinee/mali-fouta-djallon" },
  { name: "loos", path: "/decouvrir-la-guinee/iles-de-loos" },
  { name: "basse-cote", path: "/decouvrir-la-guinee/basse-cote" },
  { name: "infos-pratiques", path: "/decouvrir-la-guinee/infos-pratiques" },
  { name: "circuits", path: "/circuits" },
  { name: "circuit-fouta", path: "/circuits/fouta-djallon-cascades-sommets" },
  { name: "billetterie", path: "/billetterie" },
  { name: "services", path: "/services" },
  { name: "offres", path: "/offres" },
  { name: "blog", path: "/blog" },
  { name: "article", path: "/blog/iles-de-loos-quelle-ile-choisir" },
  { name: "galerie", path: "/galerie" },
  { name: "a-propos", path: "/a-propos" },
  { name: "contact", path: "/contact" },
  { name: "faq", path: "/faq" },
  { name: "mentions-legales", path: "/mentions-legales" },
  { name: "cgv", path: "/cgv" },
  { name: "confidentialite", path: "/confidentialite" },
  { name: "cookies", path: "/cookies" },
  { name: "merci", path: "/merci?ref=ETH-AB12CD" },
  { name: "404", path: "/page-inexistante" },
  // Version anglaise : échantillon couvrant chaque gabarit.
  { name: "en-accueil", path: "/en" },
  { name: "en-fouta", path: "/en/decouvrir-la-guinee/mali-fouta-djallon" },
  { name: "en-circuit", path: "/en/circuits/escapade-iles-de-loos" },
  { name: "en-billetterie", path: "/en/billetterie" },
  { name: "en-article", path: "/en/blog/iles-de-loos-quelle-ile-choisir" },
  { name: "en-faq", path: "/en/faq" },
  { name: "en-cgv", path: "/en/cgv" },
  { name: "en-404", path: "/en/page-inexistante" },
];

/** Charge les images différées pour la capture. Attend la fin de l'hydratation : modifier le DOM avant fausserait celle-ci. */
async function loadAllImages(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    const images = [...document.images];
    images.forEach((img) => (img.loading = "eager"));
    await Promise.all(
      images.map((img) =>
        img.complete
          ? null
          : new Promise((r) => {
              img.addEventListener("load", r, { once: true });
              img.addEventListener("error", r, { once: true });
            }),
      ),
    );
  });
}

for (const route of routes) {
  test.describe(`page ${route.name}`, () => {
    test("accessibilité, h1 unique, pas de défilement horizontal", async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator("h1")).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "défilement horizontal").toBeLessThanOrEqual(0);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const blocking = violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id}: ${v.nodes.slice(0, 4).map((n) => n.target.join(" ")).join(" | ")}`);
      expect(blocking).toEqual([]);
    });

    test("capture", async ({ page }, testInfo) => {
      await page.goto(route.path);
      await loadAllImages(page);
      await expect(page.locator("header").first()).not.toHaveCSS("position", "fixed");
      await page.screenshot({ path: `captures/${route.name}-${testInfo.project.name}.png`, fullPage: true, animations: "disabled" });
    });
  });
}
