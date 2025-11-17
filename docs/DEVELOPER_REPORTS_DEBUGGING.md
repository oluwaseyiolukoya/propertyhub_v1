# 🐛 Developer Reports Debugging Guide

## Problem: No Data Showing in Reports Page

### **Symptoms:**
- Reports page loads successfully
- No errors in console
- Summary cards show ₦0 for all metrics
- Cash Flow chart is empty
- Cost Breakdown shows no categories
- Project has budget items and expenses in database

---

## Root Cause Analysis

### **Issue #1: Data Structure Mismatch**

The `calculateMonthlyCashFlow()` function was designed to work with **invoices** but was receiving **expenses**.

#### Expected Structure (Invoices):
```typescript
{
  amount: number,
  status: 'paid' | 'pending' | 'approved',
  paidDate: Date,
  dueDate: Date,
  createdAt: Date
}
```

#### Actual Structure (Expenses):
```typescript
{
  totalAmount: number,
  paymentStatus: 'paid' | 'pending' | 'unpaid',
  paidDate: Date,
  dueDate: Date,
  createdAt: Date
}
```

### **The Problem:**
```typescript
// ❌ This didn't work
const cashFlow = calculateMonthlyCashFlow(expenses, project.startDate);

// Function was looking for:
invoice.amount  // ❌ undefined (expenses have totalAmount)
invoice.status  // ❌ undefined (expenses have paymentStatus)
```

---

## Solution Implemented

### **Data Mapping Layer**

Convert expenses to invoice format before passing to `calculateMonthlyCashFlow`:

```typescript
// ✅ This works
const expensesAsInvoices = expenses.map(expense => ({
  amount: expense.totalAmount,        // Map totalAmount → amount
  status: expense.paymentStatus === 'paid' ? 'paid' : expense.status,  // Map paymentStatus → status
  paidDate: expense.paidDate,
  dueDate: expense.dueDate,
  createdAt: expense.createdAt,
}));

const cashFlow = calculateMonthlyCashFlow(expensesAsInvoices, project.startDate);
```

### **Applied In Two Endpoints:**

1. **Main Reports Endpoint:**
   - `GET /api/developer-dashboard/projects/:projectId/reports`
   - Lines 2347-2355

2. **Cash Flow Endpoint:**
   - `GET /api/developer-dashboard/projects/:projectId/reports/cashflow`
   - Lines 2480-2489

---

## Enhanced Logging

### **Added Debug Logs:**

```typescript
console.log(`📊 Fetching reports for project: ${projectId}`);
console.log(`👤 User ID: ${userId}, Customer ID: ${customerId}`);
console.log(`✅ Project found: ${project.name}`);
console.log(`📋 Budget items found: ${budgetItems.length}`);
console.log(`💰 Expenses found: ${expenses.length}`);
console.log(`📊 Reports summary:`, {
  totalBudget: summary.totalBudget,
  totalSpent: summary.totalSpent,
  remaining: summary.remaining,
  totalExpenses: summary.totalExpenses,
  cashFlowMonths: cashFlow.length,
  costCategories: costBreakdown.length,
  vendors: vendorPerformance.length,
  phases: phaseSpending.length,
});
```

---

## How to Verify the Fix

### **Step 1: Check Backend Logs**

When you navigate to the Reports page, you should see:

```
📊 Fetching reports for project: abc-123-def
👤 User ID: user-456, Customer ID: cust-789
✅ Project found: UGC - Platform
📋 Budget items found: 5
💰 Expenses found: 12
📊 Reports summary: {
  totalBudget: 15000000,
  totalSpent: 8500000,
  remaining: 6500000,
  totalExpenses: 12,
  cashFlowMonths: 6,
  costCategories: 4,
  vendors: 3,
  phases: 5
}
```

### **Step 2: Check Frontend Console**

You should see:

```
📊 Fetching reports data for project: abc-123-def
✅ Reports data received: {
  summary: { totalBudget: 15000000, totalSpent: 8500000, ... },
  cashFlow: [ { month: 'Jun', inflow: 10000000, outflow: 8500000 }, ... ],
  costBreakdown: [ { name: 'Labor', value: 3000000, ... }, ... ],
  ...
}
```

### **Step 3: Verify UI Display**

#### **Summary Cards Should Show:**
- ✅ Total Budget: ₦15,000,000
- ✅ Total Spent: ₦8,500,000 (56.7% of budget)
- ✅ Remaining: ₦6,500,000 (43.3% available)
- ✅ Expenses: 12 (with badges for paid/overdue)

#### **Charts Should Display:**
- ✅ Cash Flow: 6 months of data with inflow/outflow
- ✅ Cost Breakdown: Pie chart with categories
- ✅ Vendor Performance: Table with metrics
- ✅ Phase Spending: Bar chart with budget vs actual

---

## Troubleshooting

### **Issue: Still Seeing Empty Data**

#### **Check 1: Verify Project Has Data**

```sql
-- Check budget items
SELECT COUNT(*) FROM budget_line_items WHERE "projectId" = 'your-project-id';

-- Check expenses
SELECT COUNT(*) FROM project_expenses WHERE "projectId" = 'your-project-id';
```

#### **Check 2: Verify Project Ownership**

The API verifies that the project belongs to the logged-in user:

```typescript
const project = await prisma.developer_projects.findFirst({
  where: {
    id: projectId,
    customerId,      // Must match user's customer
    developerId: userId,  // Must match user's ID
  },
});
```

If the project isn't found, check:
- Is the user logged in as the correct developer?
- Does the project belong to this customer?
- Is the developerId correct?

#### **Check 3: Verify Expense Payment Status**

Only **paid** expenses are counted in "Total Spent":

```typescript
const totalSpent = expenses
  .filter(e => e.paymentStatus === 'paid')
  .reduce((sum, e) => sum + e.totalAmount, 0);
```

If expenses are marked as `pending` or `unpaid`, they won't show in Total Spent.

#### **Check 4: Check Browser Console for Errors**

Look for:
- ❌ Network errors (500, 404, 401)
- ❌ CORS errors
- ❌ Authentication errors
- ❌ Data parsing errors

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Opens Reports Page                                  │
│    - ReportsPage component mounts                           │
│    - useEffect triggers data fetch                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend API Call                                        │
│    - getProjectReports(projectId, period)                   │
│    - GET /api/developer-dashboard/projects/:id/reports      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend Processing                                       │
│    ✓ Verify project ownership                               │
│    ✓ Fetch budget_line_items from database                  │
│    ✓ Fetch project_expenses from database                   │
│    ✓ Convert expenses → invoices format                     │
│    ✓ Calculate summary metrics                              │
│    ✓ Calculate cash flow (6 months)                         │
│    ✓ Calculate cost breakdown by category                   │
│    ✓ Calculate vendor performance                           │
│    ✓ Calculate phase spending                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Response Structure                                       │
│    {                                                        │
│      summary: { totalBudget, totalSpent, remaining, ... },  │
│      cashFlow: [ { month, inflow, outflow }, ... ],        │
│      costBreakdown: [ { name, value, color }, ... ],       │
│      vendorPerformance: [ { vendor, onTime, ... }, ... ],  │
│      phaseSpend: [ { phase, budget, actual }, ... ]        │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend Display                                         │
│    ✓ Update summary cards                                   │
│    ✓ Render cash flow chart                                 │
│    ✓ Render cost breakdown pie chart                        │
│    ✓ Render vendor performance table                        │
│    ✓ Render phase spending bar chart                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Files Modified

### **Backend:**
- `backend/src/routes/developer-dashboard.ts`
  - Lines 2347-2355: Main reports endpoint fix
  - Lines 2480-2489: Cash flow endpoint fix
  - Lines 2300-2334: Added logging
  - Lines 2458-2467: Added response logging

### **Frontend:**
- `src/lib/api/developer-reports.ts` (created)
  - TypeScript interfaces
  - API service functions

- `src/modules/developer-dashboard/components/ReportsPage.tsx`
  - Real-time data fetching
  - Summary cards
  - Error handling
  - Loading states

---

## Testing Checklist

- [ ] Backend logs show correct project name
- [ ] Backend logs show correct count of budget items
- [ ] Backend logs show correct count of expenses
- [ ] Backend logs show non-zero summary metrics
- [ ] Frontend console shows successful API response
- [ ] Summary cards display correct values
- [ ] Cash Flow chart renders with data
- [ ] Cost Breakdown pie chart shows categories
- [ ] Vendor Performance table has rows
- [ ] Phase Spending bar chart displays data
- [ ] No console errors
- [ ] No network errors (500, 404)

---

## Next Steps

1. **Test with UGC Platform project**
2. **Verify all metrics are accurate**
3. **Test period filtering (last month, 3 months, 6 months)**
4. **Test with projects that have no data (should show empty state)**
5. **Test with projects that have only budget (no expenses)**
6. **Test with projects that have only expenses (no budget)**

---

## Support

If issues persist:

1. **Check backend logs** for the console.log statements
2. **Check frontend console** for API responses
3. **Verify database** has budget items and expenses
4. **Verify project ownership** matches logged-in user
5. **Check expense payment status** (must be 'paid' to count)

---

**Status:** ✅ Fixed and ready for testing
**Date:** November 17, 2025
**Version:** 1.0

