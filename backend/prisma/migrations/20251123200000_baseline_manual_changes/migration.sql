-- Baseline Migration: Document Manual Table Creation
-- This migration captures all the tables that were created manually
-- to fix the project dashboard 500 errors on November 23, 2025.
--
-- Tables created:
-- - budget_line_items
-- - project_funding
-- - project_invoices
-- - project_forecasts
-- - project_milestones
--
-- Columns added:
-- - notification_templates.name
-- - notification_templates.is_active
-- - notification_templates.created_by

-- CreateTable
CREATE TABLE IF NOT EXISTS "budget_line_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT NOT NULL,
    "plannedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variancePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_funding" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "fundingType" TEXT NOT NULL,
    "fundingSource" TEXT,
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "referenceNumber" TEXT,
    "description" TEXT,
    "attachments" JSONB,
    "notes" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_funding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_invoices" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "vendorId" TEXT,
    "purchaseOrderId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "attachments" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_forecasts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "forecastType" TEXT NOT NULL,
    "predictedValue" DOUBLE PRECISION,
    "predictedDate" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION,
    "methodology" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dependencies" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "notification_templates"
ADD COLUMN IF NOT EXISTS "name" VARCHAR(100) DEFAULT 'default_template',
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "created_by" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_budget_line_items_projectId" ON "budget_line_items"("projectId");
CREATE INDEX IF NOT EXISTS "idx_budget_line_items_category" ON "budget_line_items"("category");
CREATE INDEX IF NOT EXISTS "idx_budget_line_items_status" ON "budget_line_items"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_funding_projectId" ON "project_funding"("projectId");
CREATE INDEX IF NOT EXISTS "idx_project_funding_customerId" ON "project_funding"("customerId");
CREATE INDEX IF NOT EXISTS "idx_project_funding_status" ON "project_funding"("status");
CREATE INDEX IF NOT EXISTS "idx_project_funding_receivedDate" ON "project_funding"("receivedDate");
CREATE INDEX IF NOT EXISTS "idx_project_funding_type" ON "project_funding"("fundingType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_invoices_projectId" ON "project_invoices"("projectId");
CREATE INDEX IF NOT EXISTS "idx_project_invoices_vendorId" ON "project_invoices"("vendorId");
CREATE INDEX IF NOT EXISTS "idx_project_invoices_purchaseOrderId" ON "project_invoices"("purchaseOrderId");
CREATE INDEX IF NOT EXISTS "idx_project_invoices_status" ON "project_invoices"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_forecasts_projectId" ON "project_forecasts"("projectId");
CREATE INDEX IF NOT EXISTS "idx_project_forecasts_forecastType" ON "project_forecasts"("forecastType");
CREATE INDEX IF NOT EXISTS "idx_project_forecasts_forecastDate" ON "project_forecasts"("forecastDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_project_milestones_projectId" ON "project_milestones"("projectId");
CREATE INDEX IF NOT EXISTS "idx_project_milestones_status" ON "project_milestones"("status");
CREATE INDEX IF NOT EXISTS "idx_project_milestones_targetDate" ON "project_milestones"("targetDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_notification_templates_is_active" ON "notification_templates"("is_active");

-- CreateIndex (Unique)
CREATE UNIQUE INDEX IF NOT EXISTS "project_invoices_invoiceNumber_key" ON "project_invoices"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "project_funding_referenceNumber_key" ON "project_funding"("referenceNumber");




