import { config as loadDotenv } from "dotenv";
import { DuffelFlightProvider } from "../src/modules/flights/duffel.provider";
import type { FlightOffer } from "../src/modules/flights/flight-provider";

/*
 * Adaptateur Duffel contre le VRAI bac à sable Duffel (jeton duffel_test_…, aucun paiement réel).
 * Opt-in uniquement : DUFFEL_LIVE=1 pnpm --filter @ethnika/api exec jest --config test/jest-e2e.json duffel.live
 * Jamais en CI (dépend du réseau et d'une clé).
 */
loadDotenv({ quiet: true });
const live = process.env.DUFFEL_LIVE === "1" && /^duffel_test_/.test(process.env.DUFFEL_TOKEN ?? "");
const d = live ? describe : describe.skip;

d("Duffel (bac à sable, live)", () => {
  jest.setTimeout(90_000);
  const provider = new DuffelFlightProvider(process.env.DUFFEL_TOKEN ?? "");
  const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  let offers: FlightOffer[] = [];

  it("recherche des offres Conakry → Paris aller-retour", async () => {
    offers = await provider.search({
      slices: [
        { origin: "CKY", destination: "CDG", date: inDays(45) },
        { origin: "CDG", destination: "CKY", date: inDays(55) },
      ],
      passengers: { adults: 1, children: 0, infants: 0 },
      cabin: "eco",
    });
    console.info(`${offers.length} offres ; moins chère : ${offers[0]?.totalAmount} ${offers[0]?.currency} (${offers[0]?.owner.name})`);
    expect(offers.length).toBeGreaterThan(0);
    const first = offers[0]!;
    expect(Number(first.totalAmount)).toBeGreaterThan(0);
    expect(first.slices).toHaveLength(2);
    expect(first.slices[0]?.origin).toBe("CKY");
    expect(first.slices[0]?.segments.length).toBeGreaterThan(0);
    // Triées par prix croissant.
    expect(Number(offers[0]!.totalAmount)).toBeLessThanOrEqual(Number(offers.at(-1)!.totalAmount));
  });

  it("obtient le prix et les conditions d'une offre", async () => {
    const priced = await provider.price(offers[0]!.id);
    console.info(`prix confirmé : ${priced.totalAmount} ${priced.currency} · remboursable : ${priced.conditions.refundable} · modifiable : ${priced.conditions.changeable} · bagage : ${priced.baggage}`);
    expect(priced.id).toBe(offers[0]!.id);
  });

  it("pose une option (hold) sans paiement, la consulte puis l'annule", async () => {
    const holdable = offers.find((o) => o.holdable);
    console.info(`${offers.filter((o) => o.holdable).length} offres sur ${offers.length} acceptent une option`);
    if (!holdable) return; // le bac à sable ne propose pas toujours d'offre « hold »
    const booking = await provider.book(holdable.id, [
      { type: "adult", title: "mrs", givenName: "Aminata", familyName: "Diallo", bornOn: "1990-04-12", gender: "f", email: "aminata@example.com", phone: "+224620000000" },
    ]);
    console.info(`option posée : PNR ${booking.bookingReference}, statut ${booking.status}, à payer avant ${booking.payBefore}`);
    expect(booking.status).toBe("held");
    expect(booking.bookingReference).toBeTruthy();

    const fetched = await provider.getOrder(booking.id);
    expect(fetched.bookingReference).toBe(booking.bookingReference);

    await provider.cancel(booking.id);
    const cancelled = await provider.getOrder(booking.id);
    console.info(`après annulation : statut ${cancelled.status}`);
    expect(cancelled.status).toBe("cancelled");
  });

  it("refuse proprement une option sur une offre à paiement immédiat", async () => {
    const instant = offers.find((o) => !o.holdable);
    if (!instant) return;
    await expect(provider.book(instant.id, [{ type: "adult", title: "mr", givenName: "Test", familyName: "Ethnika", bornOn: "1985-01-01", gender: "m", email: "t@example.com", phone: "+224620000000" }])).rejects.toMatchObject({
      code: "offer_not_holdable",
    });
  });
});
