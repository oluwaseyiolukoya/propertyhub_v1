-- Create core tables for Property Developer dashboard domain
-- These tables were defined in schema.prisma but never created in the contrezz_dev database
-- The definitions below are aligned with the Prisma models under
-- "Property Developer Dashboard Models" in schema.prisma.

-- ============================================
-- developer_projects
-- ============================================

CREATE TABLE IF NOT EXISTS developer_projects (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL,
  developerId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  projectType TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'planning',
  status TEXT NOT NULL DEFAULT 'active',
  startDate TIMESTAMP(3),
  estimatedEndDate TIMESTAMP(3),
  actualEndDate TIMESTAMP(3),
  location TEXT,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'Nigeria',
  totalBudget DOUBLE PRECISION NOT NULL DEFAULT 0,
  actualSpend DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  progress DOUBLE PRECISION NOT NULL DEFAULT 0,
  coverImage TEXT,
  images JSONB,
  metadata JSONB,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  -- Note: We intentionally omit explicit foreign key constraints here to avoid
  -- migration failures if related tables differ slightly from Prisma's expectations.
  -- Application logic still treats customerId and developerId as foreign keys.
);

CREATE INDEX IF NOT EXISTS idx_developer_projects_customerId ON developer_projects("customerId");
CREATE INDEX IF NOT EXISTS idx_developer_projects_developerId ON developer_projects("developerId");
CREATE INDEX IF NOT EXISTS idx_developer_projects_status ON developer_projects("status");
CREATE INDEX IF NOT EXISTS idx_developer_projects_stage ON developer_projects("stage");

-- ============================================
-- budget_line_items
-- ============================================

CREATE TABLE IF NOT EXISTS budget_line_items (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  plannedAmount DOUBLE PRECISION NOT NULL DEFAULT 0,
  actualAmount DOUBLE PRECISION NOT NULL DEFAULT 0,
  variance DOUBLE PRECISION NOT NULL DEFAULT 0,
  variancePercent DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  startDate TIMESTAMP(3),
  endDate TIMESTAMP(3),
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT budget_line_items_projectId_fkey FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budget_line_items_projectId ON budget_line_items("projectId");
CREATE INDEX IF NOT EXISTS idx_budget_line_items_category ON budget_line_items("category");
CREATE INDEX IF NOT EXISTS idx_budget_line_items_status ON budget_line_items("status");

-- ============================================
-- project_vendors
-- ============================================

CREATE TABLE IF NOT EXISTS project_vendors (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL,
  name TEXT NOT NULL,
  contactPerson TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  vendorType TEXT NOT NULL,
  specialization TEXT,
  rating DOUBLE PRECISION,
  totalContracts INTEGER NOT NULL DEFAULT 0,
  totalValue DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- customerId references customers(id) at application level; FK omitted for compatibility
);

CREATE INDEX IF NOT EXISTS idx_project_vendors_customerId ON project_vendors("customerId");
CREATE INDEX IF NOT EXISTS idx_project_vendors_vendorType ON project_vendors("vendorType");
CREATE INDEX IF NOT EXISTS idx_project_vendors_status ON project_vendors("status");

-- ============================================
-- project_invoices
-- ============================================

CREATE TABLE IF NOT EXISTS project_invoices (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  vendorId TEXT,
  purchaseOrderId TEXT,
  invoiceNumber TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending',
  dueDate TIMESTAMP(3),
  paidDate TIMESTAMP(3),
  paymentMethod TEXT,
  approvedBy TEXT,
  approvedAt TIMESTAMP(3),
  attachments JSONB,
  notes TEXT,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT project_invoices_projectId_fkey FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT project_invoices_vendorId_fkey FOREIGN KEY ("vendorId") REFERENCES "project_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE
  -- purchaseOrderId and approvedBy relations are optional; we omit FKs here to avoid dependency on purchase_orders/users during backfill
);

CREATE INDEX IF NOT EXISTS idx_project_invoices_projectId ON project_invoices("projectId");
CREATE INDEX IF NOT EXISTS idx_project_invoices_vendorId ON project_invoices("vendorId");
CREATE INDEX IF NOT EXISTS idx_project_invoices_status ON project_invoices("status");
CREATE INDEX IF NOT EXISTS idx_project_invoices_category ON project_invoices("category");

-- ============================================
-- project_forecasts
-- ============================================

CREATE TABLE IF NOT EXISTS project_forecasts (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  forecastDate TIMESTAMP(3) NOT NULL,
  forecastType TEXT NOT NULL,
  predictedValue DOUBLE PRECISION,
  predictedDate TIMESTAMP(3),
  confidence DOUBLE PRECISION,
  methodology TEXT,
  notes TEXT,
  metadata JSONB,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT project_forecasts_projectId_fkey FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_forecasts_projectId ON project_forecasts("projectId");
CREATE INDEX IF NOT EXISTS idx_project_forecasts_type ON project_forecasts("forecastType");
CREATE INDEX IF NOT EXISTS idx_project_forecasts_date ON project_forecasts("forecastDate");

-- ============================================
-- project_milestones
-- ============================================

CREATE TABLE IF NOT EXISTS project_milestones (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  targetDate TIMESTAMP(3) NOT NULL,
  completedDate TIMESTAMP(3),
  status TEXT NOT NULL DEFAULT 'pending',
  progress DOUBLE PRECISION NOT NULL DEFAULT 0,
  dependencies JSONB,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT project_milestones_projectId_fkey FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_projectId ON project_milestones("projectId");
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones("status");
CREATE INDEX IF NOT EXISTS idx_project_milestones_targetDate ON project_milestones("targetDate");

-- ============================================
-- project_funding
-- ============================================

CREATE TABLE IF NOT EXISTS project_funding (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  customerId TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  fundingType TEXT NOT NULL,
  fundingSource TEXT,
  expectedDate TIMESTAMP(3),
  receivedDate TIMESTAMP(3),
  status TEXT NOT NULL DEFAULT 'pending',
  referenceNumber TEXT UNIQUE,
  description TEXT,
  attachments JSONB,
  notes TEXT,
  metadata JSONB,
  createdBy TEXT,
  approvedBy TEXT,
  approvedAt TIMESTAMP(3),
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT project_funding_projectId_fkey FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
  -- customerId and createdBy/approvedBy relations are enforced at application level
);

CREATE INDEX IF NOT EXISTS idx_project_funding_projectId ON project_funding("projectId");
CREATE INDEX IF NOT EXISTS idx_project_funding_customerId ON project_funding("customerId");
CREATE INDEX IF NOT EXISTS idx_project_funding_status ON project_funding("status");
CREATE INDEX IF NOT EXISTS idx_project_funding_receivedDate ON project_funding("receivedDate");
CREATE INDEX IF NOT EXISTS idx_project_funding_type ON project_funding("fundingType");

-- ============================================
-- project_expenses
-- ============================================

CREATE TABLE IF NOT EXISTS project_expenses (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  vendorId TEXT,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  taxAmount DOUBLE PRECISION NOT NULL DEFAULT 0,
  totalAmount DOUBLE PRECISION NOT NULL,
  expenseType TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  invoiceNumber TEXT UNIQUE,
  description TEXT NOT NULL,
  invoiceDate TIMESTAMP(3),
  dueDate TIMESTAMP(3),
  paidDate TIMESTAMP(3),
  status TEXT NOT NULL DEFAULT 'pending',
  paymentStatus TEXT NOT NULL DEFAULT 'unpaid',
  paymentMethod TEXT,
  paymentReference TEXT,
  approvedBy TEXT,
  approvedAt TIMESTAMP(3),
  attachments JSONB,
  notes TEXT,
  budgetLineItemId TEXT,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT project_expenses_projectId_fkey FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT project_expenses_vendorId_fkey FOREIGN KEY ("vendorId") REFERENCES "project_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT project_expenses_budgetLineItemId_fkey FOREIGN KEY ("budgetLineItemId") REFERENCES "budget_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE
  -- approvedBy relation to users is omitted at DB level for now
);

CREATE INDEX IF NOT EXISTS idx_project_expenses_projectId ON project_expenses("projectId");
CREATE INDEX IF NOT EXISTS idx_project_expenses_vendorId ON project_expenses("vendorId");
CREATE INDEX IF NOT EXISTS idx_project_expenses_status ON project_expenses("status");
CREATE INDEX IF NOT EXISTS idx_project_expenses_paidDate ON project_expenses("paidDate");
CREATE INDEX IF NOT EXISTS idx_project_expenses_category ON project_expenses("category");
CREATE INDEX IF NOT EXISTS idx_project_expenses_expenseType ON project_expenses("expenseType");

-- ============================================
-- project_cash_flow_snapshots
-- ============================================

CREATE TABLE IF NOT EXISTS project_cash_flow_snapshots (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  periodType TEXT NOT NULL,
  periodStart TIMESTAMP(3) NOT NULL,
  periodEnd TIMESTAMP(3) NOT NULL,
  totalInflow DOUBLE PRECISION NOT NULL DEFAULT 0,
  totalOutflow DOUBLE PRECISION NOT NULL DEFAULT 0,
  netCashFlow DOUBLE PRECISION NOT NULL DEFAULT 0,
  cumulativeInflow DOUBLE PRECISION NOT NULL DEFAULT 0,
  cumulativeOutflow DOUBLE PRECISION NOT NULL DEFAULT 0,
  cumulativeNetCashFlow DOUBLE PRECISION NOT NULL DEFAULT 0,
  inflowByType JSONB,
  outflowByCategory JSONB,
  calculatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT project_cash_flow_snapshots_projectId_fkey FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_flow_project_period ON project_cash_flow_snapshots("projectId", "periodType", "periodStart");
CREATE INDEX IF NOT EXISTS idx_cash_flow_projectId ON project_cash_flow_snapshots("projectId");
CREATE INDEX IF NOT EXISTS idx_cash_flow_periodStart ON project_cash_flow_snapshots("periodStart");
CREATE INDEX IF NOT EXISTS idx_cash_flow_periodType ON project_cash_flow_snapshots("periodType");


