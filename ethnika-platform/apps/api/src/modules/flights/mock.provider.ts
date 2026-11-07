import { createHash } from "node:crypto";
import type { Booking, FlightOffer, FlightProvider, FlightSearch, Passenger, PricedOffer } from "./flight-provider";
import { ProviderError } from "./flight-provider";

const carriers = [
  { iata: "AF", name: "Air France" },
  { iata: "SN", name: "Brussels Airlines" },
  { iata: "TK", name: "Turkish Airlines" },
  { iata: "AT", name: "Royal Air Maroc" },
];

/**
 * Fournisseur fictif et déterministe pour le développement et les tests (FLIGHT_PROVIDER=mock).
 * Les prix sont illustratifs : ils ne doivent jamais être présentés comme des tarifs réels.
 */
export class MockFlightProvider implements FlightProvider {
  readonly name = "mock";
  private readonly offers = new Map<string, FlightOffer>();
  private readonly orders = new Map<string, Booking>();

  async search(q: FlightSearch): Promise<FlightOffer[]> {
    const seed = createHash("sha256").update(JSON.stringify(q)).digest();
    const pax = q.passengers.adults + q.passengers.children + q.passengers.infants * 0.1;
    const factor = q.cabin === "first" ? 4 : q.cabin === "business" ? 2.5 : 1;
    return carriers.slice(0, 3).map((c, i) => {
      const base = 350 + (seed[i] ?? 0) * 3;
      const offer: FlightOffer = {
        id: `mock_${seed.toString("hex").slice(0, 12)}_${i}`,
        totalAmount: (base * factor * pax * q.slices.length).toFixed(2),
        currency: "EUR",
        owner: c,
        slices: q.slices.map((s, k) => {
          const depart = new Date(`${s.date}T${String(8 + i * 3).padStart(2, "0")}:15:00Z`);
          const duration = 360 + i * 95 + k * 10;
          const arrive = new Date(depart.getTime() + duration * 60_000);
          return {
            origin: s.origin,
            destination: s.destination,
            departAt: depart.toISOString(),
            arriveAt: arrive.toISOString(),
            durationMinutes: duration,
            stops: i === 0 ? 0 : 1,
            segments: [{ carrier: c.iata, carrierName: c.name, flightNumber: `${c.iata}${700 + i * 11 + k}`, from: s.origin, to: s.destination, departAt: depart.toISOString(), arriveAt: arrive.toISOString() }],
          };
        }),
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };
      this.offers.set(offer.id, offer);
      return offer;
    });
  }

  async price(offerId: string): Promise<PricedOffer> {
    const offer = this.offers.get(offerId);
    if (!offer) throw new ProviderError("offre expirée ou inconnue", 404, false);
    return { ...offer, conditions: { refundable: false, changeable: true }, baggage: "1 × 23 kg" };
  }

  async book(offerId: string, passengers: Passenger[]): Promise<Booking> {
    const offer = this.offers.get(offerId);
    if (!offer) throw new ProviderError("offre expirée ou inconnue", 404, false);
    if (!passengers.length) throw new ProviderError("passagers manquants", 422, false);
    const id = `mock_ord_${this.orders.size + 1}`;
    const booking: Booking = { id, status: "held", bookingReference: `MK${String(this.orders.size + 1).padStart(4, "0")}`, offerId, totalAmount: offer.totalAmount, currency: offer.currency, payBefore: new Date(Date.now() + 24 * 3600_000).toISOString() };
    this.orders.set(id, booking);
    return booking;
  }

  async getOrder(id: string): Promise<Booking> {
    const order = this.orders.get(id);
    if (!order) throw new ProviderError("commande inconnue", 404, false);
    return order;
  }

  async cancel(id: string): Promise<void> {
    const order = await this.getOrder(id);
    this.orders.set(id, { ...order, status: "cancelled" });
  }
}
