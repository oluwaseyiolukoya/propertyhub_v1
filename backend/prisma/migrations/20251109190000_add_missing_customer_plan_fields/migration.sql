-- Add missing fields to customers table
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "planCategory" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "projectLimit" INTEGER;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "projectsCount" INTEGER DEFAULT 0;

-- Add missing fields to plans table
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'property_management';
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "projectLimit" INTEGER;

-- Make propertyLimit nullable in plans (for development plans that don't use it)
ALTER TABLE "plans" ALTER COLUMN "propertyLimit" DROP NOT NULL;


