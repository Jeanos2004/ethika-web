import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { currentStep, totpAt } from "../src/common/security/totp";
import type { PrismaService } from "../src/prisma/prisma.service";
import type { UsersService } from "../src/modules/auth/users.service";
import { adminSession, agentSession, cleanup, createApp, KEY, TEST_PREFIX } from "./helpers";

describe("Authentification du back-office (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let users: UsersService;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, prisma, users } = await createApp());
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  it("répond de la même façon pour un compte inconnu et un mauvais mot de passe", async () => {
    const unknown = await api().post("/v1/auth/login").set("x-internal-key", KEY).send({ email: `${TEST_PREFIX}inconnu@example.com`, password: "x" }).expect(401);
    const { email } = await agentSession(app, users);
    const wrong = await api().post("/v1/auth/login").set("x-internal-key", KEY).send({ email, password: "mauvais" }).expect(401);
    expect(unknown.body).toEqual(wrong.body);
  });

  it("impose le changement du mot de passe temporaire", async () => {
    const email = `${TEST_PREFIX}temp-${Date.now()}@example.com`;
    const { temporaryPassword } = await users.create({ email, name: "E2E temp", role: "agent" }, null);
    const login = await api().post("/v1/auth/login").set("x-internal-key", KEY).send({ email, password: temporaryPassword }).expect(200);
    const res = await api().get("/v1/leads").set("x-internal-key", KEY).set("x-session-token", login.body.session).expect(403);
    expect(res.body.error).toBe("password_change_required");
    await api().post("/v1/auth/password").set("x-internal-key", KEY).set("x-session-token", login.body.session).send({ current: temporaryPassword, next: "court" }).expect(400);
  });

  it("un agent accède aux demandes mais pas à la gestion des comptes (RBAC)", async () => {
    const { session } = await agentSession(app, users, "agent");
    await api().get("/v1/leads").set("x-internal-key", KEY).set("x-session-token", session).expect(200);
    await api().get("/v1/users").set("x-internal-key", KEY).set("x-session-token", session).expect(403);
    await api().get("/v1/leads").set("x-internal-key", KEY).set("x-session-token", "jeton-inventé").expect(401);
  });

  it("un admin doit configurer la 2FA, puis se connecte en deux étapes ; un code ne sert qu'une fois", async () => {
    const admin = await agentSession(app, users, "admin");
    // Session limitée tant que la 2FA n'est pas active.
    const blocked = await api().get("/v1/users").set("x-internal-key", KEY).set("x-session-token", admin.session).expect(403);
    expect(blocked.body.error).toBe("mfa_required");

    const setup = await api().post("/v1/auth/mfa/setup").set("x-internal-key", KEY).set("x-session-token", admin.session).expect(200);
    expect(setup.body.otpauthUri).toMatch(/^otpauth:\/\/totp\//);
    const enabled = await api().post("/v1/auth/mfa/enable").set("x-internal-key", KEY).set("x-session-token", admin.session).send({ code: totpAt(setup.body.secret, currentStep()) }).expect(200);
    await api().get("/v1/users").set("x-internal-key", KEY).set("x-session-token", enabled.body.session).expect(200);
    // L'ancienne session a été remplacée (rotation).
    await api().get("/v1/auth/me").set("x-internal-key", KEY).set("x-session-token", admin.session).expect(401);

    // Nouvelle connexion : mot de passe puis code. Le code déjà utilisé à l'activation est refusé (rejeu).
    const step1 = await api().post("/v1/auth/login").set("x-internal-key", KEY).send({ email: admin.email, password: admin.password }).expect(200);
    expect(step1.body.status).toBe("mfa_required");
    await api().post("/v1/auth/mfa").set("x-internal-key", KEY).send({ challenge: step1.body.challenge, code: totpAt(setup.body.secret, currentStep()) }).expect(401);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: admin.email } });
    await prisma.user.update({ where: { id: user.id }, data: { totpLastStep: currentStep() - 2 } });
    const step2 = await api().post("/v1/auth/mfa").set("x-internal-key", KEY).send({ challenge: step1.body.challenge, code: totpAt(setup.body.secret, currentStep()) }).expect(200);
    expect(step2.body.status).toBe("ok");
    const me = await api().get("/v1/auth/me").set("x-internal-key", KEY).set("x-session-token", step2.body.session).expect(200);
    expect(me.body).toMatchObject({ email: admin.email, role: "admin", mfaVerified: true });
    expect(me.body.sessionId).toBeUndefined();

    const audit = await api().get("/v1/audit").set("x-internal-key", KEY).set("x-session-token", step2.body.session).expect(200);
    expect(audit.body.map((a: { action: string }) => a.action)).toContain("auth.mfa_enabled");
  });

  it("verrouille le compte après 5 échecs", async () => {
    const agent = await agentSession(app, users);
    for (let i = 0; i < 5; i++) await api().post("/v1/auth/login").set("x-internal-key", KEY).send({ email: agent.email, password: "mauvais" }).expect(401);
    // Même le bon mot de passe est refusé pendant le verrouillage.
    await api().post("/v1/auth/login").set("x-internal-key", KEY).send({ email: agent.email, password: agent.password }).expect(401);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: agent.email } });
    expect(user.lockedUntil?.getTime()).toBeGreaterThan(Date.now());
  });

  it("paramètres du compte : profil, renommage, sessions et révocation des autres appareils", async () => {
    const first = await agentSession(app, users);
    const as = (r: request.Test, token = first.session) => r.set("x-internal-key", KEY).set("x-session-token", token);
    const second = await api().post("/v1/auth/login").set("x-internal-key", KEY).send({ email: first.email, password: first.password }).expect(200);

    const profile = await as(api().get("/v1/account")).expect(200);
    expect(profile.body).toMatchObject({ email: first.email, role: "agent", totpEnabled: false });
    expect(profile.body).not.toHaveProperty("passwordHash");
    await as(api().patch("/v1/account")).send({ name: "E2E Nouveau Nom" }).expect(200);
    await as(api().patch("/v1/account")).send({ name: "E2E Nouveau Nom", role: "admin" }).expect(400);

    const sessions = await as(api().get("/v1/account/sessions")).expect(200);
    expect(sessions.body).toHaveLength(2);
    const current = sessions.body.find((x: { current: boolean }) => x.current);
    expect(current.handle).toMatch(/^[a-f0-9]{16}$/);
    await as(api().post("/v1/account/sessions/revoke")).send({ handle: current.handle }).expect(400);
    const other = await as(api().post("/v1/account/sessions/revoke-others")).expect(200);
    expect(other.body.revoked).toBe(1);
    await as(api().get("/v1/auth/me"), second.body.session).expect(401);
    await as(api().get("/v1/auth/me")).expect(200);

    // État du système : administrateurs uniquement, sans secret.
    await as(api().get("/v1/system")).expect(403);
    const admin = await adminSession(app, users);
    const system = await as(api().get("/v1/system"), admin.session).expect(200);
    expect(system.body).toMatchObject({ flightProvider: "mock", mail: expect.any(Object), counts: expect.any(Object) });
    expect(JSON.stringify(system.body)).not.toMatch(/DATABASE_URL|postgresql|INTERNAL_API_KEY/);
  });

  it("la déconnexion invalide la session", async () => {
    const { session } = await agentSession(app, users);
    await api().post("/v1/auth/logout").set("x-internal-key", KEY).set("x-session-token", session).expect(204);
    await api().get("/v1/auth/me").set("x-internal-key", KEY).set("x-session-token", session).expect(401);
  });
});
