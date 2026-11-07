import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { PrismaService } from "../src/prisma/prisma.service";
import type { UsersService } from "../src/modules/auth/users.service";
import { FlightBookingsService } from "../src/modules/flights/flight-bookings.service";
import { agentSession, cleanup, createApp, KEY } from "./helpers";

/* Options de vol (fournisseur fictif) : enregistrement, rattachement à la demande, suivi, annulation, échéances. */
describe("Options de vol (e2e, fournisseur fictif)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let users: UsersService;
  let session: string;
  let ref: string;
  const api = () => request(app.getHttpServer());
  const bo = (r: request.Test) => r.set("x-internal-key", KEY).set("x-session-token", session);
  const pax = [{ type: "adult", title: "ms", givenName: "Aminata", familyName: "Diallo", bornOn: "1990-01-01", gender: "f", email: "a@example.com", phone: "+224620000000" }];
  const search = () =>
    api()
      .post("/v1/flights/search")
      .set("x-internal-key", KEY)
      .send({ slices: [{ origin: "CKY", destination: "CDG", date: "2030-02-10" }], passengers: { adults: 1, children: 0, infants: 0 }, cabin: "eco" })
      .expect(200);

  beforeAll(async () => {
    ({ app, prisma, users } = await createApp({ AGENCY_NOTIFY_EMAIL: "agence@example.com" }));
    ({ session } = await agentSession(app, users));
    const lead = await api()
      .post("/v1/leads")
      .set("x-internal-key", KEY)
      .send({ type: "billet", fullName: "E2E Vol", phone: "+224 620 00 00 02", email: "vol@example.com", consent: true, trip: "ow", from: "CKY", to: "CDG", departDate: "2030-02-10", adults: 1, children: 0, infants: 0, cabin: "eco" })
      .expect(201);
    ref = lead.body.reference;
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  it("les offres indiquent si une option est possible", async () => {
    const res = await search();
    expect(res.body.offers.some((o: { holdable: boolean }) => o.holdable)).toBe(true);
    expect(res.body.offers.some((o: { holdable: boolean }) => !o.holdable)).toBe(true);
  });

  it("pose une option rattachée à la demande, sans stocker les passagers, puis l'annule", async () => {
    const offer = (await search()).body.offers.find((o: { holdable: boolean }) => o.holdable);
    const booking = await bo(api().post("/v1/flights/orders")).send({ offerId: offer.id, passengers: pax, leadRef: ref }).expect(201);
    expect(booking.body).toMatchObject({ status: "held", provider: "mock", passengerCount: 1 });
    expect(JSON.stringify(booking.body)).not.toContain("Aminata");
    expect(booking.body.itinerary.slices[0]).toMatchObject({ origin: "CKY", destination: "CDG" });

    const lead = await bo(api().get(`/v1/leads/${ref}`)).expect(200);
    expect(lead.body.events.map((e: { kind: string }) => e.kind)).toContain("flight_hold");

    const list = await bo(api().get("/v1/flights/bookings").query({ leadRef: ref })).expect(200);
    expect(list.body).toHaveLength(1);
    await bo(api().get(`/v1/flights/bookings/${booking.body.id}`)).expect(200);

    const cancelled = await bo(api().post(`/v1/flights/bookings/${booking.body.id}/cancel`)).expect(200);
    expect(cancelled.body.status).toBe("cancelled");
    expect(await prisma.auditLog.count({ where: { target: booking.body.id } })).toBe(2);
  });

  it("refuse une option sur une offre à paiement immédiat, avec un code explicite", async () => {
    const offer = (await search()).body.offers.find((o: { holdable: boolean }) => !o.holdable);
    const res = await bo(api().post("/v1/flights/orders")).send({ offerId: offer.id, passengers: pax }).expect(422);
    expect(res.body.error).toBe("offer_not_holdable");
  });

  it("refuse une demande inconnue et un accès sans session", async () => {
    const offer = (await search()).body.offers.find((o: { holdable: boolean }) => o.holdable);
    await bo(api().post("/v1/flights/orders")).send({ offerId: offer.id, passengers: pax, leadRef: "ETH-ZZZZZZ" }).expect(404);
    await api().get("/v1/flights/bookings").set("x-internal-key", KEY).expect(401);
  });

  it("alerte l'agence une seule fois quand l'échéance de paiement approche", async () => {
    const offer = (await search()).body.offers.find((o: { holdable: boolean }) => o.holdable);
    const booking = await bo(api().post("/v1/flights/orders")).send({ offerId: offer.id, passengers: pax }).expect(201);
    await prisma.flightBooking.update({ where: { id: booking.body.id }, data: { payBefore: new Date(Date.now() + 3 * 3600_000) } });
    const service = app.get(FlightBookingsService);
    expect(await service.alertDeadlines()).toBe(1);
    expect(await service.alertDeadlines()).toBe(0);
    expect(await prisma.emailOutbox.count({ where: { to: "agence@example.com", template: "agency" } })).toBeGreaterThanOrEqual(1);
  });
});
