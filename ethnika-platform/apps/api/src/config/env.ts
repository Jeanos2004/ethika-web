import { z } from "zod";

/**
 * Configuration validée une fois au démarrage : une variable manquante ou invalide arrête le processus
 * plutôt que de casser en production. Aucune valeur secrète n'est journalisée.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "URL PostgreSQL attendue"),
  INTERNAL_API_KEY: z.string().min(32, "32 caractères minimum (openssl rand -hex 32)"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((v) => v.split(",").map((o) => o.trim()).filter(Boolean)),
  CHROME_PATH: z.string().optional(),
  SITE_URL: z.url().default("http://localhost:3000"),
  /** Clé de chiffrement applicatif (32 octets en hex) : secrets TOTP, champs sensibles. */
  DATA_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, "64 caractères hexadécimaux (openssl rand -hex 32)"),
  /** Session du back-office : inactivité maximale et durée absolue (minutes). */
  SESSION_IDLE_MINUTES: z.coerce.number().int().min(5).max(24 * 60).default(30),
  SESSION_MAX_MINUTES: z.coerce.number().int().min(30).max(7 * 24 * 60).default(12 * 60),
  /** E-mails : SMTP (smtp://user:pass@host:587) ; vide = e-mails journalisés sans être envoyés (développement). */
  SMTP_URL: z.string().optional(),
  /** Resend (prioritaire sur SMTP) : clé re_…, domaine de MAIL_FROM vérifié dans Resend. */
  RESEND_API_KEY: z.string().regex(/^re_[A-Za-z0-9_]{8,}$/, "clé Resend attendue (re_…)").optional(),
  MAIL_FROM: z.string().default("ETHNIKA <contact@ethnikatour.com>"),
  /** Adresse interne de l'agence qui reçoit la notification de chaque nouvelle demande. */
  AGENCY_NOTIFY_EMAIL: z.email().optional(),
  /** Vols : « mock » (développement), « duffel » (jeton duffel_test_…) ou « amadeus » (Self-Service / Enterprise). */
  FLIGHT_PROVIDER: z.enum(["mock", "duffel", "amadeus"]).default("mock"),
  /** Paiements : « none » (liens désactivés) tant que l'agence n'a pas choisi son prestataire ; « mock » = simulation, interdite en production. */
  PAYMENT_PROVIDER: z.enum(["none", "mock"]).default("none"),
  DUFFEL_TOKEN: z.string().regex(/^duffel_(test|live)_/).optional(),
  /** Amadeus : https://test.api.amadeus.com (test), https://api.amadeus.com (production) ou un bac à sable simulé. */
  AMADEUS_BASE_URL: z.url().refine((u) => u.startsWith("https://"), "HTTPS requis").default("https://test.api.amadeus.com"),
  AMADEUS_CLIENT_ID: z.string().min(1).optional(),
  AMADEUS_CLIENT_SECRET: z.string().min(1).optional(),
  /** Délai par appel (ms) : Amadeus répond en 1 à 5 s, certains bacs à sable simulés en plus d'une minute. */
  AMADEUS_TIMEOUT_MS: z.coerce.number().int().min(1000).max(180_000).default(30_000),
  /** Conservation des demandes clôturées (jours) avant purge automatique. */
  LEAD_RETENTION_DAYS: z.coerce.number().int().min(30).max(3650).default(730),
})
  .refine((e) => e.FLIGHT_PROVIDER !== "duffel" || Boolean(e.DUFFEL_TOKEN), { path: ["DUFFEL_TOKEN"], message: "requis avec FLIGHT_PROVIDER=duffel" })
  .refine((e) => !(e.NODE_ENV === "production" && e.PAYMENT_PROVIDER === "mock"), { path: ["PAYMENT_PROVIDER"], message: "la simulation de paiement est interdite en production" })
  .refine((e) => e.FLIGHT_PROVIDER !== "amadeus" || Boolean(e.AMADEUS_CLIENT_ID && e.AMADEUS_CLIENT_SECRET), { path: ["AMADEUS_CLIENT_ID"], message: "AMADEUS_CLIENT_ID et AMADEUS_CLIENT_SECRET requis avec FLIGHT_PROVIDER=amadeus" });

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  // Une variable vide (« SMTP_URL= » comme dans .env.example) vaut « non renseignée ».
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== undefined && v.trim() !== ""));
  const parsed = schema.safeParse(cleaned);
  if (!parsed.success) {
    const fields = Object.keys(z.flattenError(parsed.error).fieldErrors).join(", ");
    throw new Error(`Configuration invalide (${fields}) — voir apps/api/.env.example`);
  }
  return parsed.data;
}

/** Jeton d'injection de la configuration. */
export const ENV = Symbol("ENV");
