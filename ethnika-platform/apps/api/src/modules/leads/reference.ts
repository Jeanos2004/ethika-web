import { randomInt } from "node:crypto";

/** Alphabet sans caractères ambigus (pas de 0/O, 1/I/L) : la référence se dicte au téléphone. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Référence publique d'une demande : ETH- + 6 caractères (≈ 887 millions de combinaisons), tirage cryptographique. */
export function newReference(): string {
  let out = "ETH-";
  for (let i = 0; i < 6; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export const REFERENCE_PATTERN = /^ETH-[A-HJ-NP-Z2-9]{6}$/;
