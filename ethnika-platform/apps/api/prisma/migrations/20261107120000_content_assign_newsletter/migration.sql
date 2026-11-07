-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('vol', 'pack', 'last');

-- AlterEnum
ALTER TYPE "LeadEventKind" ADD VALUE 'assigned';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "assignedToId" UUID;

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN     "confirmTokenHash" VARCHAR(64),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "unsubscribeTokenHash" VARCHAR(64),
ADD COLUMN     "unsubscribedAt" TIMESTAMP(3);

-- Abonnés existants : jeton de désinscription aléatoire (empreinte SHA-256), puis colonne obligatoire.
-- Ils restent non confirmés (confirmedAt NULL) : une confirmation leur sera demandée avant tout envoi.
UPDATE "Subscriber" SET "unsubscribeTokenHash" = encode(sha256(convert_to(gen_random_uuid()::text || clock_timestamp()::text, 'UTF8')), 'hex') WHERE "unsubscribeTokenHash" IS NULL;
ALTER TABLE "Subscriber" ALTER COLUMN "unsubscribeTokenHash" SET NOT NULL;

-- CreateTable
CREATE TABLE "Offer" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "type" "OfferType" NOT NULL,
    "i18n" JSONB NOT NULL,
    "imageUrl" VARCHAR(300) NOT NULL,
    "href" VARCHAR(300) NOT NULL,
    "priceAmount" BIGINT,
    "currency" VARCHAR(3),
    "validUntil" DATE,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circuit" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "theme" VARCHAR(20) NOT NULL,
    "region" VARCHAR(20) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "imageUrl" VARCHAR(300) NOT NULL,
    "priceFrom" BIGINT,
    "currency" VARCHAR(3),
    "i18n" JSONB NOT NULL,
    "departures" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Circuit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Offer_slug_key" ON "Offer"("slug");

-- CreateIndex
CREATE INDEX "Offer_published_position_idx" ON "Offer"("published", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Circuit_slug_key" ON "Circuit"("slug");

-- CreateIndex
CREATE INDEX "Circuit_published_position_idx" ON "Circuit"("published", "position");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_status_idx" ON "Lead"("assignedToId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_confirmTokenHash_key" ON "Subscriber"("confirmTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_unsubscribeTokenHash_key" ON "Subscriber"("unsubscribeTokenHash");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
