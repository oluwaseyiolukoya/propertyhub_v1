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

-- RenameIndex
ALTER INDEX "project_vendors_customerId_idx" RENAME TO "idx_project_vendors_customerid";

-- RenameIndex
ALTER INDEX "project_vendors_vendorType_idx" RENAME TO "idx_project_vendors_vendortype";

-- RenameIndex
ALTER INDEX "project_vendors_status_idx" RENAME TO "idx_project_vendors_status";

-- RenameIndex
ALTER INDEX "project_invoices_projectId_idx" RENAME TO "idx_project_invoices_projectId";

-- RenameIndex
ALTER INDEX "project_invoices_vendorId_idx" RENAME TO "idx_project_invoices_vendorId";

-- RenameIndex
ALTER INDEX "project_invoices_purchaseOrderId_idx" RENAME TO "idx_project_invoices_purchaseOrderId";

-- RenameIndex
ALTER INDEX "project_invoices_status_idx" RENAME TO "idx_project_invoices_status";

-- RenameIndex
ALTER INDEX "project_invoices_category_idx" RENAME TO "idx_project_invoices_category";

-- RenameIndex
ALTER INDEX "project_forecasts_projectId_idx" RENAME TO "idx_project_forecasts_projectId";

-- RenameIndex
ALTER INDEX "project_forecasts_forecastType_idx" RENAME TO "idx_project_forecasts_forecastType";

-- RenameIndex
ALTER INDEX "project_forecasts_forecastDate_idx" RENAME TO "idx_project_forecasts_date";

-- RenameIndex
ALTER INDEX "project_milestones_projectId_idx" RENAME TO "idx_project_milestones_projectId";

-- RenameIndex
ALTER INDEX "project_milestones_status_idx" RENAME TO "idx_project_milestones_status";

-- RenameIndex
ALTER INDEX "project_milestones_targetDate_idx" RENAME TO "idx_project_milestones_targetDate";

-- RenameIndex
ALTER INDEX "project_funding_projectId_idx" RENAME TO "idx_project_funding_projectId";

-- RenameIndex
ALTER INDEX "project_funding_customerId_idx" RENAME TO "idx_project_funding_customerId";

-- RenameIndex
ALTER INDEX "project_funding_status_idx" RENAME TO "idx_project_funding_status";

-- RenameIndex
ALTER INDEX "project_funding_receivedDate_idx" RENAME TO "idx_project_funding_receivedDate";

-- RenameIndex
ALTER INDEX "project_funding_fundingType_idx" RENAME TO "idx_project_funding_type";

-- RenameIndex
ALTER INDEX "project_expenses_projectId_idx" RENAME TO "idx_project_expenses_projectid";

-- RenameIndex
ALTER INDEX "project_expenses_vendorId_idx" RENAME TO "idx_project_expenses_vendorid";

-- RenameIndex
ALTER INDEX "project_expenses_status_idx" RENAME TO "idx_project_expenses_status";

-- RenameIndex
ALTER INDEX "project_expenses_paidDate_idx" RENAME TO "idx_project_expenses_paiddate";

-- RenameIndex
ALTER INDEX "project_expenses_category_idx" RENAME TO "idx_project_expenses_category";

-- RenameIndex
ALTER INDEX "project_expenses_expenseType_idx" RENAME TO "idx_project_expenses_expensetype";

-- RenameIndex
ALTER INDEX "project_cash_flow_snapshots_projectId_idx" RENAME TO "idx_cash_flow_projectid";

-- RenameIndex
ALTER INDEX "project_cash_flow_snapshots_periodStart_idx" RENAME TO "idx_cash_flow_periodstart";

-- RenameIndex
ALTER INDEX "project_cash_flow_snapshots_periodType_idx" RENAME TO "idx_cash_flow_periodtype";

-- RenameIndex
ALTER INDEX "notification_preferences_user_id_idx" RENAME TO "idx_notification_preferences_user_id";

-- RenameIndex
ALTER INDEX "notification_preferences_customer_id_idx" RENAME TO "idx_notification_preferences_customer_id";

-- RenameIndex
ALTER INDEX "notification_preferences_user_id_customer_id_key" RENAME TO "notification_preferences_user_customer_unique";

-- RenameIndex
ALTER INDEX "notification_templates_is_active_idx" RENAME TO "idx_notification_templates_is_active";

