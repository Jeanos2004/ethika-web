import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/*
 * TOTP (RFC 6238, HMAC-SHA1, 6 chiffres, pas de 30 s) — compatible Google Authenticator, Aegis, 1Password…
 * Implémenté avec node:crypto : aucune dépendance tierce dans la chaîne d'authentification.
 */

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP = 30;

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) throw new Error("base32 invalide");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Nouveau secret (160 bits, recommandation RFC 4226). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpAt(secret: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f;
  const code = (((hmac[offset] ?? 0) & 0x7f) << 24) | (((hmac[offset + 1] ?? 0) & 0xff) << 16) | (((hmac[offset + 2] ?? 0) & 0xff) << 8) | ((hmac[offset + 3] ?? 0) & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

export function currentStep(now = Date.now()): number {
  return Math.floor(now / 1000 / STEP);
}

/**
 * Vérifie un code avec une tolérance de ±1 pas (décalage d'horloge). Renvoie le pas accepté (à mémoriser
 * pour refuser son rejeu) ou null. Un pas déjà utilisé (≤ lastStep) est refusé.
 */
export function verifyTotp(secret: string, code: string, lastStep: number | null, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const step = currentStep(now);
  for (const s of [step - 1, step, step + 1]) {
    if (lastStep !== null && s <= lastStep) continue;
    const expected = Buffer.from(totpAt(secret, s));
    if (timingSafeEqual(expected, Buffer.from(code))) return s;
  }
  return null;
}

/** URI otpauth:// à afficher en QR code dans le back-office. */
export function totpUri(secret: string, account: string, issuer = "ETHNIKA Back-office"): string {
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${STEP}`;
}
