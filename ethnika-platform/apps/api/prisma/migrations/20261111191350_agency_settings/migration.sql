-- CreateTable
CREATE TABLE "AgencySettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "address" VARCHAR(200) NOT NULL DEFAULT '[Quartier], Conakry',
    "phone" VARCHAR(40) NOT NULL DEFAULT '+224 [NUMÉRO]',
    "whatsapp" VARCHAR(40) NOT NULL DEFAULT '',
    "email" VARCHAR(200) NOT NULL DEFAULT 'contact@ethnikatour.com',
    "licence" VARCHAR(80) NOT NULL DEFAULT '[À COMPLÉTER]',
    "rccm" VARCHAR(80) NOT NULL DEFAULT '[À COMPLÉTER]',
    "openingHours" VARCHAR(200) NOT NULL DEFAULT 'Lun – Sam · [HORAIRES]',
    "paymentInstructions" TEXT NOT NULL DEFAULT 'Acompte à la confirmation, solde avant l''émission des billets. En agence (espèces, carte), par virement ou Orange Money : [COORDONNÉES À COMPLÉTER].',
    "quoteTerms" TEXT NOT NULL DEFAULT 'Conditions générales de vente : [À COMPLÉTER].',
    "updatedBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencySettings_pkey" PRIMARY KEY ("id")
);
