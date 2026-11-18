-- CreateEnum
CREATE TYPE "FlightBookingStatus" AS ENUM ('held', 'confirmed', 'cancelled');

-- AlterEnum
ALTER TYPE "LeadEventKind" ADD VALUE 'flight_hold';

-- CreateTable
CREATE TABLE "FlightBooking" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "providerOrderId" VARCHAR(80) NOT NULL,
    "bookingReference" VARCHAR(20),
    "status" "FlightBookingStatus" NOT NULL,
    "totalAmount" VARCHAR(20) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "payBefore" TIMESTAMP(3),
    "itinerary" JSONB NOT NULL,
    "passengerCount" INTEGER NOT NULL,
    "leadId" UUID,
    "createdBy" UUID NOT NULL,
    "deadlineNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlightBooking_providerOrderId_key" ON "FlightBooking"("providerOrderId");

-- CreateIndex
CREATE INDEX "FlightBooking_status_payBefore_idx" ON "FlightBooking"("status", "payBefore");

-- CreateIndex
CREATE INDEX "FlightBooking_leadId_idx" ON "FlightBooking"("leadId");

-- AddForeignKey
ALTER TABLE "FlightBooking" ADD CONSTRAINT "FlightBooking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
