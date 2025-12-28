# Tax Calculation Results - Detailed Explanation

This document explains how the **Tax Calculation Results** are computed in the Tax Calculator, step by step, with formulas and examples.

## Overview

The Tax Calculator implements **Nigeria Tax Act (NTA) 2025** calculations, effective January 1, 2026. It calculates tax obligations for property owners based on rental income and property expenses.

---

## Calculation Flow

### Step 1: Determine Rental Income

**Source:** Payment transactions (cash basis accounting)

**Formula:**
```
Rental Income = Sum of all rent payments received in the tax year
```

**Details:**
- Queries the `payments` table for the selected property
- Filters by:
  - `propertyId`: Selected property only
  - `type: 'rent'`: Only rent payments (excludes subscriptions)
  - `status: ['completed', 'success']`: Only successful payments
  - `paidAt`: Payment date within the selected tax year
- Sums all payment amounts to get total revenue

**Example:**
- Payment 1: ₦700,000 (paid Dec 2, 2025)
- Payment 2: ₦500,000 (paid Dec 2, 2025)
- Payment 3: ₦120,000 (paid Dec 17, 2025)
- **Total Rental Income = ₦1,320,000**

**Note:** If no payments are found, the system falls back to calculating from active leases (accrual basis), but this is not preferred for tax purposes.

---

### Step 2: Calculate Total Income

**Formula:**
```
Total Income = Rental Income
```

**Details:**
- For property-specific calculations, only rental income is considered
- Other income sources are not included (personal income, dividends, etc.)

**Example:**
- Rental Income: ₦1,320,000
- **Total Income = ₦1,320,000**

---

### Step 3: Calculate Total Deductions (Property Expenses)

**Source:** Expense records from the Expenses page

**Formula:**
```
Total Deductions = Sum of all property expenses paid in the tax year
```

**Details:**
- Queries the `expenses` table for the selected property
- Filters by:
  - `propertyId`: Selected property only
  - `category: { not: 'Property Tax' }`: Excludes Property Tax (shown separately)
  - `status: { in: ['paid', 'pending'] }`: Only paid or pending expenses
  - `paidDate` (or `date` if `paidDate` is null): Expense date within the tax year
- Sums all expense amounts to get total deductions

**Example:**
- Maintenance: ₦200,000 (paid in 2025)
- **Total Deductions = ₦200,000**

---

### Step 4: Calculate Taxable Income

**Formula:**
```
Taxable Income = max(0, Total Income - Total Deductions)
```

**Details:**
- Taxable income cannot be negative
- If expenses exceed income, taxable income is set to 0

**Example:**
- Total Income: ₦1,320,000
- Total Deductions: ₦200,000
- **Taxable Income = ₦1,320,000 - ₦200,000 = ₦1,120,000**

---

### Step 5: Calculate Personal Income Tax (PIT)

**Method:** Progressive tax brackets (NTA 2025)

**Tax Brackets:**
| Income Range | Tax Rate | Description |
|-------------|----------|-------------|
| ₦0 - ₦800,000 | 0% | Tax-Free (Exempt) |
| ₦800,001 - ₦3,000,000 | 15% | First taxable bracket |
| ₦3,000,001 - ₦12,000,000 | 18% | Second bracket |
| ₦12,000,001 - ₦25,000,000 | 21% | Third bracket |
| ₦25,000,001 - ₦50,000,000 | 23% | Fourth bracket |
| Above ₦50,000,000 | 25% | Highest bracket |

**Calculation Method:**
1. Apply each bracket sequentially
2. Calculate tax for income within each bracket
3. Sum all bracket taxes

**Formula:**
```
PIT = Σ (Income in Bracket × Bracket Rate)
```

**Example Calculation for ₦1,120,000:**
1. **First ₦800,000** (0%): ₦800,000 × 0% = **₦0**
2. **Next ₦320,000** (15%): ₦320,000 × 15% = **₦48,000**
3. **Total PIT = ₦0 + ₦48,000 = ₦48,000**

**Breakdown Display:**
- Bracket 1: ₦800,000 at 0% = ₦0
- Bracket 2: ₦320,000 at 15% = ₦48,000
- **Total PIT: ₦48,000**

---

### Step 6: Calculate Withholding Tax

**Formula:**
```
Withholding Tax = Rental Income × 10%
```

**Details:**
- Applied to all rental income (regardless of taxable income)
- Standard rate: 10% (NTA 2025)
- This is a separate tax from Personal Income Tax

**Example:**
- Rental Income: ₦1,320,000
- **Withholding Tax = ₦1,320,000 × 10% = ₦132,000**

**Note:** Withholding tax is typically deducted at source by tenants or property managers.

---

### Step 7: Calculate Property Taxes

**Source:** Expense records categorized as "Property Tax"

**Formula:**
```
Property Taxes = Sum of all "Property Tax" expenses paid in the tax year
```

**Details:**
- Queries the `expenses` table for expenses with `category: 'Property Tax'`
- Filters by:
  - `propertyId`: Selected property only
  - `status: { in: ['paid', 'pending'] }`: Only paid or pending expenses
  - `paidDate` (or `date`): Expense date within the tax year

**Example:**
- Property Tax expense: ₦0 (no property tax expenses recorded)
- **Property Taxes = ₦0**

---

### Step 8: Calculate Capital Gains Tax (CGT) - If Applicable

**Note:** Currently not used in property-specific calculations (focus on rental income only).

**Formula (for reference):**
```
Total Allowable Costs = Purchase Price + Improvements + Disposal Costs
Chargeable Gain = Sales Proceeds - Total Allowable Costs
CGT = Chargeable Gain × Rate (if gain > 0)
```

**Rates:**
- **Individuals:** Progressive rates (15-25%) - same as PIT brackets
- **Companies:** 30% flat rate
- **Primary Residence:** 0% (exempt)

**Example:**
- Not applicable for rental income calculations
- **CGT = ₦0**

---

### Step 9: Calculate Stamp Duty - If Applicable

**Note:** Currently not used in property-specific calculations (focus on rental income only).

**Formula (for reference):**
```
If value < ₦10 million: Stamp Duty = 0 (exempt)

Sales Agreements:
  Stamp Duty = Property Value × 0.78%

Lease Agreements:
  Short-term (< 7 years): Stamp Duty = (Annual Rent × Duration) × 0.78%
  Long-term (8-21 years): Stamp Duty = (Annual Rent × Duration) × 3%
```

**Example:**
- Not applicable for rental income calculations
- **Stamp Duty = ₦0**

---

### Step 10: Calculate Land Use Charge (LUC) - If Applicable

**Note:** Currently not used in property-specific calculations (focus on rental income only).

**Formula (for reference):**
```
LUC = Property Market Value × Applicable Rate

Rates (Lagos example):
  - Owner Occupied: 0.076%
  - Rented Residential: 0.76%
  - Commercial: 0.76%

Early Payment Discount:
  If paid within first 30 days of fiscal year: 15% discount
```

**Example:**
- Not applicable for rental income calculations
- **LUC = ₦0**

---

### Step 11: Calculate Total Tax Liability

**Formula:**
```
Total Tax Liability = Personal Income Tax + Capital Gains Tax + Property Taxes + Stamp Duty + Land Use Charge + Withholding Tax
```

**Example:**
- Personal Income Tax: ₦48,000
- Capital Gains Tax: ₦0
- Property Taxes: ₦0
- Stamp Duty: ₦0
- Land Use Charge: ₦0
- Withholding Tax: ₦132,000
- **Total Tax Liability = ₦48,000 + ₦0 + ₦0 + ₦0 + ₦0 + ₦132,000 = ₦180,000**

---

## Complete Example Calculation

### Input Data:
- **Property:** Adewole Estate
- **Tax Year:** 2025
- **Rental Income (from payments):** ₦1,320,000
- **Property Expenses:** ₦200,000

### Calculation Steps:

1. **Total Rental Income:** ₦1,320,000
2. **Total Income:** ₦1,320,000
3. **Total Deductions:** ₦200,000
4. **Taxable Income:** ₦1,320,000 - ₦200,000 = **₦1,120,000**
5. **Personal Income Tax:**
   - First ₦800,000 (0%): ₦0
   - Next ₦320,000 (15%): ₦48,000
   - **Total PIT: ₦48,000**
6. **Withholding Tax:** ₦1,320,000 × 10% = **₦132,000**
7. **Property Taxes:** ₦0
8. **Capital Gains Tax:** ₦0
9. **Stamp Duty:** ₦0
10. **Land Use Charge:** ₦0
11. **Total Tax Liability:** ₦48,000 + ₦132,000 = **₦180,000**

### Result Summary:
- **Rental Income:** ₦1,320,000
- **Property Expenses:** ₦200,000
- **Taxable Income:** ₦1,120,000
- **Personal Income Tax:** ₦48,000
- **Withholding Tax:** ₦132,000
- **Total Tax Liability:** ₦180,000

---

## Key Points

1. **Cash Basis Accounting:** Revenue is recognized when payments are received (not when leases are signed).

2. **Progressive Tax System:** Tax rates increase as taxable income increases, with the first ₦800,000 exempt.

3. **Withholding Tax:** Applied to all rental income (10%), separate from Personal Income Tax.

4. **Property Expenses:** Only expenses with status "paid" or "pending" are included, and they must be paid within the tax year.

5. **Taxable Income Cannot Be Negative:** If expenses exceed income, taxable income is set to 0, but withholding tax still applies.

6. **Property-Specific Focus:** The calculator focuses solely on rental income and property expenses, excluding personal income, rent relief, and other deductions.

---

## Tax Bracket Visualization

For a taxable income of ₦1,120,000:

```
┌─────────────────────────────────────────┐
│ Tax Bracket Breakdown                   │
├─────────────────────────────────────────┤
│ ₦0 - ₦800,000      @ 0%    = ₦0        │
│ ₦800,001 - ₦1,120,000 @ 15% = ₦48,000  │
├─────────────────────────────────────────┤
│ Total PIT:                    ₦48,000   │
└─────────────────────────────────────────┘
```

---

## References

- **Nigeria Tax Act (NTA) 2025:** Effective January 1, 2026
- **Progressive Tax Brackets:** 6 brackets, exempt up to ₦800,000
- **Withholding Tax Rate:** 10% on rental income
- **Cash Basis Accounting:** Revenue recognized when payment is received

---

**Last Updated:** December 2025
**Status:** Current implementation for property-specific tax calculations


