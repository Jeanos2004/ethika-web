/** Devises des devis et nombre de décimales (montants transmis à l'API en unités entières : GNF, centimes d'euro). */
export const quoteCurrencies = { GNF: 0, XOF: 0, EUR: 2, USD: 2 } as const;
export type QuoteCurrency = keyof typeof quoteCurrencies;

/** « 1 250 000 », « 812,40 » ou « 812.40 » → unités entières ; null si le texte n'est pas un montant valide. */
export function toMinorUnits(text: string, currency: QuoteCurrency): number | null {
  const clean = text.replace(/[\s  ]/g, "").replace(",", ".");
  const decimals = quoteCurrencies[currency];
  const pattern = decimals === 0 ? /^\d{1,13}$/ : /^\d{1,11}(\.\d{1,2})?$/;
  if (!pattern.test(clean)) return null;
  const [whole, frac = ""] = clean.split(".");
  return Number(whole) * 10 ** decimals + Number(frac.padEnd(decimals, "0") || 0);
}

/** Unités entières → « 1 250 000 GNF », « 812,40 € ». */
export function formatMoney(amount: number | string, currency: string) {
  const decimals = quoteCurrencies[currency as QuoteCurrency] ?? 0;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(amount) / 10 ** decimals);
}
