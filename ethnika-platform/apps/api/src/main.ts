import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { loadEnv } from "./config/env";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap() {
  // .env local (développement) ; en production, variables fournies par l'hébergeur.
  try {
    process.loadEnvFile();
  } catch {
    // pas de fichier .env : normal en production
  }
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule.register(env), { logger: ["log", "warn", "error"], bodyParser: false });
  app.use(helmet());
  app.enableCors({ origin: env.CORS_ORIGINS, methods: ["GET", "POST", "PATCH"], credentials: true });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useBodyParser("json", { limit: "300kb" });
  app.enableShutdownHooks();
  // Derrière un reverse proxy (Caddy / Nginx) : adresse client réelle pour les journaux et limites.
  app.set("trust proxy", 1);
  await app.listen(env.PORT);
  new Logger("Bootstrap").log(`API ETHNIKA sur le port ${env.PORT}`);
}

void bootstrap();
