import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Configuration Prisma 7 : l'URL de la base vient de DATABASE_URL (fichier .env non commité). */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // `prisma generate` n'a pas besoin de base : valeur factice si DATABASE_URL est absente (CI).
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://placeholder@localhost:5432/placeholder" },
});
