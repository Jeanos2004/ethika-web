-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'expired');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadEventKind" ADD VALUE 'payment_requested';
ALTER TYPE "LeadEventKind" ADD VALUE 'payment_received';

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(16) NOT NULL,
    "leadId" UUID NOT NULL,
    "quoteId" UUID,
    "amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "provider" VARCHAR(20) NOT NULL,
    "providerRef" VARCHAR(120),
    "method" VARCHAR(40),
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_tokenHash_key" ON "Payment"("tokenHash");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_leadId_idx" ON "Payment"("leadId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
