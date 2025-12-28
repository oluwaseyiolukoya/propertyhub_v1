# How Property Expenses (Deductions) Are Determined

## Overview

When you select a **Tax Year** and **Property** in the Tax Calculator, the system automatically fetches and calculates Property Expenses using the same logic as your Financial Reports. This ensures consistency across your property management platform.

---

## Step-by-Step Process

### Step 1: Verify Property Ownership

Before fetching expenses, the system verifies the property belongs to you:

1. **Get your properties:** Finds all properties where you are the owner (`ownerId = your userId`)
2. **Verify selection:** Checks if the selected property is in your property list
3. **Security check:** Ensures you can only access expenses for your own properties

This matches the same security model used in the **Expenses page**.

### Step 2: Query Expenses from Database

The system queries the `expenses` table with these filters (same as Expenses page):

```sql
WHERE:
  - propertyId = [Selected Property ID]  (must be in your property list)
  - propertyId IN [Your Property IDs]    (security: only your properties)
  - category != 'Property Tax'           (Property Tax is calculated separately)
  - status IN ['paid', 'pending']        (same as Expenses page)
```

**What this means:**

- ✅ Only expenses for the selected property
- ✅ Only expenses with status "paid" or "pending" (excludes "cancelled", "draft", etc.)
- ✅ Excludes "Property Tax" category (shown separately in tax calculation)

---

### Step 3: Filter by Tax Year

The system determines which expenses belong to the selected tax year using the **payment date**:

```javascript
For each expense:
  1. Check if expense has a paidDate
     - If YES: Use paidDate to determine tax year
     - If NO: Use date (expense creation date) as fallback

  2. Extract the year from the date
     expenseYear = new Date(paidDate || date).getFullYear()

  3. Include expense if:
     expenseYear === selectedTaxYear
```

**Example:**

- **Tax Year Selected:** 2025
- **Expense 1:** paidDate = "2025-03-15" → ✅ Included (year is 2025)
- **Expense 2:** paidDate = "2024-12-20" → ❌ Excluded (year is 2024)
- **Expense 3:** paidDate = null, date = "2025-06-10" → ✅ Included (uses date, year is 2025)

**Why use `paidDate`?**

- For tax purposes, expenses are counted when they are **paid**, not when they are created
- This matches accounting principles: expenses reduce taxable income in the year they are paid
- If an expense was created in 2024 but paid in 2025, it belongs to 2025 tax year

---

### Step 4: Calculate Total Expenses

The system sums up all matching expenses:

```javascript
totalExpenses = expensesForYear.reduce((sum, expense) => {
  return sum + expense.amount;
}, 0);
```

**Example:**

- Maintenance: ₦50,000
- Repairs: ₦30,000
- Management Fees: ₦20,000
- **Total:** ₦100,000

---

### Step 5: Group by Category (for Breakdown)

The system groups expenses by category to show the breakdown:

```javascript
Category Breakdown:
  - Maintenance: ₦50,000
  - Repairs: ₦30,000
  - Management: ₦20,000
  - Total: ₦100,000
```

This breakdown is displayed in the UI so you can see exactly which expenses are included.

---

## Key Rules

### ✅ Included Expenses

1. **Property Match:** Expense must be for the selected property
2. **Status:** Must be "paid" or "pending"
3. **Tax Year:** Payment date (or creation date) must match selected tax year
4. **Category:** Any category except "Property Tax"

### ❌ Excluded Expenses

1. **Property Tax:** Calculated separately (shown as "Property Taxes" in results)
2. **Wrong Property:** Expenses for other properties
3. **Wrong Year:** Expenses paid in a different tax year
4. **Wrong Status:** Expenses with status "cancelled", "draft", etc.

---

## Example Scenarios

### Scenario 1: Simple Case

**Selected:**

- Tax Year: 2025
- Property: "Adewole Estate"

**Expenses in Database:**

```
Expense 1: Maintenance, ₦50,000, paidDate: 2025-03-15, status: paid, propertyId: "Adewole Estate"
Expense 2: Repairs, ₦30,000, paidDate: 2025-06-20, status: paid, propertyId: "Adewole Estate"
Expense 3: Property Tax, ₦10,000, paidDate: 2025-01-10, status: paid, propertyId: "Adewole Estate"
Expense 4: Maintenance, ₦20,000, paidDate: 2024-12-20, status: paid, propertyId: "Adewole Estate"
```

**Result:**

- ✅ Expense 1: Included (2025, paid, not Property Tax)
- ✅ Expense 2: Included (2025, paid, not Property Tax)
- ❌ Expense 3: Excluded (Property Tax category - shown separately)
- ❌ Expense 4: Excluded (2024, not 2025)
- **Total Deductions:** ₦80,000 (Expense 1 + Expense 2)

---

### Scenario 2: Using Fallback Date

**Selected:**

- Tax Year: 2025
- Property: "Adewole Estate"

**Expenses in Database:**

```
Expense 1: Maintenance, ₦50,000, paidDate: null, date: 2025-03-15, status: paid
Expense 2: Repairs, ₦30,000, paidDate: 2025-06-20, date: 2025-05-10, status: paid
```

**Result:**

- ✅ Expense 1: Included (uses `date` since `paidDate` is null, year is 2025)
- ✅ Expense 2: Included (uses `paidDate`, year is 2025)
- **Total Deductions:** ₦80,000

---

### Scenario 3: Pending Expenses

**Selected:**

- Tax Year: 2025
- Property: "Adewole Estate"

**Expenses in Database:**

```
Expense 1: Maintenance, ₦50,000, paidDate: 2025-03-15, status: paid
Expense 2: Repairs, ₦30,000, paidDate: 2025-06-20, status: pending
Expense 3: Management, ₦20,000, paidDate: 2025-08-10, status: cancelled
```

**Result:**

- ✅ Expense 1: Included (paid, 2025)
- ✅ Expense 2: Included (pending, 2025)
- ❌ Expense 3: Excluded (cancelled status)
- **Total Deductions:** ₦80,000

---

## Technical Implementation

### Backend Endpoint

**Route:** `GET /api/tax/auto-fetch`

**Query Parameters:**

- `taxYear`: The selected tax year (e.g., 2025)
- `propertyId`: The selected property ID

**Response:**

```json
{
  "success": true,
  "data": {
    "otherDeductions": 100000,
    "expenseBreakdown": [
      { "category": "Maintenance", "amount": 50000 },
      { "category": "Repairs", "amount": 30000 },
      { "category": "Management", "amount": 20000 }
    ]
  }
}
```

### Code Location

**File:** `backend/src/routes/tax.ts`  
**Function:** `GET /api/tax/auto-fetch` (lines 156-352)

**Key Code:**

```typescript
// Get all expenses for the property
const allExpenses = await prisma.expenses.findMany({
  where: {
    propertyId: propertyId as string,
    category: { not: "Property Tax" },
    status: { in: ["paid", "pending"] },
  },
  select: {
    amount: true,
    category: true,
    date: true,
    paidDate: true,
  },
});

// Filter by tax year using paidDate (or date if paidDate is null)
const expensesForYear = allExpenses.filter((expense) => {
  const expenseDate = expense.paidDate || expense.date;
  if (!expenseDate) return false;
  const expenseYear = new Date(expenseDate).getFullYear();
  return expenseYear === year;
});

// Calculate total
const propertyExpenses = expensesForYear.reduce(
  (sum, exp) => sum + (exp.amount || 0),
  0
);
```

---

## Why This Approach?

### 1. **Consistency with Financial Reports**

- Uses the same logic as your Financial Reports
- Ensures tax calculations match your financial overview
- No discrepancies between reports and tax calculations

### 2. **Tax Accounting Principles**

- Expenses are counted when **paid**, not when created
- Matches standard accounting practices
- Aligns with tax office requirements

### 3. **Automatic and Accurate**

- No manual entry required
- Reduces errors
- Always up-to-date with your expense records

---

## Common Questions

### Q: Why don't I see my expenses?

**A:** Check:

1. Is the expense for the correct property?
2. Is the expense status "paid" or "pending"?
3. Was the expense paid in the selected tax year?
4. Is the expense category "Property Tax" (shown separately)?

### Q: Can I manually override expenses?

**A:** No. Expenses come directly from your expense records. To update expenses:

1. Go to the **Expenses section**
2. Update the expense record
3. The tax calculator will automatically reflect the change

### Q: What if an expense was created in 2024 but paid in 2025?

**A:** It will be included in 2025 tax year (uses `paidDate`). This is correct for tax purposes.

### Q: Why are "pending" expenses included?

**A:** Pending expenses are included because they represent obligations that will be paid. This matches financial report logic and provides a complete picture.

---

## Summary

**Property Expenses are determined by:**

1. ✅ Verifying property ownership (using `ownerId`, same as Expenses page)
2. ✅ Selecting expenses for the chosen property (must be in your property list)
3. ✅ Filtering by status ("paid" or "pending" - same as Expenses page)
4. ✅ Filtering by tax year (using `paidDate` or `date`)
5. ✅ Excluding "Property Tax" category
6. ✅ Summing all matching expenses
7. ✅ Grouping by category for breakdown

**Key Point:** Expenses are fetched using the **exact same logic as the Expenses page**, ensuring complete consistency between what you see in the Expenses section and what's used in tax calculations.

**Result:** Accurate, automatic expense calculation that matches your financial reports and tax accounting principles.

---

**Last Updated:** December 2025  
**Related:** `docs/NIGERIA_TAX_REFORM_2026_IMPLEMENTATION.md`
