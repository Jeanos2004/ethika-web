import "server-only";
import { z } from "zod";

/**
 * Variables serveur, validées une fois au chargement du module.
 * Une config invalide fait échouer le démarrage plutôt que de casser en production.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_BASE_URL: z.union([z.literal(""), z.url()]).optional(),
  API_INTERNAL_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Configuration serveur invalide :", z.flattenError(parsed.error).fieldErrors);
  throw new Error("Configuration serveur invalide — voir .env.example");
}

if (parsed.data.API_BASE_URL && (parsed.data.API_INTERNAL_KEY ?? "").length < 32) {
  throw new Error("API_INTERNAL_KEY doit faire au moins 32 caractères quand API_BASE_URL est défini");
}

export const env = parsed.data;
