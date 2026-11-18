import { BadGatewayException, HttpException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type { FlightOffer, FlightProvider, FlightSearch, Passenger } from "./flight-provider";
import { FLIGHT_PROVIDER, ProviderError } from "./flight-provider";

const CACHE_TTL_MS = 5 * 60_000;
const CACHE_MAX = 500;

/**
 * Façade des vols : cache court des recherches (en mémoire ; Redis en multi-instances), traduction des erreurs fournisseur
 * en réponses génériques. Aucune émission de billet : `hold` pose une option que l'agent valide hors ligne.
 */
@Injectable()
export class FlightsService {
  private readonly cache = new Map<string, { at: number; offers: FlightOffer[] }>();

  constructor(@Inject(FLIGHT_PROVIDER) private readonly provider: FlightProvider) {}

  get providerName() {
    return this.provider.name;
  }

  async search(q: FlightSearch): Promise<{ offers: FlightOffer[]; cached: boolean }> {
    const key = JSON.stringify(q);
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return { offers: hit.offers, cached: true };
    const offers = await this.call(() => this.provider.search(q));
    if (this.cache.size >= CACHE_MAX) this.cache.delete(this.cache.keys().next().value as string);
    this.cache.set(key, { at: Date.now(), offers });
    return { offers, cached: false };
  }

  price(offerId: string) {
    return this.call(() => this.provider.price(offerId));
  }

  hold(offerId: string, passengers: Passenger[]) {
    return this.call(() => this.provider.book(offerId, passengers));
  }

  getOrder(id: string) {
    return this.call(() => this.provider.getOrder(id));
  }

  async cancel(id: string) {
    await this.call(() => this.provider.cancel(id));
    return { ok: true };
  }

  private async call<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof HttpException) throw e;
      if (e instanceof ProviderError) {
        if (e.status === 404) throw new NotFoundException({ error: "offer_or_order_not_found" });
        if (e.status === 422) throw new UnprocessableEntityException({ error: e.code ?? "provider_rejected" });
      }
      throw new BadGatewayException({ error: "provider_unavailable" });
    }
  }
}
