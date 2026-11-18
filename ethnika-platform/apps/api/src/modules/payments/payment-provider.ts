/*
 * Contrat commun aux prestataires de paiement (Orange Money, CinetPay, carte…) : même principe que les fournisseurs
 * de vols. Le client est toujours redirigé chez le prestataire (aucune donnée de carte ne transite par ETHNIKA,
 * PCI-DSS SAQ A) ; le résultat revient par une notification serveur signée, jamais par le seul retour du navigateur.
 */

export type CheckoutInput = {
  reference: string;
  /** Unités entières de la devise (GNF, centimes d'euro). */
  amount: bigint;
  currency: string;
  label: string;
  /** Page du site où le client revient après le paiement (affiche l'état réel, relu en base). */
  returnUrl: string;
  /** Jeton du lien client, transmis à la simulation uniquement. */
  token: string;
};

export type Checkout = { checkoutUrl: string; providerRef: string | null };

/** Résultat d'une notification du prestataire, après vérification de sa signature. */
export type PaymentResult = { reference: string; outcome: "paid" | "failed"; providerRef?: string; method?: string };

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutInput): Promise<Checkout>;
}

export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");

/**
 * Simulation (développement et recette uniquement, refusée en production par la configuration) :
 * la « page du prestataire » est une page du site qui propose « paiement réussi » ou « échec ».
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  constructor(private readonly siteUrl: string) {}

  async createCheckout(input: CheckoutInput): Promise<Checkout> {
    const url = new URL(`/paiement/${input.reference}/simulation`, this.siteUrl);
    url.searchParams.set("t", input.token);
    return { checkoutUrl: url.toString(), providerRef: `MOCK-${input.reference}` };
  }
}

/** Paiements désactivés tant qu'aucun prestataire n'est configuré. */
export class DisabledPaymentProvider implements PaymentProvider {
  readonly name = "none";

  async createCheckout(): Promise<Checkout> {
    throw new Error("aucun prestataire de paiement configuré");
  }
}
