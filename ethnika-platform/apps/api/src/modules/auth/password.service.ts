import { Injectable } from "@nestjs/common";
import { hash, verify } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";

/** Paramètres argon2id (recommandations OWASP 2024 : 19 Mio, 2 itérations, 1 fil). */
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1, algorithm: 2 /* Argon2id */ } as const;

/** Empreinte de référence pour égaliser le temps de réponse quand le compte n'existe pas. */
let dummy: Promise<string> | undefined;

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return hash(password, OPTIONS);
  }

  async verify(hashValue: string | null, password: string): Promise<boolean> {
    if (!hashValue) {
      dummy ??= hash("ethnika-dummy-password", OPTIONS);
      await verify(await dummy, password).catch(() => false);
      return false;
    }
    return verify(hashValue, password).catch(() => false);
  }

  /** Politique : 12 caractères minimum, pas uniquement des chiffres ou des lettres identiques. */
  validate(password: string): string | null {
    if (password.length < 12) return "password_too_short";
    if (password.length > 200) return "password_too_long";
    if (/^(.)\1+$/.test(password) || /^\d+$/.test(password)) return "password_too_weak";
    return null;
  }

  /** Mot de passe temporaire (création de compte, réinitialisation), à changer à la première connexion. */
  temporary(): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    return Array.from(randomBytes(16), (b) => alphabet[b % alphabet.length]).join("");
  }
}
