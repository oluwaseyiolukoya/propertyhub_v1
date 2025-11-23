# Price Standardization Fix

## Issue
Prices were stored inconsistently in the database:
- **Some plans** (Starter, Professional, Enterprise): Stored in **Naira** (500, 1200, 2500)
- **Other plans** (Developer Lite, Pro, Enterprise): Stored in **kobo** (19900, 39900, 99900)

This caused:
1. **Incorrect email amounts**: Upgrade emails showed ₦199 instead of ₦19,900
2. **Wrong Paystack charges**: Frontend multiplied by 100 again, charging 100x more
3. **Display inconsistencies**: Some plans showed correct prices, others didn't

## Root Cause
- **Paystack API** expects amounts in **kobo** (smallest currency unit)
- **Industry standard** is to store monetary values in smallest unit to avoid floating-point errors
- Frontend code assumed prices were in Naira and multiplied by 100
- Database had mixed formats from different data entry methods

## Solution

### 1. Database Standardization
Updated all plan prices to **kobo** (smallest unit):

```sql
-- Starter: ₦500 → 50,000 kobo
UPDATE plans SET "monthlyPrice" = 50000, "annualPrice" = 500000 WHERE id = 'plan-starter-1';

-- Professional: ₦1,200 → 120,000 kobo
UPDATE plans SET "monthlyPrice" = 120000, "annualPrice" = 1200000 WHERE id = 'plan-professional-1';

-- Enterprise: ₦2,500 → 250,000 kobo
UPDATE plans SET "monthlyPrice" = 250000, "annualPrice" = 2500000 WHERE id = 'plan-enterprise-1';
```

**Result**: All plans now store prices in kobo consistently.

### 2. Frontend Payment Logic
**File**: `src/components/UpgradeModal.tsx`

**Before**:
```typescript
const amountInKobo = Math.round(price * 100); // Wrong: multiplied by 100
```

**After**:
```typescript
// Prices are already stored in kobo in the database, so use them directly
const amountInKobo = Math.round(price);
```

### 3. Frontend Display Logic
Updated all display functions to **divide by 100** when showing prices to users:

#### UpgradeModal.tsx
```typescript
// Plan selection cards
{plan.currency} {(planPrice / 100).toFixed(2)}

// Payment summary
{selectedPlanData?.currency} {(price / 100).toFixed(2)}

// Pay button
Pay {selectedPlanData?.currency} {(price / 100).toFixed(2)}
```

#### CurrencyContext.tsx
```typescript
const formatCurrency = (amount: number, code?: string) => {
  const c = getCurrency(code || currency);
  // Prices are stored in kobo, so divide by 100 to display in Naira
  return `${c.symbol}${Number((amount || 0) / 100).toLocaleString()}`;
};
```

#### pricing.ts
```typescript
export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  // Prices are stored in kobo, so divide by 100 to display in Naira
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);
};
```

### 4. Backend Email Logic
**File**: `backend/src/lib/email.ts`

**Already correct** - was dividing by 100:
```typescript
const formattedPrice = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: params.currency,
  minimumFractionDigits: 0,
}).format(params.newPlanPrice / 100); // ✅ Correct
```

## Verification

### Before Fix
- Database: Developer Lite = 19900 kobo
- Frontend multiplies: 19900 × 100 = 1,990,000 kobo
- Paystack charges: ₦19,900 (100x too much!)
- Email shows: ₦199 (correct after division, but payment was wrong)

### After Fix
- Database: Developer Lite = 19900 kobo
- Frontend uses directly: 19900 kobo
- Paystack charges: ₦199.00 (correct!)
- Email shows: ₦199.00 (correct!)
- UI displays: ₦199.00 (correct!)

## Testing Checklist

- [x] Database prices updated to kobo
- [x] Frontend payment sends correct amount to Paystack
- [x] UI displays prices correctly (divided by 100)
- [x] Email shows correct price (divided by 100)
- [x] Admin dashboard shows correct prices
- [x] Landing page shows correct prices
- [x] Upgrade modal shows correct prices

## Files Modified

### Backend
- `backend/prisma/schema.prisma` - No changes (already Float)
- Database: Updated 3 plan records via SQL

### Frontend
- `src/components/UpgradeModal.tsx` - Removed × 100, added / 100 for display
- `src/types/pricing.ts` - Added / 100 to formatCurrency
- `src/lib/CurrencyContext.tsx` - Added / 100 to formatCurrency

### Email
- `backend/src/lib/email.ts` - Already correct (no changes needed)

## Best Practices Established

1. **Always store monetary values in smallest unit** (kobo, cents, pence)
2. **Never use floating-point for money** (use integers)
3. **Divide by 100 only for display** (never for calculations)
4. **Multiply by 100 only when converting user input** (if accepting Naira)
5. **Document currency unit** in code comments

## Future Considerations

- Add database constraint or comment to document that prices are in kobo
- Consider adding a `priceInKobo` field name to make it explicit
- Add validation in admin panel to ensure prices are entered correctly
- Add unit tests for currency conversion functions

---

**Date**: November 23, 2025  
**Status**: ✅ Fixed  
**Impact**: Critical - Affects all payments and pricing displays

