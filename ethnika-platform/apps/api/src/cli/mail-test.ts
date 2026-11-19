import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { loadEnv } from "../config/env";
import { MailService } from "../modules/mail/mail.service";

/**
 * Envoie un e-mail de test pour vérifier la configuration (Resend ou SMTP) :
 *   pnpm --filter @ethnika/api mail:test destinataire@exemple.com
 * En production : docker compose -f deploy/docker-compose.prod.yml exec -T api node dist/cli/mail-test.js destinataire@exemple.com
 */
async function main() {
  const [to] = process.argv.slice(2).filter((a) => a !== "--");
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.error("Usage : mail:test <email>");
    process.exit(1);
  }
  try {
    process.loadEnvFile();
  } catch {
    // variables déjà fournies par l'environnement
  }
  const app = await NestFactory.createApplicationContext(AppModule.register(loadEnv()), { logger: ["error"] });
  try {
    const provider = await app.get(MailService).sendTest(to);
    console.info(provider === "none" ? "Aucun service d'envoi configuré (RESEND_API_KEY ou SMTP_URL) : rien n'a été envoyé." : `E-mail de test envoyé (service : ${provider}).`);
  } catch (e) {
    console.error(`Échec de l'envoi : ${e instanceof Error ? e.message : "erreur inconnue"}`);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void main();
