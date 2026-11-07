import { DuffelFlightProvider, mapOffer } from "./duffel.provider";
import { ProviderError } from "./flight-provider";

const offerJson = {
  id: "off_123",
  total_amount: "812.40",
  total_currency: "EUR",
  expires_at: "2030-01-01T10:00:00Z",
  owner: { iata_code: "AF", name: "Air France" },
  slices: [
    {
      origin: { iata_code: "CKY" },
      destination: { iata_code: "CDG" },
      duration: "PT7H35M",
      segments: [
        { marketing_carrier: { iata_code: "AF", name: "Air France" }, marketing_carrier_flight_number: "717", origin: { iata_code: "CKY" }, destination: { iata_code: "CDG" }, departing_at: "2030-01-10T23:10:00", arriving_at: "2030-01-11T06:45:00" },
      ],
    },
  ],
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const noSleep = async () => undefined;

describe("DuffelFlightProvider", () => {
  it("convertit une offre Duffel", () => {
    const o = mapOffer(offerJson);
    expect(o).toMatchObject({ id: "off_123", totalAmount: "812.40", currency: "EUR", owner: { iata: "AF" } });
    expect(o.slices[0]).toMatchObject({ origin: "CKY", destination: "CDG", durationMinutes: 455, stops: 0 });
    expect(o.slices[0]?.segments[0]?.flightNumber).toBe("AF717");
  });

  it("envoie une demande d'offres conforme et trie par prix", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return json(201, { data: { offers: [{ ...offerJson, id: "off_b", total_amount: "900.00" }, offerJson] } });
    };
    const p = new DuffelFlightProvider("duffel_test_x", fetchImpl, noSleep);
    const offers = await p.search({ slices: [{ origin: "CKY", destination: "CDG", date: "2030-01-10" }], passengers: { adults: 2, children: 1, infants: 1 }, cabin: "eco" });
    expect(offers.map((o) => o.id)).toEqual(["off_123", "off_b"]);
    const body = JSON.parse(String(calls[0]?.init.body));
    expect(body.data.cabin_class).toBe("economy");
    expect(body.data.passengers).toEqual([{ type: "adult" }, { type: "adult" }, { age: 8 }, { type: "infant_without_seat" }]);
    expect((calls[0]?.init.headers as Record<string, string>)["duffel-version"]).toBe("v2");
    expect(calls[0]?.init.redirect).toBe("error");
  });

  it("reprend sur 503 puis réussit", async () => {
    let n = 0;
    const fetchImpl = async () => (++n < 3 ? json(503, {}) : json(200, { data: offerJson }));
    const p = new DuffelFlightProvider("duffel_test_x", fetchImpl, noSleep);
    await expect(p.price("off_123")).resolves.toMatchObject({ id: "off_123" });
    expect(n).toBe(3);
  });

  it("ne reprend pas une erreur définitive", async () => {
    let n = 0;
    const fetchImpl = async () => {
      n++;
      return json(422, { errors: [] });
    };
    const p = new DuffelFlightProvider("duffel_test_x", fetchImpl, noSleep);
    await expect(p.price("off_123")).rejects.toBeInstanceOf(ProviderError);
    expect(n).toBe(1);
  });
});
