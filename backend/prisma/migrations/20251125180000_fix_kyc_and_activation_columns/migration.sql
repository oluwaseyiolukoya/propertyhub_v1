-- Fix missing KYC and onboarding activation columns in development
-- This migration is idempotent and safe to run in environments where
-- the columns may already exist (uses IF NOT EXISTS).

-- Ensure KYC fields on customers exist
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "kycCompletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "kycFailureReason" TEXT,
  ADD COLUMN IF NOT EXISTS "kycLastAttemptAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "kycStatus" TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "kycVerificationId" TEXT,
  ADD COLUMN IF NOT EXISTS "kycVerifiedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "requiresKyc" BOOLEAN NOT NULL DEFAULT true;

-- Ensure activation tracking columns on onboarding_applications exist
ALTER TABLE "onboarding_applications"
  ADD COLUMN IF NOT EXISTS "activationEmailSent" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "activationEmailSentAt" TIMESTAMP(3);


