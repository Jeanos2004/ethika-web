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
export async function createApp(overrides: Record<string, string> = {}) {
  // Jest isole process.env : dotenv y charge le .env local (sans écraser les variables déjà fournies, ex. CI).
  loadDotenv({ quiet: true });
  // Tests reproductibles : toujours le fournisseur de vols fictif (Duffel live : test/duffel.live.e2e-spec.ts, opt-in).
  const env = loadEnv({ ...process.env, NODE_ENV: "test", FLIGHT_PROVIDER: "mock", INTERNAL_API_KEY: KEY, DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY ?? "0".repeat(64), ...overrides });
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
  await prisma.payment.deleteMany({ where: { lead: { fullName: { startsWith: "E2E " } } } });
  await prisma.lead.deleteMany({ where: { fullName: { startsWith: "E2E " } } });
  await prisma.subscriber.deleteMany({ where: { email: { endsWith: "@e2e.example.com" } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_PREFIX } } });
  await prisma.emailOutbox.deleteMany({ where: { to: { endsWith: "example.com" } } });
  await prisma.offer.deleteMany({ where: { slug: { startsWith: "e2e-" } } });
  await prisma.circuit.deleteMany({ where: { slug: { startsWith: "e2e-" } } });
  await prisma.blogPost.deleteMany({ where: { slug: { startsWith: "e2e-" } } });
  await prisma.galleryPhoto.deleteMany({ where: { i18n: { path: ["fr", "place"], equals: "E2E" } } });
  await prisma.media.deleteMany({ where: { name: { startsWith: "e2e-" } } });
  await prisma.flightBooking.deleteMany({ where: { provider: "mock" } });
}

/** Session administrateur complète : mot de passe définitif puis 2FA activée (codes TOTP générés localement). */
export async function adminSession(app: INestApplication, users: UsersService) {
  const { currentStep, totpAt } = await import("../src/common/security/totp");
  const agent = await agentSession(app, users, "admin");
  const setup = await request(app.getHttpServer()).post("/v1/auth/mfa/setup").set("x-internal-key", KEY).set("x-session-token", agent.session).expect(200);
  const enabled = await request(app.getHttpServer())
    .post("/v1/auth/mfa/enable")
    .set("x-internal-key", KEY)
    .set("x-session-token", agent.session)
    .send({ code: totpAt(setup.body.secret, currentStep()) })
    .expect(200);
  return { ...agent, session: enabled.body.session as string };
}
