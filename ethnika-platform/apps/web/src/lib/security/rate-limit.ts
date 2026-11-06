import "server-only";

/**
 * Limiteur de débit en mémoire (fenêtre glissante simple).
 * Suffisant en dev et sur une instance unique. En production multi-instances ou serverless,
 * remplacer par un stockage partagé (Redis/Upstash) — voir docs/SECURITY.md.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false as const, retryAfterMs: windowMs - (now - hits[0]!) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) buckets.clear(); // garde-fou mémoire
  return { ok: true as const };
}
