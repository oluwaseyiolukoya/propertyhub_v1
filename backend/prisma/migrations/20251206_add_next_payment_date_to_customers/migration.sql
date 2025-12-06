-- AddNextPaymentDateToCustomers
-- Add nextPaymentDate column to customers table for tracking upcoming payment dates

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP;

-- Add index for better query performance when filtering by payment dates
CREATE INDEX IF NOT EXISTS "customers_nextPaymentDate_idx" ON "customers"("nextPaymentDate");

