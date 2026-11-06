"use client";

import { useSyncExternalStore } from "react";

/**
 * Consentement aux cookies non essentiels.
 * Stocké dans un cookie first-party « ethnika_consent » (SameSite=Lax, Secure en HTTPS, 6 mois).
 * Aucun traceur n'est chargé tant que la valeur n'est pas « accepted » (aucun n'est installé à ce jour).
 */
export type Consent = "accepted" | "refused";

const NAME = "ethnika_consent";
const EVENT = "ethnika:consent";
const SIX_MONTHS = 60 * 60 * 24 * 182;

export function readConsent(): Consent | null {
  const match = document.cookie.match(/(?:^|;\s*)ethnika_consent=(accepted|refused)(?:;|$)/);
  return (match?.[1] as Consent | undefined) ?? null;
}

export function writeConsent(value: Consent) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${NAME}=${value}; Max-Age=${SIX_MONTHS}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(EVENT));
}

/** Efface le choix : le bandeau réapparaît (« Gérer les cookies »). */
export function resetConsent() {
  document.cookie = `${NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** « unknown » côté serveur et pendant l'hydratation : le bandeau ne s'affiche qu'une fois le cookie lu. */
export function useConsent(): Consent | null | "unknown" {
  return useSyncExternalStore(subscribe, readConsent, () => "unknown" as const);
}
