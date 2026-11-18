import { config as loadDotenv } from "dotenv";
import { AmadeusFlightProvider } from "../src/modules/flights/amadeus.provider";
import type { FlightOffer, PricedOffer } from "../src/modules/flights/flight-provider";

/*
 * Adaptateur Amadeus contre un VRAI serveur (opt-in, jamais en CI) :
 *   AMADEUS_LIVE=1 pnpm --filter @ethnika/api exec jest --config test/jest-e2e.json amadeus.live
 * Par défaut : bac à sable simulé Beeceptor (https://amadeus-api.mock.beeceptor.com). Ses données sont ALÉATOIRES
 * (routes, devises, dates sans rapport avec la recherche) et ses réponses lentes : on vérifie le format et le parcours,
 * pas les valeurs. Pour des données réalistes : AMADEUS_BASE_URL=https://test.api.amadeus.com + clés developers.amadeus.com.
 */
loadDotenv({ quiet: true });
const live = process.env.AMADEUS_LIVE === "1";
const d = live ? describe : describe.skip;
const baseUrl = process.env.AMADEUS_BASE_URL && process.env.FLIGHT_PROVIDER === "amadeus" ? process.env.AMADEUS_BASE_URL : "https://amadeus-api.mock.beeceptor.com";

d(`Amadeus live (${baseUrl})`, () => {
  jest.setTimeout(600_000);
  const provider = new AmadeusFlightProvider({
    baseUrl,
    clientId: process.env.AMADEUS_CLIENT_ID || "sandbox",
    clientSecret: process.env.AMADEUS_CLIENT_SECRET || "sandbox",
    timeoutMs: Number(process.env.AMADEUS_TIMEOUT_MS) || 150_000,
  });
  const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  let offers: FlightOffer[] = [];

  it("obtient un jeton et recherche des offres au format Amadeus", async () => {
    const t = Date.now();
    offers = await provider.search({ slices: [{ origin: "CKY", destination: "CDG", date: inDays(45) }], passengers: { adults: 1, children: 0, infants: 0 }, cabin: "eco" });
    console.info(`${offers.length} offres en ${Math.round((Date.now() - t) / 1000)} s ; option possible sur ${offers.filter((o) => o.holdable).length}`);
    for (const o of offers.slice(0, 3)) console.info(`  ${o.slices[0]?.origin} → ${o.slices[0]?.destination} · ${o.totalAmount} ${o.currency} · ${o.owner.iata} · option : ${o.holdable}`);
    expect(offers.length).toBeGreaterThan(0);
    for (const o of offers) {
      expect(o.id).toMatch(/^am_[a-f0-9]{8}_/);
      expect(Number.isFinite(Number(o.totalAmount))).toBe(true);
      expect(o.slices.length).toBeGreaterThan(0);
    }
  });

  it("confirme le prix d'une offre (offre complète renvoyée à Amadeus)", async () => {
    const priced: PricedOffer | Error = await provider.price(offers[0]!.id).catch((e: unknown) => (e instanceof Error ? e : new Error(String(e))));
    // Beeceptor génère des offres aléatoires que son propre schéma de prix refuse parfois (ex. 477 : pricingOptions.fareType
    // autre que PUBLISHED). L'offre doit être renvoyée telle quelle à Amadeus : un refus 4xx documenté est donc acceptable ici.
    if (priced instanceof Error) {
      console.info(`prix : refusé par le serveur (${priced.message})`);
      expect(priced.message).toMatch(/Amadeus HTTP 4\d\d/);
    } else {
      console.info(`prix confirmé : ${priced.totalAmount} ${priced.currency} · bagage : ${priced.baggage}`);
      expect(priced.id).toBe(offers[0]!.id);
    }
  });

  it("pose une option si une offre le permet, la consulte puis l'annule", async () => {
    const holdable = offers.find((o) => o.holdable);
    if (!holdable) {
      console.info("aucune offre sans émission immédiate dans ce tirage aléatoire : réservation non testée");
      return;
    }
    const booking = await provider.book(holdable.id, [
      { type: "adult", title: "mrs", givenName: "Aminata", familyName: "Diallo", bornOn: "1990-04-12", gender: "f", email: "aminata@example.com", phone: "+224620000000" },
    ]);
    console.info(`commande : PNR ${booking.bookingReference}, statut ${booking.status}, échéance ${booking.payBefore}`);
    expect(booking.id).toBeTruthy();
    expect(booking.bookingReference).toBeTruthy();
    const fetched = await provider.getOrder(booking.id);
    expect(fetched.id).toBeTruthy();
    await expect(provider.cancel(booking.id)).resolves.toBeUndefined();
  });
});
