import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Limitation de débit en mémoire par clé (IP, compte). Suffisant pour une instance unique ;
 * à remplacer par Redis (même interface) dès qu'il y aura plusieurs instances.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Lève 429 si la limite est atteinte, sinon comptabilise la tentative. */
  consume(key: string, now = Date.now()) {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      throw new HttpException({ error: "rate_limited", retryAfterSeconds: Math.ceil((this.windowMs - (now - (recent[0] ?? now))) / 1000) }, HttpStatus.TOO_MANY_REQUESTS);
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 50_000) this.sweep(now);
  }

  private sweep(now: number) {
    for (const [k, v] of this.hits) if (v.every((t) => now - t >= this.windowMs)) this.hits.delete(k);
  }
}
