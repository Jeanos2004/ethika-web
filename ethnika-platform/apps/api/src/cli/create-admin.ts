import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { loadEnv } from "../config/env";
import { UsersService } from "../modules/auth/users.service";

/**
 * Création du premier administrateur (aucun compte par défaut) :
 *   pnpm --filter @ethnika/api user:create-admin admin@ethnikatour.com "Prénom Nom"
 * Affiche une seule fois le mot de passe temporaire. À la première connexion : nouveau mot de passe, puis 2FA.
 */
async function main() {
  const [email, ...nameParts] = process.argv.slice(2).filter((a) => a !== "--");
  const name = nameParts.join(" ").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2) {
    console.error("Usage : user:create-admin <email> \"Prénom Nom\"");
    process.exit(1);
  }
  try {
    process.loadEnvFile();
  } catch {
    // variables déjà fournies par l'environnement
  }
  const app = await NestFactory.createApplicationContext(AppModule.register(loadEnv()), { logger: ["error"] });
  try {
    const { user, temporaryPassword } = await app.get(UsersService).create({ email, name, role: "admin" }, null);
    console.info(`Administrateur créé : ${user.email}`);
    console.info(`Mot de passe temporaire (affiché une seule fois) : ${temporaryPassword}`);
  } finally {
    await app.close();
  }
}

void main();
