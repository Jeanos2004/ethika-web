import { defineConfig, devices } from "@playwright/test";

/**
 * Parcours, accessibilité (axe) et captures de référence.
 * Utilise le Chrome installé sur la machine (`channel: "chrome"`) : aucun navigateur à télécharger.
 * Réutilise le serveur `pnpm dev` s'il tourne déjà sur le port 3000.
 * E2E_BASE_URL (ex. http://localhost:3010 après `pnpm build && pnpm start -p 3010`) : teste un serveur déjà lancé, sans en démarrer.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  // En mode développement, la première visite d'une route la compile : délai généreux.
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    channel: "chrome",
    trace: "retain-on-failure",
    // Choix cookies déjà fait : le bandeau ne masque pas les pages (testé à part dans flows.spec.ts).
    storageState: {
      cookies: [{ name: "ethnika_consent", value: "refused", domain: "localhost", path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" }],
      origins: [],
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome", viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
