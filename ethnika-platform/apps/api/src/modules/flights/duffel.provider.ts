import { Logger } from "@nestjs/common";
import type { Booking, Cabin, FlightOffer, FlightProvider, FlightSearch, Passenger, PricedOffer } from "./flight-provider";
import { ProviderError } from "./flight-provider";

/*
 * Adaptateur Duffel (API v2, https://duffel.com/docs/api). Commencer avec un jeton duffel_test_… (données fictives).
 * - Timeouts, reprises à backoff exponentiel sur 429/5xx/réseau, jamais de redirection suivie.
 * - Journal sans donnée personnelle (méthode, chemin, statut, durée).
 * - Réservation = commande « hold » : ni paiement ni émission, l'agent valide ensuite.
 */

const BASE = "https://api.duffel.com";
const TIMEOUT_MS = 20_000;
const RETRIES = 3;
const cabinMap: Record<Cabin, string> = { eco: "economy", business: "business", first: "first" };

type Json = Record<string, unknown>;
type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export class DuffelFlightProvider implements FlightProvider {
  readonly name = "duffel";
  private readonly logger = new Logger("Duffel");

  constructor(
    private readonly token: string,
    private readonly fetchImpl: FetchLike = fetch,
    private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  async search(q: FlightSearch): Promise<FlightOffer[]> {
    const passengers = [
      ...Array.from({ length: q.passengers.adults }, () => ({ type: "adult" })),
      ...Array.from({ length: q.passengers.children }, () => ({ age: 8 })),
      ...Array.from({ length: q.passengers.infants }, () => ({ type: "infant_without_seat" })),
    ];
    const res = await this.request<{ data: { offers: Json[] } }>("POST", "/air/offer_requests?return_offers=true&supplier_timeout=15000", {
      data: { slices: q.slices.map((s) => ({ origin: s.origin, destination: s.destination, departure_date: s.date })), passengers, cabin_class: cabinMap[q.cabin] },
    });
    return (res.data.offers ?? [])
      .slice(0, 50)
      .map(mapOffer)
      .sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount));
  }

  async price(offerId: string): Promise<PricedOffer> {
    const res = await this.request<{ data: Json }>("GET", `/air/offers/${encodeURIComponent(offerId)}?return_available_services=false`);
    const offer = mapOffer(res.data);
    const conditions = (res.data.conditions ?? {}) as { refund_before_departure?: { allowed?: boolean } | null; change_before_departure?: { allowed?: boolean } | null };
    const firstPax = ((res.data.slices as Json[] | undefined)?.[0]?.segments as Json[] | undefined)?.[0]?.passengers as Json[] | undefined;
    const bags = (firstPax?.[0]?.baggages as { type: string; quantity: number }[] | undefined) ?? [];
    const checked = bags.find((b) => b.type === "checked");
    return {
      ...offer,
      conditions: { refundable: conditions.refund_before_departure?.allowed ?? null, changeable: conditions.change_before_departure?.allowed ?? null },
      baggage: checked ? `${checked.quantity} bagage(s) en soute` : null,
    };
  }

  async book(offerId: string, passengers: Passenger[]): Promise<Booking> {
    // Les identifiants de passagers viennent de l'offre : on les associe dans l'ordre.
    const offer = await this.request<{ data: Json }>("GET", `/air/offers/${encodeURIComponent(offerId)}`);
    const offerPax = (offer.data.passengers as { id: string }[] | undefined) ?? [];
    if (offerPax.length !== passengers.length) throw new ProviderError("nombre de passagers différent de l'offre", 422, false);
    const res = await this.request<{ data: Json }>("POST", "/air/orders", {
      data: {
        type: "hold",
        selected_offers: [offerId],
        passengers: passengers.map((p, i) => ({
          id: offerPax[i]?.id,
          title: p.title,
          given_name: p.givenName,
          family_name: p.familyName,
          born_on: p.bornOn,
          gender: p.gender,
          email: p.email,
          phone_number: p.phone,
        })),
      },
    });
    return mapOrder(res.data);
  }

  async getOrder(id: string): Promise<Booking> {
    const res = await this.request<{ data: Json }>("GET", `/air/orders/${encodeURIComponent(id)}`);
    return mapOrder(res.data);
  }

  async cancel(id: string): Promise<void> {
    const created = await this.request<{ data: { id: string } }>("POST", "/air/order_cancellations", { data: { order_id: id } });
    await this.request("POST", `/air/order_cancellations/${encodeURIComponent(created.data.id)}/actions/confirm`);
  }

  /** Appel HTTP avec délai, reprises sur erreurs transitoires et journal sans donnée personnelle. */
  private async request<T = unknown>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    let lastError: ProviderError | undefined;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      const started = Date.now();
      try {
        const res = await this.fetchImpl(`${BASE}${path}`, {
          method,
          headers: { authorization: `Bearer ${this.token}`, "duffel-version": "v2", accept: "application/json", "content-type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
          redirect: "error",
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        this.logger.log(`${method} ${path.split("?")[0]?.replace(/\/(off|ord|orq|ore)_[A-Za-z0-9]+/g, "/:id")} → ${res.status} (${Date.now() - started} ms)`);
        if (res.ok) return (res.status === 204 ? undefined : await res.json()) as T;
        const retryable = res.status === 429 || res.status >= 500;
        lastError = new ProviderError(`Duffel HTTP ${res.status}`, res.status, retryable);
        if (!retryable) throw lastError;
      } catch (e) {
        if (e instanceof ProviderError && !e.retryable) throw e;
        lastError = e instanceof ProviderError ? e : new ProviderError("Duffel injoignable", 503, true);
      }
      if (attempt < RETRIES) await this.sleep(500 * 2 ** attempt + Math.floor(Math.random() * 200));
    }
    throw lastError ?? new ProviderError("Duffel injoignable", 503, true);
  }
}

function minutes(iso: unknown): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(String(iso ?? ""));
  return m ? Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

export function mapOffer(o: Json): FlightOffer {
  const owner = (o.owner ?? {}) as { iata_code?: string; name?: string };
  return {
    id: String(o.id),
    totalAmount: String(o.total_amount),
    currency: String(o.total_currency),
    owner: { iata: owner.iata_code ?? "", name: owner.name ?? "" },
    expiresAt: (o.expires_at as string | null) ?? null,
    slices: ((o.slices as Json[] | undefined) ?? []).map((s) => {
      const segments = ((s.segments as Json[] | undefined) ?? []).map((g) => {
        const carrier = (g.marketing_carrier ?? {}) as { iata_code?: string; name?: string };
        return {
          carrier: carrier.iata_code ?? "",
          carrierName: carrier.name ?? "",
          flightNumber: `${carrier.iata_code ?? ""}${String(g.marketing_carrier_flight_number ?? "")}`,
          from: String((g.origin as Json | undefined)?.iata_code ?? ""),
          to: String((g.destination as Json | undefined)?.iata_code ?? ""),
          departAt: String(g.departing_at ?? ""),
          arriveAt: String(g.arriving_at ?? ""),
        };
      });
      return {
        origin: String((s.origin as Json | undefined)?.iata_code ?? segments[0]?.from ?? ""),
        destination: String((s.destination as Json | undefined)?.iata_code ?? segments.at(-1)?.to ?? ""),
        departAt: segments[0]?.departAt ?? "",
        arriveAt: segments.at(-1)?.arriveAt ?? "",
        durationMinutes: minutes(s.duration),
        stops: Math.max(0, segments.length - 1),
        segments,
      };
    }),
  };
}

function mapOrder(o: Json): Booking {
  const payment = (o.payment_status ?? {}) as { payment_required_by?: string | null };
  const status = o.cancelled_at ? "cancelled" : o.type === "hold" && !(o.documents as unknown[] | undefined)?.length ? "held" : "confirmed";
  return {
    id: String(o.id),
    status,
    bookingReference: (o.booking_reference as string | null) ?? null,
    offerId: ((o.offer_id ?? null) as string | null) ?? null,
    totalAmount: String(o.total_amount),
    currency: String(o.total_currency),
    payBefore: payment.payment_required_by ?? null,
  };
}
