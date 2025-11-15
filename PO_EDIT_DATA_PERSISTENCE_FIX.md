# Purchase Order Edit Data Persistence Fix

## Problem
When creating a new Purchase Order and then clicking "Edit", some data fields were showing as empty even though they were saved in the database. This included:
- Terms
- Notes
- Expiry Date
- Delivery Date
- Line Items (quantity, unit price, etc.)

## Root Cause
The issue was in the frontend data mapping and form population:

1. **Incomplete Interface**: The `PurchaseOrder` interface in `PurchaseOrdersPage.tsx` was missing several fields that exist in the database.

2. **Incomplete Mapping**: The `mapAPIPurchaseOrder` function wasn't mapping all fields from the API response to the component's PO object.

3. **Hardcoded Empty Values**: The `handleOpenEditPO` function was setting several fields to empty strings (`''`) instead of using the actual values from the selected PO.

## Solution

### 1. Extended PurchaseOrder Interface
Added missing fields to the interface:

```typescript
interface PurchaseOrder {
  // ... existing fields ...
  terms?: string;
  notes?: string;
  expiryDate?: string;
  deliveryDate?: string;
  currency?: string;
  lineItems?: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit?: string;
    category?: string;
    notes?: string;
  }>;
}
```

### 2. Updated mapAPIPurchaseOrder Function
Now maps all fields from the API response:

```typescript
const mapAPIPurchaseOrder = (po: APIPurchaseOrder): PurchaseOrder => ({
  // ... existing mappings ...
  terms: po.terms,
  notes: po.notes,
  expiryDate: po.expiryDate,
  deliveryDate: po.deliveryDate,
  currency: po.currency,
  lineItems: po.items?.map(item => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    unit: item.unit,
    category: item.category,
    notes: item.notes,
  })),
});
```

### 3. Fixed handleOpenEditPO Function
Now properly populates all form fields from the selected PO:

```typescript
const handleOpenEditPO = (po: PurchaseOrder) => {
  setEditingPO(po);
  
  // Format dates for input fields (YYYY-MM-DD)
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };
  
  setPoFormData({
    vendorId: po.vendorId || '',
    vendorName: po.vendor,
    description: po.description || '',
    category: po.category || po.budgetLine || '',
    totalAmount: po.amount.toString(),
    currency: po.currency || 'NGN',
    terms: po.terms || '',  // ✅ Now uses actual value
    notes: po.notes || '',  // ✅ Now uses actual value
    expiryDate: formatDateForInput(po.expiryDate),  // ✅ Now uses actual value
    deliveryDate: formatDateForInput(po.deliveryDate),  // ✅ Now uses actual value
    items: po.lineItems?.map(item => ({  // ✅ Now uses actual items
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      unit: item.unit || 'pcs',
      category: item.category || po.category || '',
    })) || [],
  });
  setIsEditPOOpen(true);
};
```

## Backend Verification
The backend already includes all necessary data in the response:
- Line 66 in `purchase-orders.ts`: `items: true` - includes all line items
- All PO fields (terms, notes, dates) are already being saved and returned

## Result
✅ **All data is now properly persisted and displayed when editing a PO**
- Terms field shows saved value
- Notes field shows saved value
- Expiry Date shows saved value
- Delivery Date shows saved value
- Line Items array is populated with all saved items
- Currency is preserved

## Files Modified
1. `src/modules/developer-dashboard/components/PurchaseOrdersPage.tsx`
   - Extended `PurchaseOrder` interface
   - Updated `mapAPIPurchaseOrder` function
   - Fixed `handleOpenEditPO` function

## Testing
To verify the fix:
1. Create a new Purchase Order with all fields filled (terms, notes, dates, line items)
2. Save the PO
3. Click the three-dot menu and select "Edit"
4. Verify all fields are populated with the saved data

