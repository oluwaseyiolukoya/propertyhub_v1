-- AlterTable
ALTER TABLE "verification_requests" ADD COLUMN     "customerEmail" TEXT;

-- CreateIndex
CREATE INDEX "verification_requests_customerEmail_idx" ON "verification_requests"("customerEmail");
