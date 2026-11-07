import { expect, test } from "@playwright/test";

/**
 * Parcours critiques (docs/PROMPT_CLAUDE_CODE.md, lot 10) : devis circuit, demande de billet, contact,
 * filtres de la liste des circuits, navigation mobile.
 * Le serveur tourne sans API_BASE_URL : la demande est validée puis journalisée, et une référence provisoire ETH-XXXXXX est renvoyée.
 * Chaque test envoie au plus une demande (limite de débit : 5 demandes / 10 min / IP) et se présente avec
 * sa propre adresse (plage de documentation TEST-NET-2), pour que les exécutions successives ne s'additionnent pas.
 */

let ipCounter = 0;
test.beforeEach(async ({ page }, testInfo) => {
  ipCounter += 1;
  const host = ((Date.now() + testInfo.workerIndex * 97 + ipCounter * 13) % 250) + 1;
  await page.setExtraHTTPHeaders({ "x-real-ip": `198.51.100.${host}` });
});

const identity = { name: "Aminata Diallo", phone: "+224 620 00 00 00", email: "aminata@example.com" };

test.describe("devis circuit", () => {
  test("ouvre la modale avec le nombre de voyageurs, envoie et affiche la référence", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "un envoi par parcours suffit");
    await page.goto("/circuits/fouta-djallon-cascades-sommets");
    const booking = page.getByRole("complementary", { name: "Réserver ce circuit" });
    await booking.getByRole("button", { name: "Ajouter un voyageur" }).click();
    await booking.getByRole("button", { name: "Demander un devis" }).click();

    const dialog = page.getByRole("dialog", { name: "Fouta Djallon, cascades & sommets" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("3 voyageurs");
    await expect(dialog.getByRole("status")).toHaveText("3");

    await dialog.getByLabel("Nom complet").fill(identity.name);
    await dialog.getByLabel("Téléphone / WhatsApp").fill(identity.phone);
    await dialog.getByLabel("E-mail").fill(identity.email);
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Envoyer ma demande" }).click();

    await expect(dialog.getByRole("status").filter({ hasText: "Demande envoyée" })).toBeVisible();
    await expect(dialog).toContainText(/Réf\. ETH-/);
  });

  test("affiche les erreurs de validation sans envoyer", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "un envoi par parcours suffit");
    await page.goto("/circuits/escapade-iles-de-loos");
    await page.getByRole("complementary", { name: "Réserver ce circuit" }).getByRole("button", { name: "Demander un devis" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Envoyer ma demande" }).click();
    await expect(dialog.getByRole("alert")).toContainText("Merci de corriger");
    await expect(dialog.getByLabel("Nom complet")).toHaveAttribute("aria-invalid", "true");
  });
});

test.describe("liste des circuits", () => {
  test("le filtre de thème est reflété dans l'URL et filtre la liste", async ({ page }) => {
    await page.goto("/circuits");
    await page.getByRole("navigation", { name: "Filtrer par thème" }).getByRole("link", { name: "Culture" }).click();
    await expect(page).toHaveURL(/theme=culture/);
    await expect(page.getByRole("main").getByRole("article").getByRole("heading", { level: 2 })).toHaveText(["Boffa, mémoire de la côte"]);
  });

  test("un paramètre invalide est ignoré", async ({ page }) => {
    await page.goto("/circuits?theme=%3Cscript%3E&page=999");
    await expect(page.locator("main article")).not.toHaveCount(0);
  });
});

test.describe("demande de billet", () => {
  const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

  test("préremplit depuis l'URL et met le récapitulatif à jour en direct", async ({ page }) => {
    await page.goto("/billetterie?vers=CDG&adultes=2");
    const summary = page.getByRole("region", { name: "Récapitulatif de votre demande" });
    await expect(summary).toContainText("CKY");
    await expect(summary).toContainText("CDG");
    await expect(summary).toContainText("2 adultes");
    await page.getByLabel("Destination", { exact: true }).fill("Istanbul (IST)");
    await expect(summary).toContainText("IST");
    await page.getByText("Aller simple", { exact: true }).click();
    await expect(summary).toContainText("ALLER SIMPLE");
    await expect(page.getByLabel("Date de retour")).toHaveCount(0);
  });

  test("limite les bébés au nombre d'adultes", async ({ page }) => {
    await page.goto("/billetterie");
    const addInfant = page.getByRole("button", { name: "Augmenter : Bébés" });
    await addInfant.click();
    await expect(addInfant).toBeDisabled();
  });

  test("envoie une demande aller-retour et affiche la référence", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "un envoi par parcours suffit");
    await page.goto("/billetterie?vers=DSS");
    await page.getByLabel("Date de départ").fill(inDays(20));
    await page.getByLabel("Date de retour").fill(inDays(30));
    await page.getByLabel("Nom complet").fill(identity.name);
    await page.getByLabel("Téléphone / WhatsApp").fill(identity.phone);
    await page.getByLabel("E-mail").fill(identity.email);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Envoyer ma demande" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Demande bien reçue" })).toBeVisible();
    await expect(page.getByText(/Réf\. ETH-/)).toBeVisible();
  });
});

test.describe("galerie", () => {
  test("visionneuse : flèches, Échap et retour du focus", async ({ page }) => {
    await page.goto("/galerie?filtre=loos");
    const first = page.getByRole("button", { name: "Agrandir : Pirogue au couchant" });
    await first.click();
    const viewer = page.getByRole("dialog", { name: "Visionneuse de photos" });
    await expect(viewer).toContainText("1 sur 3");
    await page.keyboard.press("ArrowRight");
    await expect(viewer).toContainText("2 sur 3");
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(first).toBeFocused();
  });
});

test.describe("blog", () => {
  test("recherche et catégorie reflétées dans l'URL", async ({ page }) => {
    await page.goto("/blog");
    await page.getByRole("searchbox", { name: "Rechercher un article" }).fill("cascades");
    await page.getByRole("button", { name: "Lancer la recherche" }).click();
    await expect(page).toHaveURL(/q=cascades/);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Les plus belles cascades du Fouta Djallon"]);
  });

  test("sommaire de l'article relié aux intertitres", async ({ page }) => {
    await page.goto("/blog/iles-de-loos-quelle-ile-choisir");
    await page.getByRole("navigation", { name: "Sommaire de l'article" }).getByRole("link", { name: "Tamara, la sauvage" }).click();
    await expect(page).toHaveURL(/#tamara-la-sauvage$/);
    await expect(page.locator("#tamara-la-sauvage")).toBeInViewport();
  });
});

test.describe("contact", () => {
  test("envoie le message et redirige vers /merci avec la référence", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "un envoi par parcours suffit");
    await page.goto("/contact");
    await page.getByLabel("Nom complet").fill(identity.name);
    await page.getByLabel("Téléphone / WhatsApp").fill(identity.phone);
    await page.getByLabel("E-mail").fill(identity.email);
    await page.getByLabel("Objet").selectOption("Circuit en Guinée");
    await page.getByLabel("Votre message").fill("Nous sommes 4 et souhaitons découvrir le Fouta en mars.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Envoyer le message" }).click();
    await expect(page).toHaveURL(/\/merci\?ref=ETH-[A-Z0-9-]+&type=contact$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Votre demande est bien reçue");
    await expect(page.getByText(/^ETH-/)).toBeVisible();
  });

  test("/merci n'affiche pas une référence invalide", async ({ page }) => {
    await page.goto("/merci?ref=%3Cscript%3Ealert(1)%3C%2Fscript%3E&type=admin");
    await expect(page.locator("dd").first()).toHaveText("—");
    await expect(page.getByText("<script>")).toHaveCount(0);
  });
});

test.describe("bandeau cookies", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("s'affiche sans choix, mémorise le refus et peut être rouvert", async ({ page, context }) => {
    await page.goto("/cookies");
    const banner = page.getByRole("region", { name: "Cookies" });
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Refuser" }).click();
    await expect(banner).toBeHidden();
    const cookie = (await context.cookies()).find((c) => c.name === "ethnika_consent");
    expect(cookie?.value).toBe("refused");
    expect(cookie?.sameSite).toBe("Lax");
    await page.reload();
    await expect(banner).toBeHidden();
    await page.getByRole("button", { name: "Gérer les cookies" }).click();
    await expect(banner).toBeVisible();
  });
});

test.describe("navigation mobile", () => {
  test("ouvre le menu, navigue et le referme", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "menu burger sous 1100px");
    await page.goto("/");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await menu.getByRole("link", { name: "Billetterie" }).click();
    await expect(page).toHaveURL(/\/billetterie$/);
    await expect(menu).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Actions rapides" })).toBeVisible();
  });

  test("se referme avec le bouton ✕ ou Échap sans quitter la page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "menu burger sous 1100px");
    await page.goto("/");
    const burger = page.getByRole("button", { name: "Ouvrir le menu" });
    const menu = page.getByRole("dialog", { name: "Menu" });

    await burger.click();
    await expect(menu).toBeVisible();
    // Le bouton de fermeture doit être le premier élément cliquable à son emplacement (rien ne le recouvre).
    const close = menu.getByRole("button", { name: "Fermer le menu" });
    await close.click({ trial: true });
    await close.click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
    await expect(burger).toBeFocused();

    await burger.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });

  test("aucun élément fixe ne recouvre le menu ouvert", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "menu burger sous 1100px");
    await page.goto("/");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    // Points de contrôle : haut (bouton fermer), milieu (liens), bas (bouton devis) du menu.
    const covered = await page.evaluate(() => {
      const dialog = document.getElementById("menu-mobile");
      if (!dialog) return ["menu introuvable"];
      const w = window.innerWidth;
      const h = window.innerHeight;
      return [
        [w - 40, 40],
        [w / 2, h / 2],
        [w / 2, h - 60],
        [w - 50, h - 50],
      ]
        .filter(([x, y]) => !dialog.contains(document.elementFromPoint(x!, y!)))
        .map(([x, y]) => `${Math.round(x!)},${Math.round(y!)} → ${document.elementFromPoint(x!, y!)?.outerHTML.slice(0, 80)}`);
    });
    expect(covered).toEqual([]);
  });
});

test.describe("Langues", () => {
  test("le sélecteur mène à la même page en anglais puis revient en français", async ({ page }) => {
    await page.goto("/circuits");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    const switcher = page.getByRole("navigation", { name: "Langue" }).first();
    // Sur mobile, le sélecteur est dans le menu.
    if (!(await switcher.isVisible())) await page.getByRole("button", { name: /menu/i }).click();
    await page.getByRole("link", { name: /^EN ·/ }).first().click();
    await expect(page).toHaveURL(/\/en\/circuits$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Tours/);
    const back = page.getByRole("navigation", { name: "Language" }).first();
    if (!(await back.isVisible())) await page.getByRole("button", { name: /menu/i }).click();
    await page.getByRole("link", { name: /^FR ·/ }).first().click();
    await expect(page).toHaveURL(/\/circuits$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("/fr/… redirige vers l'URL sans préfixe", async ({ page }) => {
    await page.goto("/fr/billetterie");
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/billetterie$/);
  });
});
