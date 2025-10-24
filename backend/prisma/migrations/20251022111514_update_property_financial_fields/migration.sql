-- AlterTable: Add new Nigerian market-specific financial fields to properties table
ALTER TABLE "properties" ADD COLUMN "securityDeposit" DOUBLE PRECISION;
ALTER TABLE "properties" ADD COLUMN "applicationFee" DOUBLE PRECISION;
ALTER TABLE "properties" ADD COLUMN "cautionFee" DOUBLE PRECISION;
ALTER TABLE "properties" ADD COLUMN "legalFee" DOUBLE PRECISION;
ALTER TABLE "properties" ADD COLUMN "agentCommission" DOUBLE PRECISION;
ALTER TABLE "properties" ADD COLUMN "serviceCharge" DOUBLE PRECISION;
ALTER TABLE "properties" ADD COLUMN "agreementFee" DOUBLE PRECISION;

-- AlterTable: Remove old fields that are not common in Nigerian market
ALTER TABLE "properties" DROP COLUMN IF EXISTS "purchasePrice";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "marketValue";






