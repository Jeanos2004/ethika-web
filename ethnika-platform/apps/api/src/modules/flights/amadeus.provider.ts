import { Logger } from "@nestjs/common";
import { createHash } from "node:crypto";
import type { Booking, Cabin, FlightOffer, FlightProvider, FlightSearch, Passenger, PricedOffer } from "./flight-provider";
import { ProviderError } from "./flight-provider";

/*
 * Adaptateur Amadeus (API « Flight Offers Search / Price / Create Orders », https://developers.amadeus.com).
 * - OAuth2 client_credentials : jeton mis en cache, renouvelé 60 s avant expiration, une seule requête à la fois.
 * - Amadeus est sans état : une offre ne se retrouve pas par son identifiant. Les offres d'une recherche sont gardées
 *   30 min (leur durée de validité) et exposées sous un identifiant opaque propre à l'adaptateur.
 * - Délais configurables, reprises à backoff sur 429/5xx/réseau, taille de réponse bornée, journal sans donnée personnelle.
 * - Réservation = commande avec émission différée (DELAY_TO_QUEUE) : aucun billet émis sans un agent.
 */

type Json = Record<string, unknown>;
type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

const RETRIES = 2;
const OFFER_TTL_MS = 30 * 60_000;
const OFFER_CACHE_MAX = 2_000;
/** Une réponse de recherche légitime fait quelques centaines de Ko ; au-delà, on refuse (protection mémoire). */
const MAX_RESPONSE_BYTES = 25 * 1024 * 1024;
const cabinMap: Record<Cabin, string> = { eco: "ECONOMY", business: "BUSINESS", first: "FIRST" };

export type AmadeusConfig = { baseUrl: string; clientId: string; clientSecret: string; timeoutMs: number };

export class AmadeusFlightProvider implements FlightProvider {
  readonly name = "amadeus";
  private readonly logger = new Logger("Amadeus");
  private token?: { value: string; expiresAt: number };
  private tokenRequest?: Promise<string>;
  /** Identifiant opaque → offre Amadeus complète (nécessaire au prix et à la réservation). */
  private readonly offers = new Map<string, { offer: Json; carriers: Record<string, string>; at: number }>();

  constructor(
    private readonly config: AmadeusConfig,
    private readonly fetchImpl: FetchLike = fetch,
    private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  async search(q: FlightSearch): Promise<FlightOffer[]> {
    const travelers = [
      ...Array.from({ length: q.passengers.adults }, (_, i) => ({ id: String(i + 1), travelerType: "ADULT" })),
      ...Array.from({ length: q.passengers.children }, (_, i) => ({ id: String(q.passengers.adults + i + 1), travelerType: "CHILD" })),
      ...Array.from({ length: q.passengers.infants }, (_, i) => ({ id: String(q.passengers.adults + q.passengers.children + i + 1), travelerType: "HELD_INFANT", associatedAdultId: String(i + 1) })),
    ];
    const ids = q.slices.map((_, i) => String(i + 1));
    const res = await this.request<{ data?: Json[]; dictionaries?: { carriers?: Record<string, string> } }>("POST", "/v2/shopping/flight-offers", {
      currencyCode: "EUR",
      originDestinations: q.slices.map((s, i) => ({ id: ids[i], originLocationCode: s.origin, destinationLocationCode: s.destination, departureDateTimeRange: { date: s.date } })),
      travelers,
      sources: ["GDS"],
      searchCriteria: { maxFlightOffers: 50, flightFilters: { cabinRestrictions: [{ cabin: cabinMap[q.cabin], coverage: "MOST_SEGMENTS", originDestinationIds: ids }] } },
    },
    // Exigé par la spécification Amadeus pour la recherche en POST (sinon 400 INVALID FORMAT).
    { "x-http-method-override": "GET" });
    const carriers = res.dictionaries?.carriers ?? {};
    const searchId = createHash("sha256").update(`${Date.now()}:${Math.random()}`).digest("hex").slice(0, 8);
    this.sweep();
    return (res.data ?? [])
      .slice(0, 50)
      .map((offer) => {
        const id = `am_${searchId}_${String(offer.id ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 20)}`;
        this.offers.set(id, { offer, carriers, at: Date.now() });
        return mapAmadeusOffer(id, offer, carriers);
      })
      .sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount));
  }

  async price(offerId: string): Promise<PricedOffer> {
    const cached = this.cached(offerId);
    const res = await this.request<{ data?: { flightOffers?: Json[] } }>(
      "POST",
      "/v1/shopping/flight-offers/pricing",
      { data: { type: "flight-offers-pricing", flightOffers: [cached.offer] } },
      { "x-http-method-override": "GET" },
    );
    const priced = res.data?.flightOffers?.[0] ?? cached.offer;
    // On garde l'offre au prix confirmé : c'est elle qu'Amadeus attend à la réservation.
    this.offers.set(offerId, { ...cached, offer: priced, at: Date.now() });
    const base = mapAmadeusOffer(offerId, priced, cached.carriers);
    return { ...base, conditions: { refundable: null, changeable: null }, baggage: checkedBags(priced) };
  }

  async book(offerId: string, passengers: Passenger[]): Promise<Booking> {
    const { offer } = this.cached(offerId);
    if (offer.instantTicketingRequired === true) throw new ProviderError("offre sans option possible (émission immédiate exigée)", 422, false, "offer_not_holdable");
    const travelers = passengers.map((p, i) => {
      const phone = /^\+(\d{1,3})(\d{6,14})$/.exec(p.phone);
      return {
        id: String(i + 1),
        dateOfBirth: p.bornOn,
        gender: p.gender === "f" ? "FEMALE" : "MALE",
        name: { firstName: p.givenName.toUpperCase(), lastName: p.familyName.toUpperCase() },
        contact: { emailAddress: p.email, phones: [{ deviceType: "MOBILE", countryCallingCode: phone?.[1] ?? "224", number: phone?.[2] ?? p.phone.replace(/\D/g, "") }] },
      };
    });
    const res = await this.request<{ data?: Json }>("POST", "/v1/booking/flight-orders", {
      data: { type: "flight-order", flightOffers: [offer], travelers, ticketingAgreement: { option: "DELAY_TO_QUEUE", delay: "6D" } },
    });
    if (!res.data) throw new ProviderError("réponse de commande vide", 502, true);
    return mapAmadeusOrder(res.data, offer);
  }

  async getOrder(id: string): Promise<Booking> {
    const res = await this.request<{ data?: Json }>("GET", `/v1/booking/flight-orders/${encodeURIComponent(id)}`);
    if (!res.data) throw new ProviderError("commande inconnue", 404, false);
    return mapAmadeusOrder(res.data);
  }

  async cancel(id: string): Promise<void> {
    await this.request("DELETE", `/v1/booking/flight-orders/${encodeURIComponent(id)}`);
  }

  /* ---------- Jeton OAuth2 ---------- */

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt - 60_000 > Date.now()) return this.token.value;
    this.tokenRequest ??= (async () => {
      try {
        const res = await this.fetchImpl(`${this.config.baseUrl}/v1/security/oauth2/token`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
          body: new URLSearchParams({ grant_type: "client_credentials", client_id: this.config.clientId, client_secret: this.config.clientSecret }).toString(),
          redirect: "error",
          signal: AbortSignal.timeout(this.config.timeoutMs),
        });
        if (!res.ok) throw new ProviderError(`Amadeus OAuth2 HTTP ${res.status}`, res.status === 401 ? 401 : 502, res.status >= 500);
        const body = (await res.json()) as { access_token?: string; expires_in?: number };
        if (!body.access_token) throw new ProviderError("Amadeus OAuth2 : jeton absent", 502, true);
        this.token = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 1799) * 1000 };
        return body.access_token;
      } finally {
        this.tokenRequest = undefined;
      }
    })();
    return this.tokenRequest;
  }

  /* ---------- Appels HTTP ---------- */

  private async request<T = unknown>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown, extraHeaders: Record<string, string> = {}): Promise<T> {
    let lastError: ProviderError | undefined;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      const started = Date.now();
      try {
        const token = await this.accessToken();
        const res = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
          method,
          headers: { authorization: `Bearer ${token}`, accept: "application/json", ...(body ? { "content-type": "application/json" } : {}), ...extraHeaders },
          body: body ? JSON.stringify(body) : undefined,
          redirect: "error",
          signal: AbortSignal.timeout(this.config.timeoutMs),
        });
        this.logger.log(`${method} ${path.split("?")[0]?.replace(/flight-orders\/[^/]+/, "flight-orders/:id")} → ${res.status} (${Date.now() - started} ms)`);
        if (res.status === 401 && attempt === 0) {
          this.token = undefined; // jeton révoqué ou expiré : on en redemande un
          continue;
        }
        if (res.ok) {
          if (res.status === 204) return undefined as T;
          const length = Number(res.headers.get("content-length") ?? 0);
          if (length > MAX_RESPONSE_BYTES) throw new ProviderError("réponse Amadeus trop volumineuse", 502, false);
          return (await res.json()) as T;
        }
        const retryable = res.status === 429 || res.status >= 500;
        // Code et titre Amadeus seulement (le « detail » peut reprendre des données saisies).
        const err = ((await res.json().catch(() => null)) as { errors?: { code?: number | string; title?: string }[] } | null)?.errors?.[0];
        const reason = err ? ` [${err.code ?? "?"} ${String(err.title ?? "").slice(0, 80)}]` : "";
        lastError = new ProviderError(`Amadeus HTTP ${res.status}${reason}`, res.status === 404 ? 404 : res.status === 400 || res.status === 422 ? 422 : res.status, retryable);
        if (!retryable) throw lastError;
      } catch (e) {
        if (e instanceof ProviderError && !e.retryable) throw e;
        lastError = e instanceof ProviderError ? e : new ProviderError("Amadeus injoignable", 503, true);
      }
      if (attempt < RETRIES) await this.sleep(500 * 2 ** attempt + Math.floor(Math.random() * 200));
    }
    throw lastError ?? new ProviderError("Amadeus injoignable", 503, true);
  }

  private cached(offerId: string) {
    const entry = this.offers.get(offerId);
    if (!entry || Date.now() - entry.at > OFFER_TTL_MS) throw new ProviderError("offre expirée ou inconnue (relancer la recherche)", 404, false);
    return entry;
  }

  private sweep() {
    const now = Date.now();
    for (const [k, v] of this.offers) if (now - v.at > OFFER_TTL_MS) this.offers.delete(k);
    while (this.offers.size > OFFER_CACHE_MAX) this.offers.delete(this.offers.keys().next().value as string);
  }
}

/* ---------- Conversions (exportées pour les tests) ---------- */

function minutes(iso: unknown): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(String(iso ?? ""));
  return m ? Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

export function mapAmadeusOffer(id: string, o: Json, carriers: Record<string, string>): FlightOffer {
  const price = (o.price ?? {}) as { grandTotal?: string; total?: string; currency?: string };
  const validating = ((o.validatingAirlineCodes as string[] | undefined) ?? [])[0] ?? "";
  const lastTicketing = (o.lastTicketingDateTime as string | undefined) ?? (o.lastTicketingDate as string | undefined) ?? null;
  const holdable = o.instantTicketingRequired !== true;
  return {
    id,
    totalAmount: String(price.grandTotal ?? price.total ?? "0"),
    currency: String(price.currency ?? ""),
    owner: { iata: validating, name: carriers[validating] ?? validating },
    expiresAt: null,
    holdable,
    payBefore: holdable ? lastTicketing : null,
    slices: ((o.itineraries as Json[] | undefined) ?? []).map((it) => {
      const segments = ((it.segments as Json[] | undefined) ?? []).map((s) => {
        const dep = (s.departure ?? {}) as { iataCode?: string; at?: string };
        const arr = (s.arrival ?? {}) as { iataCode?: string; at?: string };
        const carrier = String(s.carrierCode ?? (s.operating as { carrierCode?: string } | undefined)?.carrierCode ?? "");
        return { carrier, carrierName: carriers[carrier] ?? carrier, flightNumber: `${carrier}${String(s.number ?? "")}`, from: dep.iataCode ?? "", to: arr.iataCode ?? "", departAt: dep.at ?? "", arriveAt: arr.at ?? "" };
      });
      return {
        origin: segments[0]?.from ?? "",
        destination: segments.at(-1)?.to ?? "",
        departAt: segments[0]?.departAt ?? "",
        arriveAt: segments.at(-1)?.arriveAt ?? "",
        durationMinutes: minutes(it.duration),
        stops: Math.max(0, segments.length - 1),
        segments,
      };
    }),
  };
}

function checkedBags(o: Json): string | null {
  const fare = (((o.travelerPricings as Json[] | undefined)?.[0]?.fareDetailsBySegment as Json[] | undefined) ?? [])[0];
  const bags = fare?.includedCheckedBags as { quantity?: number; weight?: number; weightUnit?: string } | undefined;
  if (!bags) return null;
  if (bags.quantity) return `${bags.quantity} bagage(s) en soute`;
  if (bags.weight) return `${bags.weight} ${bags.weightUnit ?? "KG"} en soute`;
  return null;
}

export function mapAmadeusOrder(o: Json, offer?: Json): Booking {
  const records = (o.associatedRecords as { reference?: string }[] | undefined) ?? [];
  const firstOffer = ((o.flightOffers as Json[] | undefined) ?? [])[0] ?? offer ?? {};
  const price = (firstOffer.price ?? {}) as { grandTotal?: string; total?: string; currency?: string };
  const tickets = (o.tickets as unknown[] | undefined) ?? [];
  const agreement = (o.ticketingAgreement ?? {}) as { option?: string; dateTime?: string };
  return {
    id: String(o.id),
    status: tickets.length > 0 ? "confirmed" : "held",
    bookingReference: records[0]?.reference ?? null,
    offerId: (firstOffer.id as string | undefined) ?? null,
    totalAmount: String(price.grandTotal ?? price.total ?? "0"),
    currency: String(price.currency ?? ""),
    payBefore: agreement.dateTime ?? ((firstOffer.lastTicketingDateTime as string | undefined) ?? (firstOffer.lastTicketingDate as string | undefined) ?? null),
  };
}
