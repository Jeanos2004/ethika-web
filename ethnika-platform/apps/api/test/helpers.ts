import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { config as loadDotenv } from "dotenv";
import { AppModule } from "../src/app.module";
import { loadEnv } from "../src/config/env";
import { HttpExceptionFilter } from "../src/common/http-exception.filter";
import { PrismaService } from "../src/prisma/prisma.service";
import { UsersService } from "../src/modules/auth/users.service";

export const KEY = "e2e-".padEnd(40, "k");
export const TEST_PREFIX = "e2e-";

/** Application complète sur la base de DATABASE_URL (migrations appliquées). */
export async function createApp() {
  // Jest isole process.env : dotenv y charge le .env local (sans écraser les variables déjà fournies, ex. CI).
  loadDotenv({ quiet: true });
  const env = loadEnv({ ...process.env, NODE_ENV: "test", INTERNAL_API_KEY: KEY, DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY ?? "0".repeat(64) });
  const moduleRef = await Test.createTestingModule({ imports: [AppModule.register(env)] }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return { app, prisma: app.get(PrismaService), users: app.get(UsersService) };
}

/** Crée un compte de test, change son mot de passe temporaire et renvoie un jeton de session utilisable. */
export async function agentSession(app: INestApplication, users: UsersService, role: "agent" | "admin" = "agent") {
  const email = `${TEST_PREFIX}${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
  const { temporaryPassword } = await users.create({ email, name: `E2E ${role}`, role }, null);
  const login = await request(app.getHttpServer()).post("/v1/auth/login").set("x-internal-key", KEY).send({ email, password: temporaryPassword }).expect(200);
  const next = "Un-mot-de-passe-solide-2026";
  const changed = await request(app.getHttpServer()).post("/v1/auth/password").set("x-internal-key", KEY).set("x-session-token", login.body.session).send({ current: temporaryPassword, next }).expect(200);
  return { email, password: next, session: changed.body.session as string, status: login.body.status as string };
}

export async function cleanup(prisma: PrismaService) {
  await prisma.lead.deleteMany({ where: { fullName: { startsWith: "E2E " } } });
  await prisma.subscriber.deleteMany({ where: { email: { endsWith: "@e2e.example.com" } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_PREFIX } } });
  await prisma.emailOutbox.deleteMany({ where: { to: { endsWith: "@example.com" } } });
}
