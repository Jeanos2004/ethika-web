import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { PrismaService } from "../src/prisma/prisma.service";
import type { UsersService } from "../src/modules/auth/users.service";
import { agentSession, cleanup, createApp, KEY } from "./helpers";

/*
 * Paiements des devis avec le prestataire simulé (PAYMENT_PROVIDER=mock) :
 * lien sécurisé, page publique par jeton, redirection, acompte puis solde, confirmation de la demande, idempotence.
 */
describe("Paiements (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let users: UsersService;
  let session: string;
  const api = () => request(app.getHttpServer());
  const bo = (r: request.Test) => r.set("x-internal-key", KEY).set("x-session-token", session);
  const site = (r: request.Test) => r.set("x-internal-key", KEY);

  beforeAll(async () => {
    ({ app, prisma, users } = await createApp({ PAYMENT_PROVIDER: "mock" }));
    ({ session } = await agentSession(app, users));
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  async function quote() {
    const lead = await site(api().post("/v1/leads"))
      .send({ type: "contact", fullName: "E2E Paiement Client", phone: "+224 620 00 00 00", email: "paiement@e2e.example.com", consent: true, message: "Je souhaite régler mon voyage." })
      .expect(201);
    const q = await bo(api().post(`/v1/leads/${lead.body.reference}/quotes`))
      .send({ currency: "GNF", validUntil: "2030-01-01", lines: [{ label: "Circuit Fouta 4 jours", quantity: 2, unitAmount: 1_500_000 }] })
      .expect(201);
    return { ref: lead.body.reference as string, number: q.body.number as string };
  }

  const tokenOf = (link: string) => new URL(link).searchParams.get("t")!;
  const refOf = (link: string) => new URL(link).pathname.split("/").pop()!;

  it("acompte puis solde : la demande est confirmée une fois le devis soldé, chaque notification ne compte qu'une fois", async () => {
    const { ref, number } = await quote();
    await api().post(`/v1/quotes/${number}/payments`).set("x-internal-key", KEY).send({}).expect(401);
    await bo(api().post(`/v1/quotes/${number}/payments`)).send({ amount: 9_000_000 }).expect(400);

    // Acompte
    const deposit = await bo(api().post(`/v1/quotes/${number}/payments`)).send({ amount: 1_000_000 }).expect(201);
    expect(deposit.body.payment).toMatchObject({ amount: "1000000", currency: "GNF", status: "pending" });
    expect(deposit.body.payment).not.toHaveProperty("tokenHash");
    expect(deposit.body.link).toMatch(/\/paiement\/PAY-[A-Z0-9]{6}\?t=/);
    const dRef = refOf(deposit.body.link);
    const dToken = tokenOf(deposit.body.link);

    await site(api().post(`/v1/public/payments/${dRef}`)).send({ token: "x".repeat(43) }).expect(404);
    const view = await site(api().post(`/v1/public/payments/${dRef}`)).send({ token: dToken }).expect(200);
    expect(view.body).toMatchObject({ reference: dRef, amount: "1000000", status: "pending", leadReference: ref, firstName: "E2E" });
    const checkout = await site(api().post(`/v1/public/payments/${dRef}/checkout`)).send({ token: dToken }).expect(200);
    expect(checkout.body.checkoutUrl).toMatch(new RegExp(`/paiement/${dRef}/simulation\\?t=`));

    await site(api().post(`/v1/public/payments/${dRef}/receipt`)).send({ token: dToken }).expect(409);
    await site(api().post(`/v1/public/payments/${dRef}/simulate`)).send({ token: dToken, outcome: "paid" }).expect(200);
    expect(await prisma.emailOutbox.count({ where: { template: "receipt", to: "paiement@e2e.example.com" } })).toBe(1);
    if (process.env.CHROME_PATH) {
      const pdf = await site(api().post(`/v1/public/payments/${dRef}/receipt`)).send({ token: dToken }).buffer(true).parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      }).expect(200);
      expect(pdf.headers["content-type"]).toBe("application/pdf");
      expect((pdf.body as Buffer).subarray(0, 4).toString()).toBe("%PDF");
    }
    const again = await site(api().post(`/v1/public/payments/${dRef}/simulate`)).send({ token: dToken, outcome: "failed" }).expect(200);
    expect(again.body.changed).toBe(false);
    let lead = await bo(api().get(`/v1/leads/${ref}`)).expect(200);
    expect(lead.body.status).toBe("new");
    expect(lead.body.events.map((e: { kind: string }) => e.kind)).toEqual(expect.arrayContaining(["payment_requested", "payment_received"]));

    // Solde : le montant par défaut est le reste dû
    const balance = await bo(api().post(`/v1/quotes/${number}/payments`)).send({}).expect(201);
    expect(balance.body.payment.amount).toBe("2000000");
    await site(api().post(`/v1/public/payments/${refOf(balance.body.link)}/simulate`)).send({ token: tokenOf(balance.body.link), outcome: "paid" }).expect(200);
    lead = await bo(api().get(`/v1/leads/${ref}`)).expect(200);
    expect(lead.body.status).toBe("confirmed");
    await bo(api().post(`/v1/quotes/${number}/payments`)).send({}).expect(409);

    const list = await bo(api().get(`/v1/payments?leadRef=${ref}`)).expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body.every((p: { status: string }) => p.status === "paid")).toBe(true);
  });

  it("annulation, lien renouvelé (l'ancien ne fonctionne plus), échec de paiement", async () => {
    const { number } = await quote();
    const first = await bo(api().post(`/v1/quotes/${number}/payments`)).send({}).expect(201);
    const renewed = await bo(api().post(`/v1/payments/${first.body.payment.id}/renew`)).expect(200);
    await site(api().post(`/v1/public/payments/${refOf(first.body.link)}`)).send({ token: tokenOf(first.body.link) }).expect(404);
    await site(api().post(`/v1/public/payments/${refOf(renewed.body.link)}`)).send({ token: tokenOf(renewed.body.link) }).expect(200);

    const failed = await site(api().post(`/v1/public/payments/${refOf(renewed.body.link)}/simulate`)).send({ token: tokenOf(renewed.body.link), outcome: "failed" }).expect(200);
    expect(failed.body.status).toBe("failed");
    await site(api().post(`/v1/public/payments/${refOf(renewed.body.link)}/checkout`)).send({ token: tokenOf(renewed.body.link) }).expect(409);

    const second = await bo(api().post(`/v1/quotes/${number}/payments`)).send({}).expect(201);
    await bo(api().post(`/v1/payments/${second.body.payment.id}/cancel`)).expect(200);
    await bo(api().post(`/v1/payments/${second.body.payment.id}/cancel`)).expect(409);
  });
});
