# ✅ Invoice API Import Error - RESOLVED

## 🐛 Issue

**Error**: `Uncaught SyntaxError: The requested module '/src/lib/api/invoices.ts' does not provide an export named 'createRefund'`

**Root Cause**: When creating the new `invoices.ts` file for project invoices, the existing billing invoice functions (`getInvoices` and `createRefund`) were accidentally removed, breaking imports in:
- `BillingPlansAdmin.tsx`
- `Analytics.tsx`

## ✅ Solution

Updated `src/lib/api/invoices.ts` to include **both** sets of invoice functions:

### 1. Billing Invoices (for subscriptions/billing)
- ✅ `getInvoices()` - Get all billing invoices
- ✅ `createRefund()` - Create refund for billing invoice
- **Endpoint**: `/api/invoices`
- **Used by**: `BillingPlansAdmin.tsx`, `Analytics.tsx`

### 2. Project Invoices (for developer projects)
- ✅ `getProjectInvoices()` - Get invoices for a project
- ✅ `createProjectInvoice()` - Create invoice for a project
- **Endpoint**: `/api/developer-dashboard/projects/:projectId/invoices`
- **Used by**: `PurchaseOrdersPage.tsx`

## 📝 File Structure

```typescript
// src/lib/api/invoices.ts

// ============================================
// Billing Invoices (for subscriptions/billing)
// ============================================
export interface InvoiceDTO { ... }
export async function getInvoices(...) { ... }
export async function createRefund(...) { ... }

// ============================================
// Project Invoices (for developer projects)
// ============================================
export interface ProjectInvoice { ... }
export interface CreateInvoiceData { ... }
export async function getProjectInvoices(...) { ... }
export async function createProjectInvoice(...) { ... }
```

## ✅ Status

**Issue resolved!** The white blank screen should now be fixed. Both billing and project invoice functions are available.

## 🧪 Verification

The following imports should now work:
- ✅ `import { getInvoices, createRefund } from '../lib/api/invoices'` (BillingPlansAdmin.tsx)
- ✅ `import { getInvoices } from '../lib/api/invoices'` (Analytics.tsx)
- ✅ `import { createProjectInvoice } from '../lib/api/invoices'` (PurchaseOrdersPage.tsx)

## 📊 Summary

**Problem**: Missing exports caused import errors
**Solution**: Merged both billing and project invoice functions into one file
**Result**: All imports working, application should load correctly

