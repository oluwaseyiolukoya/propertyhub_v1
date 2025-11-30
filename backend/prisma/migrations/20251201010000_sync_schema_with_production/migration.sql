-- Sync schema differences between local and production

-- AlterTable: Set default UUID generators
ALTER TABLE "approval_history" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "invoice_approval_workflows" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "invoice_approvals" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "invoice_attachments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "team_members" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "team_roles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable: Make leases.endDate nullable for indefinite leases
ALTER TABLE "leases" ALTER COLUMN "endDate" DROP NOT NULL;

