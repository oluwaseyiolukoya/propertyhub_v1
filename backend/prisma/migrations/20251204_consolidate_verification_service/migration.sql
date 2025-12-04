-- Consolidate Verification Service into Main Backend
-- This migration adds verification system tables to the main database
-- Previously these were in a separate microservice

-- CreateTable: verification_requests
CREATE TABLE IF NOT EXISTS "verification_requests" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: verification_documents
CREATE TABLE IF NOT EXISTS "verification_documents" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "providerReference" TEXT,
    "verificationData" JSONB,
    "confidence" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: verification_history
CREATE TABLE IF NOT EXISTS "verification_history" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: provider_logs
CREATE TABLE IF NOT EXISTS "provider_logs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "documentId" TEXT,
    "endpoint" TEXT NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "statusCode" INTEGER,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "verification_requests_customerId_idx" ON "verification_requests"("customerId");
CREATE INDEX IF NOT EXISTS "verification_requests_customerEmail_idx" ON "verification_requests"("customerEmail");
CREATE INDEX IF NOT EXISTS "verification_requests_status_idx" ON "verification_requests"("status");
CREATE INDEX IF NOT EXISTS "verification_requests_submittedAt_idx" ON "verification_requests"("submittedAt");

CREATE INDEX IF NOT EXISTS "verification_documents_requestId_idx" ON "verification_documents"("requestId");
CREATE INDEX IF NOT EXISTS "verification_documents_status_idx" ON "verification_documents"("status");
CREATE INDEX IF NOT EXISTS "verification_documents_documentType_idx" ON "verification_documents"("documentType");
CREATE INDEX IF NOT EXISTS "verification_documents_createdAt_idx" ON "verification_documents"("createdAt");

CREATE INDEX IF NOT EXISTS "verification_history_requestId_idx" ON "verification_history"("requestId");
CREATE INDEX IF NOT EXISTS "verification_history_action_idx" ON "verification_history"("action");
CREATE INDEX IF NOT EXISTS "verification_history_createdAt_idx" ON "verification_history"("createdAt");

CREATE INDEX IF NOT EXISTS "provider_logs_provider_idx" ON "provider_logs"("provider");
CREATE INDEX IF NOT EXISTS "provider_logs_success_idx" ON "provider_logs"("success");
CREATE INDEX IF NOT EXISTS "provider_logs_createdAt_idx" ON "provider_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "provider_logs_documentId_idx" ON "provider_logs"("documentId");

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_history" ADD CONSTRAINT "verification_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

