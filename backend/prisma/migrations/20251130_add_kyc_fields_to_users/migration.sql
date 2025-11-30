-- Add KYC fields to users table for tenant verification
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycStatus" TEXT DEFAULT 'pending';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycVerificationId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycCompletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycFailureReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycLastAttemptAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "requiresKyc" BOOLEAN DEFAULT false NOT NULL;

-- Set requiresKyc to true for all existing tenants
UPDATE "users" SET "requiresKyc" = true WHERE "role" = 'tenant';
