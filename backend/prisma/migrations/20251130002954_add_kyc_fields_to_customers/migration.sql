-- AlterTable: Add KYC fields to customers table
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "kycStatus" TEXT DEFAULT 'pending';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "kycVerificationId" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "kycCompletedAt" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "kycVerifiedBy" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "kycFailureReason" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "kycLastAttemptAt" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "requiresKyc" BOOLEAN DEFAULT true;
