/** Devises acceptées et nombre de décimales (les montants sont stockés en unités entières : GNF sans décimales, EUR en centimes). */
export const currencies = { GNF: 0, XOF: 0, EUR: 2, USD: 2 } as const;
export type Currency = keyof typeof currencies;

/** Montant entier → texte français (« 1 250 000 GNF », « 812,40 € »). */
export function formatMoney(amount: bigint | number, currency: Currency): string {
  const decimals = currencies[currency];
  const value = Number(amount) / 10 ** decimals;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

/** Total exact en BigInt (aucune erreur d'arrondi). */
export function quoteTotal(lines: { quantity: number; unitAmount: number }[]): bigint {
  return lines.reduce((sum, l) => sum + BigInt(l.quantity) * BigInt(l.unitAmount), 0n);
}
