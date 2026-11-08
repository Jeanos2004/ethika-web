import { AmadeusFlightProvider, mapAmadeusOffer, mapAmadeusOrder } from "./amadeus.provider";
import { ProviderError } from "./flight-provider";

const offer = (id: string, total: string, instant = false) => ({
  type: "flight-offer",
  id,
  instantTicketingRequired: instant,
  lastTicketingDate: "2030-01-05",
  validatingAirlineCodes: ["AF"],
  price: { currency: "EUR", total, grandTotal: total },
  itineraries: [
    {
      duration: "PT7H35M",
      segments: [{ departure: { iataCode: "CKY", at: "2030-01-10T23:10:00" }, arrival: { iataCode: "CDG", at: "2030-01-11T06:45:00" }, carrierCode: "AF", number: "717" }],
    },
  ],
  travelerPricings: [{ travelerType: "ADULT", fareDetailsBySegment: [{ includedCheckedBags: { quantity: 1 } }] }],
});

const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const noSleep = async () => undefined;
const config = { baseUrl: "https://amadeus.test", clientId: "id", clientSecret: "secret", timeoutMs: 5000 };
const q = { slices: [{ origin: "CKY", destination: "CDG", date: "2030-01-10" }], passengers: { adults: 2, children: 1, infants: 1 }, cabin: "eco" as const };

/** Faux serveur Amadeus : jeton, recherche, prix, commande. */
function fakeAmadeus(overrides: Partial<Record<string, (init: RequestInit) => Response>> = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const path = url.replace(config.baseUrl, "").split("?")[0]!;
    const route = Object.keys(overrides).find((k) => path.startsWith(k));
    if (route) return overrides[route]!(init);
    if (path === "/v1/security/oauth2/token") return json(200, { access_token: "tok", expires_in: 1799 });
    if (path === "/v2/shopping/flight-offers") return json(200, { data: [offer("2", "900.00"), offer("1", "812.40"), offer("3", "700.00", true)], dictionaries: { carriers: { AF: "AIR FRANCE" } } });
    if (path === "/v1/shopping/flight-offers/pricing") return json(200, { data: { flightOffers: [offer("1", "815.10")] } });
    if (path === "/v1/booking/flight-orders") return json(201, { data: { id: "eJzTd9f3", associatedRecords: [{ reference: "QWERTY" }], flightOffers: [offer("1", "815.10")], ticketingAgreement: { option: "DELAY_TO_QUEUE", dateTime: "2030-01-05T00:00:00" } } });
    if (path.startsWith("/v1/booking/flight-orders/")) return init.method === "DELETE" ? json(204) : json(200, { data: { id: "eJzTd9f3", associatedRecords: [{ reference: "QWERTY" }], flightOffers: [offer("1", "815.10")], tickets: [] } });
    return json(404, {});
  };
  return { calls, provider: new AmadeusFlightProvider(config, fetchImpl, noSleep) };
}

describe("AmadeusFlightProvider", () => {
  it("convertit une offre Amadeus (compagnie, trajet, durée, option possible)", () => {
    const o = mapAmadeusOffer("am_x_1", offer("1", "812.40"), { AF: "AIR FRANCE" });
    expect(o).toMatchObject({ id: "am_x_1", totalAmount: "812.40", currency: "EUR", owner: { iata: "AF", name: "AIR FRANCE" }, holdable: true, payBefore: "2030-01-05" });
    expect(o.slices[0]).toMatchObject({ origin: "CKY", destination: "CDG", durationMinutes: 455, stops: 0 });
    expect(mapAmadeusOffer("x", offer("1", "1", true), {}).holdable).toBe(false);
  });

  it("recherche : un seul jeton, requête au format Amadeus, offres triées par prix", async () => {
    const { calls, provider } = fakeAmadeus();
    const offers = await provider.search(q);
    expect(offers.map((o) => o.totalAmount)).toEqual(["700.00", "812.40", "900.00"]);
    expect(offers.every((o) => /^am_[a-f0-9]{8}_\d+$/.test(o.id))).toBe(true);

    const tokenCall = calls[0]!;
    expect(tokenCall.url).toBe("https://amadeus.test/v1/security/oauth2/token");
    expect(String(tokenCall.init.body)).toContain("grant_type=client_credentials");
    const body = JSON.parse(String(calls[1]!.init.body));
    expect(body.travelers.map((t: { travelerType: string }) => t.travelerType)).toEqual(["ADULT", "ADULT", "CHILD", "HELD_INFANT"]);
    expect(body.travelers[3].associatedAdultId).toBe("1");
    expect(body.searchCriteria.flightFilters.cabinRestrictions[0].cabin).toBe("ECONOMY");
    expect((calls[1]!.init.headers as Record<string, string>).authorization).toBe("Bearer tok");
    expect(calls[1]!.init.redirect).toBe("error");
    expect((calls[1]!.init.headers as Record<string, string>)["x-http-method-override"]).toBe("GET");

    await provider.search(q);
    expect(calls.filter((c) => c.url.endsWith("/oauth2/token"))).toHaveLength(1);
  });

  it("partage une seule demande de jeton entre des appels simultanés", async () => {
    const { calls, provider } = fakeAmadeus();
    await Promise.all([provider.search(q), provider.search(q), provider.search(q)]);
    expect(calls.filter((c) => c.url.endsWith("/oauth2/token"))).toHaveLength(1);
  });

  it("prix : renvoie l'offre complète à Amadeus et retient le prix confirmé", async () => {
    const { calls, provider } = fakeAmadeus();
    const [, offer1] = await provider.search(q);
    const priced = await provider.price(offer1!.id);
    expect(priced.totalAmount).toBe("815.10");
    expect(priced.baggage).toBe("1 bagage(s) en soute");
    const sent = JSON.parse(String(calls.at(-1)!.init.body));
    expect(sent.data.flightOffers[0].id).toBe("1");
    expect((calls.at(-1)!.init.headers as Record<string, string>)["x-http-method-override"]).toBe("GET");
  });

  it("réservation : émission différée, noms en capitales, téléphone découpé ; consultation et annulation", async () => {
    const { calls, provider } = fakeAmadeus();
    const offers = await provider.search(q);
    const holdable = offers.find((o) => o.holdable)!;
    const booking = await provider.book(holdable.id, [{ type: "adult", title: "mrs", givenName: "Aminata", familyName: "Diallo", bornOn: "1990-04-12", gender: "f", email: "a@example.com", phone: "+224620000000" }]);
    expect(booking).toMatchObject({ id: "eJzTd9f3", status: "held", bookingReference: "QWERTY", payBefore: "2030-01-05T00:00:00" });
    const sent = JSON.parse(String(calls.at(-1)!.init.body));
    expect(sent.data.ticketingAgreement.option).toBe("DELAY_TO_QUEUE");
    expect(sent.data.travelers[0]).toMatchObject({ gender: "FEMALE", name: { firstName: "AMINATA", lastName: "DIALLO" }, contact: { phones: [{ countryCallingCode: "224", number: "620000000" }] } });

    expect((await provider.getOrder("eJzTd9f3")).bookingReference).toBe("QWERTY");
    await provider.cancel("eJzTd9f3");
    expect(calls.at(-1)!.init.method).toBe("DELETE");
  });

  it("refuse l'option sur une offre à émission immédiate et une offre inconnue", async () => {
    const { provider } = fakeAmadeus();
    const offers = await provider.search(q);
    const instant = offers.find((o) => !o.holdable)!;
    const pax = [{ type: "adult" as const, title: "mr" as const, givenName: "A", familyName: "B", bornOn: "1990-01-01", gender: "m" as const, email: "a@example.com", phone: "+224620000000" }];
    await expect(provider.book(instant.id, pax)).rejects.toMatchObject({ code: "offer_not_holdable" });
    await expect(provider.price("am_inconnu_1")).rejects.toMatchObject({ status: 404 });
  });

  it("redemande un jeton après un 401, reprend sur 503, s'arrête sur une erreur définitive", async () => {
    let searches = 0;
    const { calls, provider } = fakeAmadeus({
      "/v2/shopping/flight-offers": () => {
        searches++;
        if (searches === 1) return json(401, {});
        if (searches === 2) return json(503, {});
        return json(200, { data: [offer("1", "10.00")], dictionaries: {} });
      },
    });
    await expect(provider.search(q)).resolves.toHaveLength(1);
    expect(calls.filter((c) => c.url.endsWith("/oauth2/token"))).toHaveLength(2);

    const { provider: p2 } = fakeAmadeus({ "/v2/shopping/flight-offers": () => json(400, { errors: [{ code: 477, title: "INVALID FORMAT", detail: "Aminata Diallo" }] }) });
    const err = await p2.search(q).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect((err as ProviderError).message).toBe("Amadeus HTTP 400 [477 INVALID FORMAT]");
  });

  it("convertit une commande émise en statut confirmé", () => {
    expect(mapAmadeusOrder({ id: "x", associatedRecords: [{ reference: "ABC123" }], tickets: [{ documentNumber: "057" }], flightOffers: [offer("1", "1.00")] }).status).toBe("confirmed");
  });
});
