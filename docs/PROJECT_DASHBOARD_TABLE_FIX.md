# Project Dashboard Table Fix

## Problem

When clicking on a project in the Developer Dashboard Portfolio to view its details, the application was failing with:

```
Failed to load project
Failed to load project dashboard
500 (Internal Server Error)
```

**Backend Errors:**
```
Invalid `prisma.budget_line_items.findMany()` invocation
The table `public.budget_line_items` does not exist in the current database.

Invalid `prisma.project_funding.findMany()` invocation
The table `public.project_funding` does not exist in the current database.

Invalid `prisma.project_invoices.findMany()` invocation
The table `public.project_invoices` does not exist in the current database.

Invalid `prisma.project_forecasts.findMany()` invocation
The table `public.project_forecasts` does not exist in the current database.

Invalid `prisma.project_milestones.findMany()` invocation
The table `public.project_milestones` does not exist in the current database.
```

## Root Cause

The developer project dashboard requires **5 supporting tables** to display comprehensive project information:

1. **`budget_line_items`** - Budget categories, planned vs actual amounts
2. **`project_funding`** - Funding sources and received amounts
3. **`project_invoices`** - Vendor invoices linked to the project
4. **`project_forecasts`** - Budget and completion date predictions
5. **`project_milestones`** - Project milestones and progress tracking

These tables were defined in the Prisma schema but never created in the database, causing the dashboard endpoint to crash when trying to query them.

## Solution

Created all 5 missing tables with proper camelCase column names matching the Prisma models:

### 1. budget_line_items

```sql
CREATE TABLE IF NOT EXISTS budget_line_items (
  "id" TEXT PRIMARY KEY,
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budget_line_items_projectId ON budget_line_items("projectId");
CREATE INDEX idx_budget_line_items_category ON budget_line_items("category");
CREATE INDEX idx_budget_line_items_status ON budget_line_items("status");
```

**Purpose:** Track planned vs actual spending by category, calculate variances.

### 2. project_funding

```sql
CREATE TABLE IF NOT EXISTS project_funding (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "fundingType" TEXT NOT NULL,
  "fundingSource" TEXT,
  "expectedDate" TIMESTAMP(3),
  "receivedDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "referenceNumber" TEXT UNIQUE,
  "description" TEXT,
  "attachments" JSONB,
  "notes" TEXT,
  "metadata" JSONB,
  "createdBy" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_funding_projectId ON project_funding("projectId");
CREATE INDEX idx_project_funding_customerId ON project_funding("customerId");
CREATE INDEX idx_project_funding_status ON project_funding("status");
CREATE INDEX idx_project_funding_receivedDate ON project_funding("receivedDate");
CREATE INDEX idx_project_funding_type ON project_funding("fundingType");
```

**Purpose:** Track funding received from investors, loans, or other sources.

### 3. project_invoices

```sql
CREATE TABLE IF NOT EXISTS project_invoices (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "vendorId" TEXT,
  "purchaseOrderId" TEXT,
  "invoiceNumber" TEXT UNIQUE NOT NULL,
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_invoices_projectId ON project_invoices("projectId");
CREATE INDEX idx_project_invoices_vendorId ON project_invoices("vendorId");
CREATE INDEX idx_project_invoices_purchaseOrderId ON project_invoices("purchaseOrderId");
CREATE INDEX idx_project_invoices_status ON project_invoices("status");
```

**Purpose:** Track vendor invoices, approval workflow, payment status.

### 4. project_forecasts

```sql
CREATE TABLE IF NOT EXISTS project_forecasts (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "forecastDate" TIMESTAMP(3) NOT NULL,
  "forecastType" TEXT NOT NULL,
  "predictedValue" DOUBLE PRECISION,
  "predictedDate" TIMESTAMP(3),
  "confidence" DOUBLE PRECISION,
  "methodology" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_forecasts_projectId ON project_forecasts("projectId");
CREATE INDEX idx_project_forecasts_forecastType ON project_forecasts("forecastType");
CREATE INDEX idx_project_forecasts_forecastDate ON project_forecasts("forecastDate");
```

**Purpose:** Store budget and completion date predictions (manual or ML-generated).

### 5. project_milestones

```sql
CREATE TABLE IF NOT EXISTS project_milestones (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "targetDate" TIMESTAMP(3) NOT NULL,
  "completedDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dependencies" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_milestones_projectId ON project_milestones("projectId");
CREATE INDEX idx_project_milestones_status ON project_milestones("status");
CREATE INDEX idx_project_milestones_targetDate ON project_milestones("targetDate");
```

**Purpose:** Track project milestones, dependencies, and completion progress.

## Dashboard Endpoint Flow

The `/api/developer-dashboard/projects/:projectId/dashboard` endpoint now:

1. ✅ Fetches the project from `developer_projects`
2. ✅ Loads `budget_line_items` to show planned vs actual budget
3. ✅ Loads `project_invoices` with vendor information
4. ✅ Loads `project_forecasts` for budget predictions
5. ✅ Loads `project_milestones` for timeline tracking
6. ✅ Loads `project_expenses` (already fixed earlier)
7. ✅ Calculates budget by category
8. ✅ Calculates actual spend by category
9. ✅ Returns comprehensive dashboard data

## Recent Activity Endpoint Flow

The `/api/developer-dashboard/projects/:projectId/recent-activity` endpoint now:

1. ✅ Fetches `project_expenses` with approver info
2. ✅ Fetches `project_funding` with creator info
3. ✅ Fetches `budget_line_items` for budget changes
4. ✅ Combines all activities into a unified timeline
5. ✅ Sorts by timestamp (most recent first)
6. ✅ Paginates results (default: 5 items)

## Testing

**Before Fix:**
- ❌ Clicking on a project → "Failed to load project"
- ❌ Dashboard endpoint → 500 Internal Server Error
- ❌ Recent activity → 500 Internal Server Error

**After Fix:**
- ✅ Clicking on a project → Dashboard loads successfully
- ✅ Dashboard endpoint → 200 OK (with empty arrays for new projects)
- ✅ Recent activity → 200 OK (with empty activity feed for new projects)

## Impact

- **Developer Dashboard Portfolio:** Fully functional project detail views
- **Budget Tracking:** Ready for budget line item creation
- **Funding Management:** Ready to record funding sources
- **Invoice Processing:** Ready to manage vendor invoices
- **Forecasting:** Ready for budget and timeline predictions
- **Milestone Tracking:** Ready to track project progress

## Related Files

- **Backend Route:** `backend/src/routes/developer-dashboard.ts`
  - Lines 700-850: Dashboard endpoint
  - Lines 3240-3350: Recent activity endpoint
- **Prisma Schema:** `backend/prisma/schema.prisma`
  - Lines 920-990: budget_line_items, project_funding models
  - Lines 959-1030: project_invoices, project_forecasts, project_milestones models
- **Database:** `contrezz_dev`
  - All 5 tables created with proper indexes

## Notes

- All tables use **camelCase** column names to match Prisma conventions
- No foreign key constraints were added to avoid migration ordering issues
- Application-level relationships are enforced by Prisma
- All tables include proper indexes for query performance
- JSONB columns used for flexible metadata storage (attachments, dependencies)

## Date

November 23, 2025




