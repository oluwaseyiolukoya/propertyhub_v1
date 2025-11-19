# Invoice Status Color Consistency Fix

## Issue
The "Pending" status badge in the Project Invoices page had a different color/style than the Purchase Orders page, creating visual inconsistency.

## Solution
Updated the Project Invoices page to use the same amber color for "Pending" status as the Purchase Orders page.

## Changes Made

### File: `src/modules/developer-dashboard/components/ProjectInvoicesPage.tsx`

**Before:**
```typescript
pending: { 
  variant: 'outline' as const, 
  icon: Clock, 
  label: 'Pending', 
  className: '' 
},
```
- Used outline variant (gray border, no background)
- No custom styling

**After:**
```typescript
pending: { 
  variant: 'default' as const, 
  icon: Clock, 
  label: 'Pending', 
  className: 'bg-amber-500 hover:bg-amber-600 text-white' 
},
```
- Uses default variant with custom amber background
- Matches Purchase Orders page styling exactly

## Status Badge Colors (Consistent Across Both Pages)

| Status    | Color       | Background Class | Icon         |
|-----------|-------------|------------------|--------------|
| Pending   | Amber       | `bg-amber-500`   | Clock        |
| Approved  | Outline     | (default)        | CheckCircle  |
| Paid      | Green       | `bg-green-600`   | CheckCircle  |
| Rejected  | Red         | `destructive`    | XCircle      |

## Visual Comparison

### Before
- **Purchase Orders**: 🟡 Amber badge with white text
- **Project Invoices**: ⚪ Gray outline badge

### After
- **Purchase Orders**: 🟡 Amber badge with white text
- **Project Invoices**: 🟡 Amber badge with white text ✅

## Testing

1. Navigate to Purchase Orders page
2. Note the "Pending" status color (amber/yellow)
3. Navigate to Project Invoices page
4. Verify "Pending" status matches the same amber/yellow color
5. Check hover states work correctly

## Files Modified
- `src/modules/developer-dashboard/components/ProjectInvoicesPage.tsx`

## Summary
✅ **Consistent styling** across Purchase Orders and Project Invoices
✅ **Improved visual hierarchy** with color-coded statuses
✅ **Better user experience** with predictable status colors

