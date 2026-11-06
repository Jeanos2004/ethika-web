import { expect, test } from "@playwright/test";
import { routes } from "./routes";

/**
 * Responsive : aucune page ne doit défiler horizontalement ni laisser un élément dépasser de l'écran,
 * de 320 px (petits Android) à 1280 px, en plus des projets 390 et 1440 px.
 * Lancé une seule fois (projet desktop) : la largeur est fixée dans le test.
 */
const widths = [320, 360, 768, 1024, 1280];

for (const route of routes) {
  test(`responsive ${route.name}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "largeurs pilotées par le test");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route.path);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(150);
      const offenders = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const out: string[] = [];
        if (document.documentElement.scrollWidth > vw) out.push(`page: ${document.documentElement.scrollWidth}px > ${vw}px`);
        for (const el of document.querySelectorAll<HTMLElement>("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.right <= vw + 1) continue;
          // Contenu volontairement défilant (carrousels, tableaux) ou masqué par un parent : ignoré.
          let clipped = false;
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const o = getComputedStyle(p);
            if (/(auto|scroll|hidden|clip)/.test(o.overflowX) && p.getBoundingClientRect().right <= vw + 1) {
              clipped = true;
              break;
            }
          }
          if (clipped || getComputedStyle(el).position === "fixed" || el.closest("[aria-hidden='true']")) continue;
          out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")} → ${Math.round(r.right)}px`);
          if (out.length > 5) break;
        }
        return out;
      });
      expect(offenders, `${route.path} à ${width}px`).toEqual([]);
    }
  });
}
