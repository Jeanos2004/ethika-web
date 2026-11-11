import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { PrismaService } from "../src/prisma/prisma.service";
import type { UsersService } from "../src/modules/auth/users.service";
import { adminSession, agentSession, cleanup, createApp, KEY } from "./helpers";

/* Newsletter (double opt-in), attribution et notes, indicateurs, contenus (offres, circuits). */
describe("Back-office : newsletter, attribution, indicateurs, contenus (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let users: UsersService;
  let agent: { session: string };
  let admin: { session: string };
  const api = () => request(app.getHttpServer());
  const as = (s: { session: string }, r: request.Test) => r.set("x-internal-key", KEY).set("x-session-token", s.session);

  beforeAll(async () => {
    ({ app, prisma, users } = await createApp());
    agent = await agentSession(app, users, "agent");
    admin = await adminSession(app, users);
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  describe("newsletter en double opt-in", () => {
    const email = "double-optin@e2e.example.com";
    const tokenFrom = (url: string) => new URL(url).searchParams.get("token") ?? "";

    it("inscription → e-mail de confirmation → confirmation → désinscription", async () => {
      await api().post("/v1/newsletter").set("x-internal-key", KEY).send({ email, locale: "fr" }).expect(201);
      const mail = await prisma.emailOutbox.findFirstOrThrow({ where: { to: email, template: "newsletter_confirm" }, orderBy: { createdAt: "desc" } });
      const payload = mail.payload as { confirmUrl: string; unsubscribeUrl: string };
      expect(payload.confirmUrl).toMatch(/\/newsletter\/confirmer\?token=/);

      const before = await prisma.subscriber.findUniqueOrThrow({ where: { email } });
      expect(before.confirmedAt).toBeNull();
      // Le jeton n'est jamais stocké en clair.
      expect(before.confirmTokenHash).not.toBe(tokenFrom(payload.confirmUrl));

      await api().post("/v1/newsletter/confirm").set("x-internal-key", KEY).send({ token: tokenFrom(payload.confirmUrl) }).expect(200);
      expect((await prisma.subscriber.findUniqueOrThrow({ where: { email } })).confirmedAt).not.toBeNull();
      // Usage unique.
      await api().post("/v1/newsletter/confirm").set("x-internal-key", KEY).send({ token: tokenFrom(payload.confirmUrl) }).expect(404);

      await api().post("/v1/newsletter/unsubscribe").set("x-internal-key", KEY).send({ token: tokenFrom(payload.unsubscribeUrl) }).expect(200);
      expect((await prisma.subscriber.findUniqueOrThrow({ where: { email } })).unsubscribedAt).not.toBeNull();
    });

    it("répond pareil pour une adresse déjà inscrite (pas d'énumération) et n'envoie pas deux e-mails en 10 min", async () => {
      const e = "deux-fois@e2e.example.com";
      const a = await api().post("/v1/newsletter").set("x-internal-key", KEY).send({ email: e }).expect(201);
      const b = await api().post("/v1/newsletter").set("x-internal-key", KEY).send({ email: e }).expect(201);
      expect(Object.keys(a.body)).toEqual(Object.keys(b.body));
      expect(await prisma.emailOutbox.count({ where: { to: e } })).toBe(1);
    });

    it("refuse un jeton mal formé", async () => {
      await api().post("/v1/newsletter/confirm").set("x-internal-key", KEY).send({ token: "<script>" }).expect(400);
    });
  });

  describe("attribution, notes et indicateurs", () => {
    let ref: string;

    beforeAll(async () => {
      const created = await api()
        .post("/v1/leads")
        .set("x-internal-key", KEY)
        .send({ type: "contact", fullName: "E2E Attribution", phone: "+224 620 00 00 01", email: "attrib@example.com", consent: true, message: "Bonjour, demande à attribuer." })
        .expect(201);
      ref = created.body.reference;
    });

    it("attribue la demande à l'agent connecté, filtre « mes demandes », ajoute une note", async () => {
      const me = await as(agent, api().get("/v1/auth/me")).expect(200);
      const assigned = await as(agent, api().patch(`/v1/leads/${ref}/assign`)).send({ userId: me.body.userId }).expect(200);
      expect(assigned.body.assignedTo.name).toBe("E2E agent");
      expect(assigned.body.events.map((e: { kind: string }) => e.kind)).toContain("assigned");

      const mine = await as(agent, api().get("/v1/leads").query({ assignee: "me" })).expect(200);
      expect(mine.body.items.map((l: { reference: string }) => l.reference)).toContain(ref);
      const unassigned = await as(agent, api().get("/v1/leads").query({ assignee: "none" })).expect(200);
      expect(unassigned.body.items.map((l: { reference: string }) => l.reference)).not.toContain(ref);

      const noted = await as(agent, api().post(`/v1/leads/${ref}/notes`)).send({ note: "Client rappelé, attend un devis." }).expect(201);
      expect(noted.body.events.at(-1)).toMatchObject({ kind: "note", note: "Client rappelé, attend un devis." });
    });

    it("refuse d'attribuer à un compte inexistant", async () => {
      await as(agent, api().patch(`/v1/leads/${ref}/assign`)).send({ userId: "00000000-0000-4000-8000-000000000000" }).expect(400);
    });

    it("calcule les indicateurs du tableau de bord", async () => {
      const stats = await as(agent, api().get("/v1/stats")).expect(200);
      expect(stats.body.kpis.toTreat).toBeGreaterThanOrEqual(1);
      expect(stats.body.daily).toHaveLength(30);
      expect(stats.body.kpis).toHaveProperty("mineOpen");
      expect(stats.body.byStatus.new).toBeGreaterThanOrEqual(1);
      expect(stats.body.flights).toMatchObject({ held: expect.any(Number), dueSoon: expect.any(Number) });
      expect(Array.isArray(stats.body.quotes30)).toBe(true);
      expect(stats.body.daily.at(-1).count).toBeGreaterThanOrEqual(1);
      expect(stats.body.byType.contact).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(stats.body.priorityQueue)).toBe(true);
    });
  });

  describe("contenus : offres et circuits", () => {
    const offer = {
      slug: "e2e-paris-saison-basse",
      type: "vol",
      i18n: {
        fr: { kicker: "Conakry → Paris", title: "Paris aller-retour", description: "Bagage inclus.", imageAlt: "Avion" },
        en: { title: "Paris round trip" },
      },
      imageUrl: "/images/avion-ciel.jpg",
      href: "/billetterie?vers=CDG#demande",
      priceAmount: 9500000,
      currency: "GNF",
    };

    it("un agent ne peut pas modifier les contenus (admin uniquement)", async () => {
      await as(agent, api().post("/v1/admin/offers")).send(offer).expect(403);
    });

    it("brouillon invisible, publication, lecture publique localisée, slug unique, suppression", async () => {
      const created = await as(admin, api().post("/v1/admin/offers")).send(offer).expect(201);
      expect(created.body.priceAmount).toBe("9500000");

      const publicBefore = await api().get("/v1/public/offers").set("x-internal-key", KEY).expect(200);
      expect(publicBefore.body.map((o: { slug: string }) => o.slug)).not.toContain(offer.slug);

      await as(admin, api().patch(`/v1/admin/offers/${created.body.id}`)).send({ published: true }).expect(200);
      const fr = await api().get("/v1/public/offers").query({ locale: "fr" }).set("x-internal-key", KEY).expect(200);
      const en = await api().get("/v1/public/offers").query({ locale: "en" }).set("x-internal-key", KEY).expect(200);
      expect(fr.body.find((o: { slug: string }) => o.slug === offer.slug)).toMatchObject({ title: "Paris aller-retour", price: "9500000" });
      // Anglais traduit pour le titre, repli sur le français pour le reste.
      expect(en.body.find((o: { slug: string }) => o.slug === offer.slug)).toMatchObject({ title: "Paris round trip", description: "Bagage inclus." });

      await as(admin, api().post("/v1/admin/offers")).send(offer).expect(409);
      await as(admin, api().delete(`/v1/admin/offers/${created.body.id}`)).expect(200);
      expect(await prisma.auditLog.count({ where: { target: `offer:${offer.slug}` } })).toBeGreaterThanOrEqual(3);
    });

    it("circuit : fiche publique détaillée uniquement une fois publié", async () => {
      const circuit = {
        slug: "e2e-escapade-loos",
        theme: "plage",
        region: "conakry",
        durationDays: 2,
        imageUrl: "/images/loos-pirogue-couchant.jpg",
        i18n: {
          fr: {
            title: "Escapade",
            headline: "Escapade aux îles de Loos",
            summary: "Kassa, Tamara, Roume.",
            place: "Départ de Boulbinet",
            imageAlt: "Pirogue",
            durationLabel: "2 jours",
            days: [{ title: "Jour 1", text: "Traversée et plage." }],
          },
        },
        departures: [{ dates: "12–13 déc.", status: "available", price: "[PRIX]" }],
        published: true,
      };
      await as(admin, api().post("/v1/admin/circuits")).send(circuit).expect(201);
      const detail = await api().get(`/v1/public/circuits/${circuit.slug}`).set("x-internal-key", KEY).expect(200);
      expect(detail.body).toMatchObject({ durationBucket: "2-4", headline: "Escapade aux îles de Loos", departures: [{ status: "available" }] });
      const list = await api().get("/v1/public/circuits").set("x-internal-key", KEY).expect(200);
      expect(list.body.find((c: { slug: string }) => c.slug === circuit.slug).days).toBeUndefined();
      await api().get("/v1/public/circuits/e2e-inexistant").set("x-internal-key", KEY).expect(404);
    });
  });
});
