-- DropIndex
DROP INDEX "invoice_attachments_uploaded_at_idx";

-- DropIndex
DROP INDEX "notification_preferences_user_id_key";

-- DropIndex
DROP INDEX "notification_templates_type_key";

-- DropIndex
DROP INDEX "idx_notifications_status";

-- DropIndex
DROP INDEX "purchase_orders_category_idx";

-- AlterTable
ALTER TABLE "budget_line_items" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "kycCompletedAt" TIMESTAMP(3),
ADD COLUMN     "kycFailureReason" TEXT,
ADD COLUMN     "kycLastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "kycStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "kycVerificationId" TEXT,
ADD COLUMN     "kycVerifiedBy" TEXT,
ADD COLUMN     "requiresKyc" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "projectsCount" SET NOT NULL,
ALTER COLUMN "storage_last_calculated" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "developer_projects" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "email_queue" DROP CONSTRAINT "email_queue_pkey",
DROP COLUMN "attempts",
DROP COLUMN "error",
DROP COLUMN "max_attempts",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "customer_id" SET NOT NULL,
ALTER COLUMN "to_email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "from_email" DROP NOT NULL,
ALTER COLUMN "from_email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "subject" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "sent_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "to_name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "from_name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "template_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "scheduled_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "failed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "retry_count" SET NOT NULL,
ALTER COLUMN "max_retries" SET NOT NULL,
ADD CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "invoice_attachments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "notification_logs" DROP CONSTRAINT "notification_logs_pkey",
DROP COLUMN "metadata",
ADD COLUMN     "details" JSONB DEFAULT '{}',
ADD COLUMN     "ip_address" INET,
ADD COLUMN     "user_agent" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "customer_id" SET NOT NULL,
DROP COLUMN "notification_id",
ADD COLUMN     "notification_id" UUID NOT NULL,
ALTER COLUMN "action" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "notification_preferences" DROP CONSTRAINT "notification_preferences_pkey",
DROP COLUMN "in_app_enabled",
DROP COLUMN "invoice_approved",
DROP COLUMN "invoice_pending_approval",
DROP COLUMN "invoice_rejected",
DROP COLUMN "payment_received",
DROP COLUMN "team_invitation",
DROP COLUMN "timezone",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "email_enabled" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "email_invoice_approval" SET NOT NULL,
ALTER COLUMN "email_invoice_approved" SET NOT NULL,
ALTER COLUMN "email_invoice_rejected" SET NOT NULL,
ALTER COLUMN "email_invoice_paid" SET NOT NULL,
ALTER COLUMN "email_team_invitation" SET NOT NULL,
ALTER COLUMN "email_delegation" SET NOT NULL,
ALTER COLUMN "email_daily_digest" SET NOT NULL,
ALTER COLUMN "email_weekly_summary" SET NOT NULL,
ALTER COLUMN "inapp_enabled" SET NOT NULL,
ALTER COLUMN "inapp_invoice_approval" SET NOT NULL,
ALTER COLUMN "inapp_invoice_approved" SET NOT NULL,
ALTER COLUMN "inapp_invoice_rejected" SET NOT NULL,
ALTER COLUMN "inapp_invoice_paid" SET NOT NULL,
ALTER COLUMN "inapp_team_invitation" SET NOT NULL,
ALTER COLUMN "inapp_delegation" SET NOT NULL,
ALTER COLUMN "push_enabled" SET NOT NULL,
ALTER COLUMN "quiet_hours_enabled" SET NOT NULL,
ALTER COLUMN "quiet_hours_timezone" SET NOT NULL,
ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "notification_templates" DROP CONSTRAINT "notification_templates_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "type" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "subject" DROP NOT NULL,
ALTER COLUMN "subject" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "body_html" DROP NOT NULL,
ALTER COLUMN "is_system" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "is_active" SET NOT NULL,
ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_pkey",
DROP COLUMN "metadata",
DROP COLUMN "status",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "type" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "priority" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "action_url" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "read_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "read" SET NOT NULL,
ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "onboarding_applications" ADD COLUMN     "activationEmailSent" BOOLEAN DEFAULT false,
ADD COLUMN     "activationEmailSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "plans" ALTER COLUMN "category" SET NOT NULL;

-- AlterTable
ALTER TABLE "project_expenses" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project_funding" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project_invoices" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project_milestones" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "team_members" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text,
ALTER COLUMN "can_approve_invoices" SET NOT NULL,
ALTER COLUMN "can_create_invoices" SET NOT NULL,
ALTER COLUMN "can_manage_projects" SET NOT NULL,
ALTER COLUMN "can_view_reports" SET NOT NULL,
ALTER COLUMN "delegation_start" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "delegation_end" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "invited_at" SET NOT NULL,
ALTER COLUMN "invited_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "joined_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "last_active" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "team_roles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text,
ALTER COLUMN "is_system_role" SET NOT NULL,
ALTER COLUMN "permissions" SET NOT NULL,
ALTER COLUMN "can_approve_invoices" SET NOT NULL,
ALTER COLUMN "can_create_invoices" SET NOT NULL,
ALTER COLUMN "can_manage_projects" SET NOT NULL,
ALTER COLUMN "can_view_reports" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "temp_password_expires_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "landing_page_submissions" (
    "id" TEXT NOT NULL,
    "ticketNumber" SERIAL NOT NULL,
    "formType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "timezone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "source" TEXT,
    "referralUrl" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "assignedToId" TEXT,
    "adminNotes" TEXT,
    "internalTags" TEXT[],
    "responseStatus" TEXT,
    "responseDate" TIMESTAMP(3),
    "responseBy" TEXT,
    "responseNotes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browserInfo" JSONB,
    "deviceInfo" JSONB,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "landing_page_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_responses" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "respondedById" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_cash_flow_snapshots" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalInflow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOutflow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netCashFlow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulativeInflow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulativeOutflow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulativeNetCashFlow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inflowByType" JSONB,
    "outflowByCategory" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_cash_flow_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_approval_workflows" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "min_amount" DECIMAL(15,2),
    "max_amount" DECIMAL(15,2),
    "categories" TEXT[],
    "approval_levels" JSONB NOT NULL,
    "auto_approve_under" DECIMAL(15,2),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_approvals" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "invoice_id" TEXT NOT NULL,
    "workflow_id" TEXT,
    "level" INTEGER NOT NULL,
    "level_name" TEXT,
    "approver_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decision" TEXT,
    "comments" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "delegated_to" TEXT,
    "delegated_at" TIMESTAMP(3),
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "reminder_count" INTEGER NOT NULL DEFAULT 0,
    "last_reminder_at" TIMESTAMP(3),

    CONSTRAINT "invoice_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_history" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "invoice_id" TEXT NOT NULL,
    "approval_id" TEXT,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_name" TEXT NOT NULL,
    "actor_role" TEXT,
    "level" INTEGER,
    "comments" TEXT,
    "previous_status" TEXT,
    "new_status" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landing_page_submissions_ticketNumber_key" ON "landing_page_submissions"("ticketNumber");

-- CreateIndex
CREATE INDEX "landing_page_submissions_formType_idx" ON "landing_page_submissions"("formType");

-- CreateIndex
CREATE INDEX "landing_page_submissions_status_idx" ON "landing_page_submissions"("status");

-- CreateIndex
CREATE INDEX "landing_page_submissions_priority_idx" ON "landing_page_submissions"("priority");

-- CreateIndex
CREATE INDEX "landing_page_submissions_email_idx" ON "landing_page_submissions"("email");

-- CreateIndex
CREATE INDEX "landing_page_submissions_createdAt_idx" ON "landing_page_submissions"("createdAt");

-- CreateIndex
CREATE INDEX "landing_page_submissions_assignedToId_idx" ON "landing_page_submissions"("assignedToId");

-- CreateIndex
CREATE INDEX "landing_page_submissions_responseStatus_idx" ON "landing_page_submissions"("responseStatus");

-- CreateIndex
CREATE INDEX "submission_responses_submissionId_idx" ON "submission_responses"("submissionId");

-- CreateIndex
CREATE INDEX "submission_responses_respondedById_idx" ON "submission_responses"("respondedById");

-- CreateIndex
CREATE INDEX "submission_responses_createdAt_idx" ON "submission_responses"("createdAt");

-- CreateIndex
CREATE INDEX "project_cash_flow_snapshots_projectId_idx" ON "project_cash_flow_snapshots"("projectId");

-- CreateIndex
CREATE INDEX "project_cash_flow_snapshots_periodStart_idx" ON "project_cash_flow_snapshots"("periodStart");

-- CreateIndex
CREATE INDEX "project_cash_flow_snapshots_periodType_idx" ON "project_cash_flow_snapshots"("periodType");

-- CreateIndex
CREATE UNIQUE INDEX "project_cash_flow_snapshots_projectId_periodType_periodStar_key" ON "project_cash_flow_snapshots"("projectId", "periodType", "periodStart");

-- CreateIndex
CREATE INDEX "invoice_approval_workflows_customer_id_idx" ON "invoice_approval_workflows"("customer_id");

-- CreateIndex
CREATE INDEX "invoice_approval_workflows_is_active_is_default_idx" ON "invoice_approval_workflows"("is_active", "is_default");

-- CreateIndex
CREATE INDEX "invoice_approval_workflows_min_amount_max_amount_idx" ON "invoice_approval_workflows"("min_amount", "max_amount");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_approval_workflows_customer_id_name_key" ON "invoice_approval_workflows"("customer_id", "name");

-- CreateIndex
CREATE INDEX "invoice_approvals_invoice_id_idx" ON "invoice_approvals"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_approvals_approver_id_status_idx" ON "invoice_approvals"("approver_id", "status");

-- CreateIndex
CREATE INDEX "invoice_approvals_status_idx" ON "invoice_approvals"("status");

-- CreateIndex
CREATE INDEX "invoice_approvals_due_at_status_idx" ON "invoice_approvals"("due_at", "status");

-- CreateIndex
CREATE INDEX "invoice_approvals_workflow_id_idx" ON "invoice_approvals"("workflow_id");

-- CreateIndex
CREATE INDEX "approval_history_invoice_id_idx" ON "approval_history"("invoice_id");

-- CreateIndex
CREATE INDEX "approval_history_actor_id_idx" ON "approval_history"("actor_id");

-- CreateIndex
CREATE INDEX "approval_history_action_idx" ON "approval_history"("action");

-- CreateIndex
CREATE INDEX "approval_history_created_at_idx" ON "approval_history"("created_at");

-- CreateIndex
CREATE INDEX "email_queue_scheduled_at_idx" ON "email_queue"("scheduled_at");

-- CreateIndex
CREATE INDEX "email_queue_customer_id_idx" ON "email_queue"("customer_id");

-- CreateIndex
CREATE INDEX "email_queue_priority_idx" ON "email_queue"("priority" DESC);

-- CreateIndex
CREATE INDEX "invoice_attachments_uploaded_at_idx" ON "invoice_attachments"("uploaded_at");

-- CreateIndex
CREATE INDEX "invoice_attachments_file_type_idx" ON "invoice_attachments"("file_type");

-- CreateIndex
CREATE INDEX "notification_logs_notification_id_idx" ON "notification_logs"("notification_id");

-- CreateIndex
CREATE INDEX "notification_logs_customer_id_idx" ON "notification_logs"("customer_id");

-- CreateIndex
CREATE INDEX "notification_logs_created_at_idx" ON "notification_logs"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_customer_id_name_type_key" ON "notification_templates"("customer_id", "name", "type");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_notifications_user_unread" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE UNIQUE INDEX "project_stage_templates_name_key" ON "project_stage_templates"("name");

-- CreateIndex
CREATE INDEX "purchase_orders_createdAt_idx" ON "purchase_orders"("createdAt");

-- CreateIndex
CREATE INDEX "team_members_can_approve_invoices_status_idx" ON "team_members"("can_approve_invoices", "status");

-- AddForeignKey
ALTER TABLE "landing_page_submissions" ADD CONSTRAINT "landing_page_submissions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_page_submissions" ADD CONSTRAINT "landing_page_submissions_responseBy_fkey" FOREIGN KEY ("responseBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_responses" ADD CONSTRAINT "submission_responses_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "landing_page_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_responses" ADD CONSTRAINT "submission_responses_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developer_projects" ADD CONSTRAINT "developer_projects_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developer_projects" ADD CONSTRAINT "developer_projects_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_vendors" ADD CONSTRAINT "project_vendors_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_invoices" ADD CONSTRAINT "project_invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_invoices" ADD CONSTRAINT "project_invoices_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "project_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_invoices" ADD CONSTRAINT "project_invoices_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_forecasts" ADD CONSTRAINT "project_forecasts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_funding" ADD CONSTRAINT "project_funding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_funding" ADD CONSTRAINT "project_funding_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_funding" ADD CONSTRAINT "project_funding_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_funding" ADD CONSTRAINT "project_funding_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "project_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_expenses" ADD CONSTRAINT "project_expenses_budgetLineItemId_fkey" FOREIGN KEY ("budgetLineItemId") REFERENCES "budget_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_cash_flow_snapshots" ADD CONSTRAINT "project_cash_flow_snapshots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_attachments" ADD CONSTRAINT "invoice_attachments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "project_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_roles" ADD CONSTRAINT "team_roles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "team_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_delegate_to_fkey" FOREIGN KEY ("delegate_to") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_approval_workflows" ADD CONSTRAINT "invoice_approval_workflows_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_approval_workflows" ADD CONSTRAINT "invoice_approval_workflows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_approvals" ADD CONSTRAINT "invoice_approvals_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "project_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_approvals" ADD CONSTRAINT "invoice_approvals_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "invoice_approval_workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_approvals" ADD CONSTRAINT "invoice_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_approvals" ADD CONSTRAINT "invoice_approvals_delegated_to_fkey" FOREIGN KEY ("delegated_to") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "project_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "invoice_approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_budget_line_items_category" RENAME TO "budget_line_items_category_idx";

-- RenameIndex
ALTER INDEX "idx_budget_line_items_projectid" RENAME TO "budget_line_items_projectId_idx";

-- RenameIndex
ALTER INDEX "idx_budget_line_items_status" RENAME TO "budget_line_items_status_idx";

-- RenameIndex
ALTER INDEX "idx_developer_projects_customerid" RENAME TO "developer_projects_customerId_idx";

-- RenameIndex
ALTER INDEX "idx_developer_projects_developerid" RENAME TO "developer_projects_developerId_idx";

-- RenameIndex
ALTER INDEX "idx_developer_projects_stage" RENAME TO "developer_projects_stage_idx";

-- RenameIndex
ALTER INDEX "idx_developer_projects_status" RENAME TO "developer_projects_status_idx";

-- RenameIndex
ALTER INDEX "idx_email_queue_status" RENAME TO "email_queue_status_idx";

-- RenameIndex
ALTER INDEX "idx_notification_logs_notification" RENAME TO "notification_logs_notification_id_idx";

-- RenameIndex
ALTER INDEX "idx_notification_preferences_customer_id" RENAME TO "notification_preferences_customer_id_idx";

-- RenameIndex
ALTER INDEX "notification_preferences_user_customer_unique" RENAME TO "notification_preferences_user_id_customer_id_key";

-- RenameIndex
ALTER INDEX "idx_notification_templates_customer" RENAME TO "notification_templates_customer_id_idx";

-- RenameIndex
ALTER INDEX "idx_notification_templates_is_active" RENAME TO "notification_templates_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_notification_templates_type" RENAME TO "notification_templates_type_idx";

-- RenameIndex
ALTER INDEX "idx_notifications_customer" RENAME TO "notifications_customer_id_idx";

-- RenameIndex
ALTER INDEX "idx_notifications_type" RENAME TO "notifications_type_idx";

-- RenameIndex
ALTER INDEX "idx_notifications_user" RENAME TO "notifications_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_project_expenses_category" RENAME TO "project_expenses_category_idx";

-- RenameIndex
ALTER INDEX "idx_project_expenses_expensetype" RENAME TO "project_expenses_expenseType_idx";

-- RenameIndex
ALTER INDEX "idx_project_expenses_paiddate" RENAME TO "project_expenses_paidDate_idx";

-- RenameIndex
ALTER INDEX "idx_project_expenses_projectid" RENAME TO "project_expenses_projectId_idx";

-- RenameIndex
ALTER INDEX "idx_project_expenses_status" RENAME TO "project_expenses_status_idx";

-- RenameIndex
ALTER INDEX "idx_project_expenses_vendorid" RENAME TO "project_expenses_vendorId_idx";

-- RenameIndex
ALTER INDEX "project_expenses_invoicenumber_key" RENAME TO "project_expenses_invoiceNumber_key";

-- RenameIndex
ALTER INDEX "idx_project_forecasts_projectid" RENAME TO "project_forecasts_projectId_idx";

-- RenameIndex
ALTER INDEX "idx_project_funding_customerid" RENAME TO "project_funding_customerId_idx";

-- RenameIndex
ALTER INDEX "idx_project_funding_projectid" RENAME TO "project_funding_projectId_idx";

-- RenameIndex
ALTER INDEX "idx_project_funding_receiveddate" RENAME TO "project_funding_receivedDate_idx";

-- RenameIndex
ALTER INDEX "idx_project_funding_status" RENAME TO "project_funding_status_idx";

-- RenameIndex
ALTER INDEX "idx_project_funding_type" RENAME TO "project_funding_fundingType_idx";

-- RenameIndex
ALTER INDEX "idx_project_invoices_category" RENAME TO "project_invoices_category_idx";

-- RenameIndex
ALTER INDEX "idx_project_invoices_projectid" RENAME TO "project_invoices_projectId_idx";

-- RenameIndex
ALTER INDEX "idx_project_invoices_purchaseorderid" RENAME TO "project_invoices_purchaseOrderId_idx";

-- RenameIndex
ALTER INDEX "idx_project_invoices_status" RENAME TO "project_invoices_status_idx";

-- RenameIndex
ALTER INDEX "idx_project_invoices_vendorid" RENAME TO "project_invoices_vendorId_idx";

-- RenameIndex
ALTER INDEX "idx_project_milestones_projectid" RENAME TO "project_milestones_projectId_idx";

-- RenameIndex
ALTER INDEX "idx_project_milestones_status" RENAME TO "project_milestones_status_idx";

-- RenameIndex
ALTER INDEX "idx_project_milestones_targetdate" RENAME TO "project_milestones_targetDate_idx";

-- RenameIndex
ALTER INDEX "idx_team_members_customer" RENAME TO "team_members_customer_id_idx";

-- RenameIndex
ALTER INDEX "idx_team_members_email" RENAME TO "team_members_email_idx";

-- RenameIndex
ALTER INDEX "idx_team_members_role" RENAME TO "team_members_role_id_idx";

-- RenameIndex
ALTER INDEX "idx_team_members_status" RENAME TO "team_members_status_idx";

-- RenameIndex
ALTER INDEX "idx_team_members_user" RENAME TO "team_members_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_team_roles_customer" RENAME TO "team_roles_customer_id_idx";

-- RenameIndex
ALTER INDEX "idx_team_roles_system" RENAME TO "team_roles_is_system_role_idx";

