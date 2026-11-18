import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { PrismaService } from "../src/prisma/prisma.service";
import type { UsersService } from "../src/modules/auth/users.service";
import { agentSession, cleanup, createApp, KEY } from "./helpers";

/*
 * API des demandes contre une vraie base PostgreSQL :
 *   cd apps/api && docker compose up -d && pnpm prisma:deploy && pnpm test:e2e
 */
describe("API demandes, devis et e-mails (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let users: UsersService;
  let session: string;
  const api = () => request(app.getHttpServer());
  const bo = (r: request.Test) => r.set("x-internal-key", KEY).set("x-session-token", session);

  beforeAll(async () => {
    ({ app, prisma, users } = await createApp());
    ({ session } = await agentSession(app, users));
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  const billet = {
    type: "billet",
    fullName: "E2E Aminata Diallo",
    phone: "+224 620 00 00 00",
    email: "aminata@example.com",
    consent: true,
    trip: "rt",
    from: "CKY",
    to: "CDG",
    departDate: "2030-01-10",
    returnDate: "2030-01-20",
    adults: 2,
    children: 0,
    infants: 0,
    cabin: "eco",
    message: "Bagage 2 × 23 kg.",
  };

  it("refuse toute requête sans la clé interne", async () => {
    await api().post("/v1/leads").send(billet).expect(401);
    await api().get("/v1/leads").set("x-internal-key", "mauvaise").expect(401);
  });

  it("le back-office exige une session même avec la clé interne", async () => {
    await api().get("/v1/leads").set("x-internal-key", KEY).expect(401);
  });

  it("refuse une demande invalide sans renvoyer les valeurs reçues", async () => {
    const res = await api().post("/v1/leads").set("x-internal-key", KEY).send({ ...billet, to: "CKY", injected: "<script>" }).expect(400);
    expect(res.body.error).toBe("invalid_input");
    expect(JSON.stringify(res.body)).not.toContain("<script>");
  });

  it("crée une demande et met l'accusé de réception en file dans la même transaction", async () => {
    const created = await api().post("/v1/leads").set("x-internal-key", KEY).send(billet).expect(201);
    const ref: string = created.body.reference;
    expect(ref).toMatch(/^ETH-[A-HJ-NP-Z2-9]{6}$/);
    const mails = await prisma.emailOutbox.findMany({ where: { to: "aminata@example.com", template: "ack" } });
    expect(mails.some((m) => (m.payload as { reference: string }).reference === ref)).toBe(true);
  });

  it("liste, change le statut (historique + audit) et exporte", async () => {
    const created = await api().post("/v1/leads").set("x-internal-key", KEY).send(billet).expect(201);
    const ref: string = created.body.reference;

    const list = await bo(api().get("/v1/leads").query({ q: "E2E Aminata" })).expect(200);
    expect(list.body.items.map((l: { reference: string }) => l.reference)).toContain(ref);

    const updated = await bo(api().patch(`/v1/leads/${ref}/status`)).send({ status: "in_progress" }).expect(200);
    expect(updated.body.status).toBe("in_progress");
    expect(updated.body.events.map((e: { kind: string }) => e.kind)).toEqual(["received", "status_changed"]);

    const csv = await bo(api().get("/v1/leads/export.csv").query({ q: ref })).expect(200);
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.text).toContain(ref);

    expect(await prisma.auditLog.count({ where: { action: "lead.status_changed", target: ref } })).toBe(1);
  });

  it("crée un devis numéroté avec un total exact", async () => {
    const created = await api().post("/v1/leads").set("x-internal-key", KEY).send(billet).expect(201);
    const ref: string = created.body.reference;
    const quote = await bo(api().post(`/v1/leads/${ref}/quotes`))
      .send({ currency: "GNF", validUntil: "2030-01-01", lines: [{ label: "Billet CKY → CDG A/R", quantity: 2, unitAmount: 9_500_000 }, { label: "Frais de service", quantity: 1, unitAmount: 250_000 }] })
      .expect(201);
    expect(quote.body.number).toMatch(/^DEV-\d{4}-\d{4}$/);
    expect(quote.body.totalAmount).toBe("19250000");
    const list = await bo(api().get(`/v1/leads/${ref}/quotes`)).expect(200);
    expect(list.body).toHaveLength(1);
    await bo(api().post(`/v1/leads/${ref}/quotes`)).send({ currency: "GNF", validUntil: "2000-01-01", lines: [] }).expect(400);
  });

  it("un agent saisit une demande reçue par téléphone : source manuelle, attribuée, auditée", async () => {
    await api().post("/v1/leads/manual").set("x-internal-key", KEY).send(billet).expect(401);
    const res = await bo(api().post("/v1/leads/manual")).send({ ...billet, fullName: "E2E Saisie Agent" }).expect(201);
    const lead = await bo(api().get(`/v1/leads/${res.body.reference}`)).expect(200);
    expect(lead.body).toMatchObject({ source: "manual", fullName: "E2E Saisie Agent" });
    expect(lead.body.assignedTo).not.toBeNull();
    expect(await prisma.auditLog.count({ where: { action: "lead.created", target: res.body.reference } })).toBe(1);
    await bo(api().post("/v1/leads/manual")).send({ ...billet, from: "XX" }).expect(400);
  });

  it("répond 404 pour une référence inconnue ou mal formée", async () => {
    await bo(api().get("/v1/leads/ETH-ZZZZZZ")).expect(404);
    await bo(api().get("/v1/leads/abc")).expect(404);
  });

  it("borne la pagination", async () => {
    await bo(api().get("/v1/leads").query({ pageSize: 1000 })).expect(400);
  });

  it("enregistre une inscription newsletter (idempotent)", async () => {
    for (let i = 0; i < 2; i++) await api().post("/v1/newsletter").set("x-internal-key", KEY).send({ email: "test@e2e.example.com" }).expect(201);
    expect(await prisma.subscriber.count({ where: { email: "test@e2e.example.com" } })).toBe(1);
  });

  it("recherche de vols (fournisseur fictif) puis option réservée aux agents", async () => {
    const search = await api()
      .post("/v1/flights/search")
      .set("x-internal-key", KEY)
      .send({ slices: [{ origin: "CKY", destination: "CDG", date: "2030-01-10" }], passengers: { adults: 1, children: 0, infants: 0 }, cabin: "eco" })
      .expect(200);
    const offerId = search.body.offers[0].id as string;
    const pax = [{ type: "adult", title: "ms", givenName: "Aminata", familyName: "Diallo", bornOn: "1990-01-01", gender: "f", email: "a@example.com", phone: "+224620000000" }];
    await api().post("/v1/flights/orders").set("x-internal-key", KEY).send({ offerId, passengers: pax }).expect(401);
    const order = await bo(api().post("/v1/flights/orders")).send({ offerId, passengers: pax }).expect(201);
    expect(order.body.status).toBe("held");
  });

  const pdfIt = process.env.CHROME_PATH ? it : it.skip;
  pdfIt("génère le récapitulatif PDF", async () => {
    const created = await api().post("/v1/leads").set("x-internal-key", KEY).send(billet).expect(201);
    const pdf = await bo(api().get(`/v1/leads/${created.body.reference}/pdf`))
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(pdf.headers["content-type"]).toBe("application/pdf");
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("sonde de santé", async () => {
    await api().get("/health").expect(200, { status: "ok" });
  });
});
