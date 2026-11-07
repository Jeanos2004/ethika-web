import { Inject, Injectable, Logger, OnModuleDestroy, ServiceUnavailableException } from "@nestjs/common";
import type { Browser } from "puppeteer-core";
import { ENV, type Env } from "../../config/env";

/**
 * Rendu PDF par Chrome (puppeteer-core) à partir de gabarits HTML (./templates) : mise en page libre
 * (polices de la marque, couleurs, tableaux, en-têtes et pieds de page).
 *
 * Sécurité : JavaScript désactivé dans la page, toute requête réseau bloquée (les ressources sont embarquées en data:),
 * données échappées par les gabarits. Un seul navigateur est partagé et relancé s'il tombe.
 */
@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger("Pdf");
  private browser?: Promise<Browser>;

  constructor(@Inject(ENV) private readonly env: Env) {}

  private async getBrowser(): Promise<Browser> {
    if (!this.env.CHROME_PATH) throw new ServiceUnavailableException("pdf_unavailable");
    if (!this.browser) {
      const { launch } = await import("puppeteer-core");
      this.browser = launch({
        executablePath: this.env.CHROME_PATH,
        headless: true,
        // Dans un conteneur sans utilisateur privilégié, le bac à sable de Chrome nécessite des droits absents.
        args: process.env.PDF_NO_SANDBOX === "1" ? ["--no-sandbox", "--disable-dev-shm-usage"] : [],
      });
      this.browser
        .then((b) =>
          b.on("disconnected", () => {
            this.browser = undefined;
          }),
        )
        .catch(() => {
          this.browser = undefined;
        });
    }
    return this.browser;
  }

  /** HTML complet → PDF A4. `footer` : gabarit de pied de page Chrome (numéros de page). */
  async render(html: string, options: { footer?: string } = {}): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (req.url().startsWith("data:")) void req.continue();
        else void req.abort();
      });
      await page.setContent(html, { waitUntil: "load", timeout: 15_000 });
      await page.evaluateHandle("document.fonts.ready");
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: Boolean(options.footer),
        headerTemplate: "<span></span>",
        footerTemplate: options.footer ?? "<span></span>",
        margin: { top: "0", bottom: options.footer ? "16mm" : "0", left: "0", right: "0" },
        timeout: 20_000,
      });
      return Buffer.from(pdf);
    } catch (e) {
      this.logger.error(`rendu PDF impossible : ${e instanceof Error ? e.message : "erreur"}`);
      throw new ServiceUnavailableException("pdf_failed");
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  async onModuleDestroy() {
    const b = await this.browser?.catch(() => undefined);
    await b?.close().catch(() => undefined);
  }
}
