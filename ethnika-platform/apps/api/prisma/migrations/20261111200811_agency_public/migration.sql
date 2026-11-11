-- AlterTable
ALTER TABLE "AgencySettings" ADD COLUMN     "hoursSaturday" VARCHAR(60) NOT NULL DEFAULT '9 h 00 – 13 h 00',
ADD COLUMN     "hoursSunday" VARCHAR(60) NOT NULL DEFAULT 'Fermé · WhatsApp',
ADD COLUMN     "hoursWeekdays" VARCHAR(60) NOT NULL DEFAULT '8 h 30 – 18 h 00',
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL DEFAULT 9.5092,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL DEFAULT -13.7122,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "address" SET DEFAULT 'Immeuble Kakimbo, Avenue de la République, Kaloum, Conakry',
ALTER COLUMN "phone" SET DEFAULT '+224 622 00 00 00',
ALTER COLUMN "whatsapp" SET DEFAULT '+224 622 00 00 00',
ALTER COLUMN "licence" SET DEFAULT 'AGV-GN-2026-0000',
ALTER COLUMN "rccm" SET DEFAULT 'GN.TCC.2026.B.00000',
ALTER COLUMN "openingHours" SET DEFAULT 'Lun – Sam · 8 h 30 – 18 h',
ALTER COLUMN "paymentInstructions" SET DEFAULT 'Acompte de 30 % à la confirmation, solde avant l''émission des billets. Orange Money : 622 00 00 00 · virement : Ecobank Guinée, compte 0000 0000 0000 · espèces ou carte en agence.',
ALTER COLUMN "quoteTerms" SET DEFAULT 'Conditions générales de vente sur ethnikatour.com/cgv.';

-- Les emplacements […] des installations existantes deviennent les valeurs fictives (à remplacer dans Paramètres > Agence).
UPDATE "AgencySettings" SET "address" = 'Immeuble Kakimbo, Avenue de la République, Kaloum, Conakry' WHERE "address" LIKE '%[%';
UPDATE "AgencySettings" SET "phone" = '+224 622 00 00 00' WHERE "phone" LIKE '%[%';
UPDATE "AgencySettings" SET "whatsapp" = '+224 622 00 00 00' WHERE "whatsapp" = '';
UPDATE "AgencySettings" SET "licence" = 'AGV-GN-2026-0000' WHERE "licence" LIKE '%[%';
UPDATE "AgencySettings" SET "rccm" = 'GN.TCC.2026.B.00000' WHERE "rccm" LIKE '%[%';
UPDATE "AgencySettings" SET "openingHours" = 'Lun – Sam · 8 h 30 – 18 h' WHERE "openingHours" LIKE '%[%';
UPDATE "AgencySettings" SET "paymentInstructions" = 'Acompte de 30 % à la confirmation, solde avant l''émission des billets. Orange Money : 622 00 00 00 · virement : Ecobank Guinée, compte 0000 0000 0000 · espèces ou carte en agence.' WHERE "paymentInstructions" LIKE '%[%';
UPDATE "AgencySettings" SET "quoteTerms" = 'Conditions générales de vente sur ethnikatour.com/cgv.' WHERE "quoteTerms" LIKE '%[%';
