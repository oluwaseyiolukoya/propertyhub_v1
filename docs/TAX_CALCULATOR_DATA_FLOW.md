# Tax Calculator Data Flow - How Revenue and Expenses Are Fetched

## Overview

This document explains the complete data flow from when you select a **Tax Year** and **Property** in the Tax Calculator to when the **Property Financial Summary** displays revenue and expenses.

---

## Step-by-Step Data Flow

### Step 1: User Selection (Frontend)

**Location**: `src/components/TaxManagement.tsx` (lines 140-182)

**What Happens**:
1. User selects **Tax Year** (e.g., 2025) from dropdown
2. User selects **Property** (e.g., "John Adeleke") from dropdown
3. React `useEffect` hook detects the change in `formData.taxYear` or `formData.propertyId`

**Code Trigger**:
```typescript
useEffect(() => {
  // Reset values when property or year changes
  setPropertyRevenue(0);
  setPropertyExpenses(0);
  setExpenseBreakdown([]);

  if (formData.taxYear && formData.propertyId) {
    // Auto-fetch data from backend
    autoFetchTaxData({
      taxYear: formData.taxYear,
      propertyId: formData.propertyId,
    })
    .then((response) => {
      // Process response...
    });
  }
}, [formData.propertyId, formData.taxYear]);
```

---

### Step 2: API Call (Frontend → Backend)

**Location**: `src/lib/api/tax.ts` (function: `autoFetchTaxData`)

**What Happens**:
1. Frontend calls `GET /api/tax/auto-fetch?taxYear=2025&propertyId=3b067363-2bae-4f0c-a583-369c2ddd0fb6`
2. Request includes authentication token (from user session)
3. Request includes query parameters:
   - `taxYear`: The selected tax year (e.g., 2025)
   - `propertyId`: The selected property ID

**API Client Code**:
```typescript
export const autoFetchTaxData = async (params: {
  taxYear: number;
  propertyId: string;
}): Promise<ApiResponse<{
  annualRentPaid: number;
  otherIncome: number;
  rentalIncome: number;
  otherDeductions: number;
  expenseBreakdown: Array<{ category: string; amount: number }>;
  propertyPurchasePrice?: number;
  propertySalePrice?: number;
}>> => {
  return apiClient.get('/tax/auto-fetch', {
    params: {
      taxYear: params.taxYear,
      propertyId: params.propertyId,
    },
  });
};
```

---

### Step 3: Backend Endpoint (Authentication & Validation)

**Location**: `backend/src/routes/tax.ts` (lines 198-499)

**What Happens**:
1. **Authentication**: Verifies user is logged in (`authMiddleware`)
2. **Feature Access**: Checks if user has `tax_calculator` feature access
3. **Validation**: Ensures `propertyId` is provided
4. **Property Ownership**: Verifies the property belongs to the user

**Code**:
```typescript
router.get('/auto-fetch', async (req: AuthRequest, res: Response) => {
  const customerId = req.user?.customerId;
  const userId = req.user?.id;
  const { taxYear, propertyId } = req.query;

  // Verify property belongs to user
  const userProperties = await prisma.properties.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (!userPropertyIds.includes(propertyId as string)) {
    return res.status(404).json({ error: 'Property not found' });
  }
});
```

---

### Step 4: Fetch Property Data with Units and Leases

**Location**: `backend/src/routes/tax.ts` (lines 235-265)

**What Happens**:
1. Queries the database for the property
2. Includes related data:
   - **Units**: All units for the property (with `monthlyRent`, `status`, `features`)
   - **Leases**: All active leases for the property (with `monthlyRent`, `startDate`, `endDate`)

**Database Query**:
```typescript
const property = await prisma.properties.findFirst({
  where: {
    id: propertyId as string,
    ownerId: userId, // Security: Only user's properties
  },
  include: {
    units: {
      select: {
        id: true,
        monthlyRent: true,
        status: true,
        features: true, // Contains rentFrequency
      },
    },
    leases: {
      where: { status: 'active' },
      select: {
        id: true,
        unitId: true,
        monthlyRent: true,
        startDate: true,
        endDate: true,
      },
    },
  },
});
```

**Example Data Retrieved**:
```json
{
  "id": "3b067363-2bae-4f0c-a583-369c2ddd0fb6",
  "name": "John Adeleke",
  "features": {
    "nigeria": { "rentFrequency": "annual" }
  },
  "units": [
    {
      "id": "21db77d0-44dc-46aa-aa8a-348fa0170c09",
      "status": "occupied",
      "monthlyRent": 200000,
      "features": {
        "nigeria": { "rentFrequency": "annual" }
      }
    }
  ],
  "leases": []
}
```

---

### Step 5: Calculate Revenue from Actual Payment Transactions

**Location**: `backend/src/routes/tax.ts` (lines 278-313)

**Revenue Calculation Logic** (Cash Basis Accounting):

#### 5.1: Query Payment Transactions

**Uses actual payments from the Payments table** (same as Payments page - "All Payment Transactions")

```typescript
const payments = await prisma.payments.findMany({
  where: {
    propertyId: propertyId as string, // Selected property only
    customerId, // Security: Only payments for user's customer
    type: 'rent', // Only rent payments (exclude subscriptions)
    status: { in: ['completed', 'success'] }, // Only successful payments
    paidAt: {
      gte: yearStart, // Payment date within tax year (start of year)
      lte: yearEnd,   // Payment date within tax year (end of year)
    },
  },
  select: {
    id: true,
    amount: true,
    currency: true,
    paidAt: true, // Date when payment was received
    type: true,
    status: true,
  },
});
```

**Key Filters**:
- ✅ `propertyId`: Only payments for the selected property
- ✅ `type: 'rent'`: Only rent payments (excludes subscription payments)
- ✅ `status: ['completed', 'success']`: Only successful/completed payments
- ✅ `paidAt`: Payment date must be within the selected tax year

#### 5.2: Calculate Total Revenue

```typescript
const finalAnnualRevenue = payments.reduce((sum, payment) => {
  return sum + (payment.amount || 0);
}, 0);
```

**Example Calculation for John Adeleke (2025)**:
- Payment 1: `amount = 200000`, `paidAt = 2025-01-15`, `status = 'completed'` → ✅ Included
- Payment 2: `amount = 200000`, `paidAt = 2025-06-20`, `status = 'completed'` → ✅ Included
- Payment 3: `amount = 200000`, `paidAt = 2024-12-20`, `status = 'completed'` → ❌ Excluded (2024, not 2025)
- **Total Revenue**: `200000 + 200000 = 400000`

**Why This Approach?**
- ✅ **Cash Basis Accounting**: Revenue is recognized when payment is **received** (`paidAt` date)
- ✅ **Accurate Tax Reporting**: Matches what you actually received in the tax year
- ✅ **Consistent with Payments Page**: Uses the same data source as "All Payment Transactions"
- ✅ **Tax Office Compliance**: Tax authorities require revenue based on actual receipts

---

### Step 6: Fetch Expenses (From Expenses Table)

**Location**: `backend/src/routes/tax.ts` (lines 412-476)

**Expense Calculation Logic**:

#### 6.1: Query Expenses

```typescript
const allExpenses = await prisma.expenses.findMany({
  where: {
    propertyId: propertyId as string, // Selected property only
    category: { not: 'Property Tax' }, // Exclude Property Tax (shown separately)
    status: { in: ['paid', 'pending'] }, // Only paid or pending expenses
  },
  select: {
    id: true,
    amount: true,
    category: true,
    date: true,
    paidDate: true, // Used for tax year determination
    status: true,
  },
});
```

#### 6.2: Filter by Tax Year

**Important**: Expenses are counted in the tax year they were **paid**, not when they were created.

```typescript
const expensesForYear = allExpenses.filter((expense) => {
  const expenseDate = expense.paidDate || expense.date; // Use paidDate if available
  if (!expenseDate) return false;
  const expenseYear = new Date(expenseDate).getFullYear();
  return expenseYear === year; // Match selected tax year
});
```

**Example**:
- Expense created: `2024-12-15`
- Expense paid: `2025-01-10`
- Tax Year selected: `2025`
- **Result**: ✅ Included (uses `paidDate = 2025`)

#### 6.3: Calculate Total Expenses

```typescript
const propertyExpenses = expensesForYear.reduce(
  (sum, exp) => sum + (exp.amount || 0),
  0
);
```

#### 6.4: Group by Category (for Breakdown)

```typescript
const categoryMap = new Map<string, number>();
expensesForYear.forEach((exp) => {
  const category = exp.category || 'Uncategorized';
  const current = categoryMap.get(category) || 0;
  categoryMap.set(category, current + (exp.amount || 0));
});

const expenseBreakdown = Array.from(categoryMap.entries())
  .map(([category, amount]) => ({ category, amount }))
  .sort((a, b) => b.amount - a.amount);
```

**Example Breakdown**:
```json
[
  { "category": "Maintenance", "amount": 50000 },
  { "category": "Repairs", "amount": 30000 },
  { "category": "Management", "amount": 20000 }
]
```

---

### Step 7: Backend Response

**Location**: `backend/src/routes/tax.ts` (lines 478-491)

**Response Structure**:
```typescript
res.json({
  success: true,
  data: {
    annualRentPaid: 0, // Not used (property-specific only)
    otherIncome: 0, // Not used (property-specific only)
    rentalIncome: 200000, // Final annual revenue
    otherDeductions: 100000, // Total expenses for the year
    expenseBreakdown: [
      { "category": "Maintenance", "amount": 50000 },
      { "category": "Repairs", "amount": 30000 },
      { "category": "Management", "amount": 20000 }
    ],
    propertyPurchasePrice: null,
    propertySalePrice: null,
  },
});
```

---

### Step 8: Frontend Receives Response

**Location**: `src/components/TaxManagement.tsx` (lines 145-172)

**What Happens**:
1. Response is received from backend
2. Data is extracted and stored in React state
3. UI is updated to display the values

**Code**:
```typescript
.then((response) => {
  if (response.data?.success && response.data.data) {
    const autoData = response.data.data;

    // Extract revenue and expenses
    const revenue = autoData.rentalIncome || 0; // 200000
    const expenses = autoData.otherDeductions || 0; // 100000

    // Update state (triggers UI re-render)
    setPropertyRevenue(revenue); // 200000
    setPropertyExpenses(expenses); // 100000
    setExpenseBreakdown(autoData.expenseBreakdown || []);
  }
});
```

---

### Step 9: Display in UI (Property Financial Summary)

**Location**: `src/components/TaxManagement.tsx` (lines 500-548)

**What Happens**:
1. React re-renders when state changes
2. Property Financial Summary cards display the values
3. Net Taxable Income is calculated: `revenue - expenses`

**UI Components**:
```typescript
{/* Total Revenue Card */}
<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
  <p className="text-2xl font-bold text-green-700">
    {formatCurrency(propertyRevenue, "NGN")} {/* ₦200,000.00 */}
  </p>
  <p className="text-xs text-gray-500">
    From active leases for {formData.taxYear}
  </p>
</div>

{/* Total Expenses Card */}
<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
  <p className="text-2xl font-bold text-red-700">
    {formatCurrency(propertyExpenses, "NGN")} {/* ₦100,000.00 */}
  </p>
  <p className="text-xs text-gray-500">
    Deductions for {formData.taxYear}
  </p>
</div>

{/* Net Taxable Income Card */}
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-xl font-bold text-blue-700">
    {formatCurrency(Math.max(0, propertyRevenue - propertyExpenses), "NGN")}
    {/* ₦100,000.00 */}
  </p>
  <p className="text-xs text-gray-500">
    Revenue - Expenses = ₦200,000.00 - ₦100,000.00
  </p>
</div>
```

---

## Complete Flow Diagram

```
User Selects Tax Year & Property
         ↓
Frontend: useEffect triggers
         ↓
Frontend: Calls autoFetchTaxData()
         ↓
Backend: GET /api/tax/auto-fetch
         ↓
Backend: Verify property ownership
         ↓
Backend: Fetch property details
         ↓
Backend: Query payment transactions (filtered by property, tax year, paidAt date)
         ↓
Backend: Calculate revenue from actual payments (cash basis)
         ↓
Backend: Fetch expenses from expenses table
         ↓
Backend: Filter expenses by tax year (paidDate)
         ↓
Backend: Calculate total expenses & breakdown
         ↓
Backend: Return JSON response
         ↓
Frontend: Receive response
         ↓
Frontend: Update React state (propertyRevenue, propertyExpenses)
         ↓
Frontend: UI re-renders with new values
         ↓
User Sees: Property Financial Summary with revenue & expenses
```

---

## Key Points

### 1. **Revenue Calculation**
- ✅ Uses **actual payment transactions** from Payments table (same as Payments page)
- ✅ **Cash basis accounting**: Revenue recognized when payment is received (`paidAt` date)
- ✅ Filters by **tax year** using `paidAt` date (when payment was received)
- ✅ Only counts **successful rent payments** (`status: 'completed'` or `'success'`, `type: 'rent'`)
- ✅ Excludes subscription payments (only property rent payments)
- ✅ Matches "All Payment Transactions" view in Payments page

### 2. **Expense Calculation**
- ✅ Fetches from `expenses` table (same as Expenses page)
- ✅ Filters by **selected property** only
- ✅ Filters by **tax year** using `paidDate` (when expense was paid)
- ✅ Excludes **Property Tax** category (shown separately)
- ✅ Only includes **paid** or **pending** expenses
- ✅ Groups by category for breakdown display

### 3. **Data Consistency**
- ✅ Uses **same logic** as Property Financial Performance page
- ✅ Uses **same logic** as Expenses page
- ✅ Ensures Tax Calculator shows **same values** as other pages

### 4. **Security**
- ✅ Verifies property belongs to user (`ownerId` check)
- ✅ Only returns data for user's properties
- ✅ Requires authentication and feature access

---

## Debugging

### If No Data Shows:

1. **Check Browser Console**:
   - Look for `[Tax Calculator] Auto-fetch response:`
   - Look for `[Tax Calculator] Auto-fetched data:`
   - Look for `[Tax Calculator] Setting revenue:`

2. **Check Backend Logs**:
   - Look for `[Tax Auto-Fetch] Property:`
   - Look for `[Tax Auto-Fetch] Occupied units:`
   - Look for `[Tax Auto-Fetch] Final annual revenue:`
   - Look for `[Tax Auto-Fetch] Response - rentalIncome:`

3. **Verify Database**:
   - Check if property has units: `SELECT * FROM units WHERE propertyId = '...'`
   - Check if units are occupied: `SELECT * FROM units WHERE propertyId = '...' AND status = 'occupied'`
   - Check if expenses exist: `SELECT * FROM expenses WHERE propertyId = '...' AND status IN ('paid', 'pending')`

4. **Common Issues**:
   - ❌ No payments with `paidAt` date in selected tax year → Revenue will be 0
   - ❌ Payments not marked as `completed` or `success` → Revenue will be 0
   - ❌ Payments with `type != 'rent'` (e.g., subscriptions) → Excluded from revenue
   - ❌ No expenses with `paidDate` in selected tax year → Expenses will be 0
   - ❌ Property doesn't belong to user → 404 error
   - ❌ Missing authentication → 401 error
   - ❌ No `tax_calculator` feature access → 403 error

---

## Example: John Adeleke Property

**Property Data**:
- Name: "John Adeleke"
- ID: `3b067363-2bae-4f0c-a583-369c2ddd0fb6`

**Payment Transactions (2025)**:
- Payment 1: `amount = 200000`, `paidAt = 2025-01-15`, `status = 'completed'`, `type = 'rent'` → ✅ Included
- Payment 2: `amount = 200000`, `paidAt = 2025-06-20`, `status = 'completed'`, `type = 'rent'` → ✅ Included
- Payment 3: `amount = 200000`, `paidAt = 2024-12-20`, `status = 'completed'`, `type = 'rent'` → ❌ Excluded (2024, not 2025)

**Calculation**:
1. Payments found for 2025: ✅ 2 payments
2. Total revenue: `200000 + 200000 = 400000`
3. Final revenue: `400000`

**Expected Result**:
- **Total Revenue**: ₦400,000.00 (sum of all rent payments received in 2025)
- **Total Expenses**: ₦0.00 (if no expenses paid in 2025)
- **Net Taxable Income**: ₦400,000.00

---

**Last Updated**: December 2025  
**Related**: `docs/TAX_CALCULATOR_EXPENSE_DETERMINATION.md`, `docs/NIGERIA_TAX_REFORM_2026_IMPLEMENTATION.md`

