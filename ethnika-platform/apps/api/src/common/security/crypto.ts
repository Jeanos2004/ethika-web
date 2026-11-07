import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Jeton aléatoire (sessions, défis), encodé base64url. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Empreinte SHA-256 hexadécimale : on ne stocke jamais un jeton en clair. */
export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Chiffrement applicatif AES-256-GCM (secrets TOTP, futurs n° de passeport).
 * Format : v1.<iv>.<tag>.<chiffré> en base64url. La clé (32 octets) vient de DATA_ENCRYPTION_KEY.
 */
export class FieldCipher {
  private readonly key: Buffer;

  constructor(keyMaterial: string) {
    const key = /^[0-9a-f]{64}$/i.test(keyMaterial) ? Buffer.from(keyMaterial, "hex") : Buffer.from(keyMaterial, "base64");
    if (key.length !== 32) throw new Error("DATA_ENCRYPTION_KEY doit faire 32 octets (64 caractères hex)");
    this.key = key;
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
  }

  decrypt(payload: string): string {
    const [version, iv, tag, data] = payload.split(".");
    if (version !== "v1" || !iv || !tag || !data) throw new Error("Format chiffré invalide");
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  }
}
