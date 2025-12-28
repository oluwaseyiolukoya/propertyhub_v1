-- CreateTable
CREATE TABLE "tax_calculations" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "customerId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "calculationType" TEXT NOT NULL DEFAULT 'annual',
    "totalRentalIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rentRelief" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxableIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "personalIncomeTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capitalGainsTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "propertyTaxes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "withholdingTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTaxLiability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "propertySalePrice" DOUBLE PRECISION,
    "propertyPurchasePrice" DOUBLE PRECISION,
    "capitalGain" DOUBLE PRECISION,
    "calculationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "tax_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_settings" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "taxpayerType" TEXT NOT NULL DEFAULT 'individual',
    "taxIdentificationNumber" TEXT,
    "annualRentPaid" DOUBLE PRECISION,
    "rentReliefAmount" DOUBLE PRECISION,
    "otherIncomeSources" JSONB,
    "landUseChargeRate" DOUBLE PRECISION,
    "stampDutyRate" DOUBLE PRECISION,
    "defaultTaxYear" INTEGER NOT NULL DEFAULT 2026,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_calculations_customerId_taxYear_calculationType_propertyId_key" ON "tax_calculations"("customerId", "taxYear", "calculationType", "propertyId");

-- CreateIndex
CREATE INDEX "tax_calculations_customerId_idx" ON "tax_calculations"("customerId");

-- CreateIndex
CREATE INDEX "tax_calculations_taxYear_idx" ON "tax_calculations"("taxYear");

-- CreateIndex
CREATE INDEX "tax_calculations_propertyId_idx" ON "tax_calculations"("propertyId");

-- CreateIndex
CREATE INDEX "tax_calculations_calculationType_idx" ON "tax_calculations"("calculationType");

-- CreateIndex
CREATE UNIQUE INDEX "tax_settings_customerId_key" ON "tax_settings"("customerId");

-- AddForeignKey
ALTER TABLE "tax_calculations" ADD CONSTRAINT "tax_calculations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_calculations" ADD CONSTRAINT "tax_calculations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_settings" ADD CONSTRAINT "tax_settings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;


