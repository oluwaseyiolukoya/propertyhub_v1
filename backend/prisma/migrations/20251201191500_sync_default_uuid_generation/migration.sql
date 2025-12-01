-- Standardize UUID default generation across tables
-- This migration ensures consistent UUID generation using gen_random_uuid()

-- AlterTable
ALTER TABLE "invoice_attachments" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;

-- AlterTable
ALTER TABLE "team_roles" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;

-- AlterTable
ALTER TABLE "team_members" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;

-- AlterTable
ALTER TABLE "invoice_approval_workflows" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;

-- AlterTable
ALTER TABLE "invoice_approvals" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;

-- AlterTable
ALTER TABLE "approval_history" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;

