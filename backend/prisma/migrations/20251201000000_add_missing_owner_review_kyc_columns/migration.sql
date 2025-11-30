-- Add missing owner review KYC fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycReviewedByOwnerId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycOwnerReviewedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycOwnerApprovalStatus" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycOwnerNotes" TEXT;

