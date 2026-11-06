import { expect, test } from "@playwright/test";

/**
 * Parcours de démonstration (NEXT_PUBLIC_DEMO_MODE=1), tel que la propriétaire le testera sur Vercel :
 * demande envoyée depuis le site → /merci → back-office → statut, aperçu e-mail, export CSV, saisie manuelle.
 */

test.beforeEach(async ({ page }, testInfo) => {
  const host = ((Date.now() + testInfo.workerIndex * 97) % 250) + 1;
  await page.setExtraHTTPHeaders({ "x-real-ip": `198.51.100.${host}` });
});

test("bandeau démo et site non indexé", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("note").filter({ hasText: "Site de démonstration" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("une demande envoyée depuis le site se retrouve dans le back-office", async ({ page }, testInfo) => {
  await page.goto("/contact");
  await page.getByLabel("Nom complet").fill("Kadiatou Test");
  await page.getByLabel("Téléphone / WhatsApp").fill("+224 620 11 22 33");
  await page.getByLabel("E-mail").fill("kadiatou@example.com");
  await page.getByLabel("Message").fill("Bonjour, je voudrais un devis pour Paris en décembre.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Envoyer/ }).click();
  await expect(page).toHaveURL(/\/merci\?ref=ETH-[A-Z0-9]{6}/);
  const ref = new URL(page.url()).searchParams.get("ref") ?? "";

  await page.getByRole("link", { name: /Voir ma demande dans le back-office/ }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/demandes\\?ref=${ref}`));
  const detail = page.getByRole("dialog", { name: "Détail de la demande" }).or(page.getByRole("complementary", { name: "Détail de la demande" }));
  await expect(detail.getByText(ref)).toBeVisible();
  await expect(detail.getByText("Kadiatou Test")).toBeVisible();

  await detail.getByRole("button", { name: "En cours" }).click();
  await expect(detail.getByRole("button", { name: "En cours" })).toHaveAttribute("aria-pressed", "true");
  await expect(detail.getByText("Prise en charge")).toBeVisible();

  await detail.getByRole("button", { name: "Aperçu de l'e-mail d'accusé" }).click();
  const email = page.getByRole("dialog", { name: "Aperçu de l'e-mail d'accusé" });
  await expect(email.getByText("Bonjour Kadiatou,")).toBeVisible();
  await page.screenshot({ path: `captures/demo-email-${testInfo.project.name}.png`, fullPage: false });
  await page.keyboard.press("Escape");
  await expect(email).toBeHidden();
});

test("export CSV et saisie manuelle", async ({ page }) => {
  await page.goto("/admin/demandes");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter CSV" }).click();
  expect((await download).suggestedFilename()).toMatch(/^ethnika-demandes-\d{4}-\d{2}-\d{2}\.csv$/);

  await page.getByRole("button", { name: "Nouvelle demande" }).click();
  const modal = page.getByRole("dialog", { name: "Nouvelle demande" });
  await modal.getByRole("button", { name: "Enregistrer" }).click();
  await expect(modal.getByText("Indiquez le nom du client.")).toBeVisible();
  await modal.getByLabel("Nom du client").fill("Mamadou Appel");
  await modal.getByLabel("Téléphone").fill("+224 621 00 00 00");
  await modal.getByLabel("Résumé").fill("CKY → DSS · aller simple · 1 adulte");
  await modal.getByRole("button", { name: "Enregistrer" }).click();
  await expect(modal).toBeHidden();
  await expect(page.getByText("Mamadou Appel").filter({ visible: true }).first()).toBeVisible();
});

test("filtres du back-office", async ({ page }) => {
  await page.goto("/admin/demandes");
  await page.getByRole("group", { name: "Filtrer par statut" }).getByRole("button", { name: "Annulées" }).click();
  const list = page.getByRole("region", { name: "Demandes filtrées" }).or(page.locator('section[aria-label="Demandes filtrées"]'));
  await expect(list.getByText("ETH-0416").filter({ visible: true }).first()).toBeVisible();
  await expect(list.getByText("ETH-0421")).toHaveCount(0);
  await page.getByRole("searchbox").fill("zzzz");
  await expect(page.getByText("Aucune demande pour ces filtres.")).toBeVisible();
});
