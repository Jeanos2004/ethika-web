/*
 * Contrat commun aux fournisseurs de vols (docs/ARCHITECTURE.md) : Duffel d'abord (mode test),
 * Amadeus Enterprise ou consolidateur ensuite, sans toucher au reste de l'API ni au site.
 */

export type Cabin = "eco" | "business" | "first";

export type FlightSearch = {
  slices: { origin: string; destination: string; date: string }[];
  passengers: { adults: number; children: number; infants: number };
  cabin: Cabin;
};

export type Segment = { carrier: string; carrierName: string; flightNumber: string; from: string; to: string; departAt: string; arriveAt: string };

export type FlightOffer = {
  id: string;
  /** Montant total TTC et devise (chaîne décimale, jamais un flottant). */
  totalAmount: string;
  currency: string;
  owner: { iata: string; name: string };
  slices: { origin: string; destination: string; departAt: string; arriveAt: string; durationMinutes: number; stops: number; segments: Segment[] }[];
  expiresAt: string | null;
};

export type PricedOffer = FlightOffer & { conditions: { refundable: boolean | null; changeable: boolean | null }; baggage: string | null };

export type Passenger = {
  type: "adult" | "child" | "infant";
  title: "mr" | "ms" | "mrs" | "miss" | "dr";
  givenName: string;
  familyName: string;
  bornOn: string;
  gender: "m" | "f";
  email: string;
  phone: string;
};

/** Commande (PNR) en option : aucune émission de billet sans validation humaine. */
export type Booking = { id: string; status: "held" | "confirmed" | "cancelled"; bookingReference: string | null; offerId: string | null; totalAmount: string; currency: string; payBefore: string | null };

export interface FlightProvider {
  readonly name: string;
  search(q: FlightSearch): Promise<FlightOffer[]>;
  price(offerId: string): Promise<PricedOffer>;
  /** Pose une option (hold) : ni paiement ni émission. */
  book(offerId: string, passengers: Passenger[]): Promise<Booking>;
  getOrder(id: string): Promise<Booking>;
  cancel(id: string): Promise<void>;
}

export const FLIGHT_PROVIDER = Symbol("FLIGHT_PROVIDER");

/** Erreur fournisseur sans détail technique exposé au client. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}
