import { NotFoundException } from "@nestjs/common";
import { FlightsService } from "./flights.service";
import { MockFlightProvider } from "./mock.provider";

const q = { slices: [{ origin: "CKY", destination: "CDG", date: "2030-01-10" }], passengers: { adults: 1, children: 0, infants: 0 }, cabin: "eco" as const };

describe("FlightsService (fournisseur fictif)", () => {
  it("recherche, met en cache, prix et option sans émission", async () => {
    const s = new FlightsService(new MockFlightProvider());
    const first = await s.search(q);
    expect(first.cached).toBe(false);
    expect(first.offers).toHaveLength(3);
    expect((await s.search(q)).cached).toBe(true);

    const offer = first.offers[0]!;
    const priced = await s.price(offer.id);
    expect(priced.conditions).toBeDefined();

    const booking = await s.hold(offer.id, [{ type: "adult", title: "ms", givenName: "Aminata", familyName: "Diallo", bornOn: "1990-01-01", gender: "f", email: "a@example.com", phone: "+224620000000" }]);
    expect(booking.status).toBe("held");
    await s.cancel(booking.id);
    expect((await s.getOrder(booking.id)).status).toBe("cancelled");
  });

  it("traduit une offre inconnue en 404 générique", async () => {
    const s = new FlightsService(new MockFlightProvider());
    await expect(s.price("inconnue")).rejects.toBeInstanceOf(NotFoundException);
  });
});
