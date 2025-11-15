# Invoice Details Vendor and PO Reference Fix

## Problem
In the Invoice Details dialog, two fields were showing incorrect values:
1. **Vendor**: Showing "Unknown Vendor" instead of the actual vendor name
2. **PO Reference**: Showing "N/A" instead of the Purchase Order number

## Root Causes

### Issue 1: Missing `purchaseOrder` Relation in Backend
The backend endpoint `/purchase-orders/:poId/invoices` was **not including the `purchaseOrder` relation** in the response, even though invoices are linked to purchase orders via `purchaseOrderId`.

**Backend Code** (Before):
```typescript
const invoices = await prisma.project_invoices.findMany({
  where: { purchaseOrderId: poId },
  include: {
    vendor: { select: { id: true, name: true } },
    approver: { select: { id: true, name: true, email: true } },
    // ❌ Missing: purchaseOrder relation
  },
});
```

**Frontend Mapping** (Before):
```typescript
poRef: inv.purchaseOrder?.poNumber || 'N/A',  // ❌ Always 'N/A' because purchaseOrder is undefined
```

### Issue 2: Vendor Fallback Logic
The frontend was only checking `inv.vendor?.name`, but:
- Some existing invoices might not have `vendorId` set (created before the vendor fix)
- The vendor relation might be null even if `vendorId` exists
- No fallback to the PO's vendor was implemented

**Frontend Mapping** (Before):
```typescript
vendor: inv.vendor?.name || 'Unknown Vendor',  // ❌ No fallback to PO vendor
```

---

## Solution

### 1. Backend Enhancement

**File**: `backend/src/routes/purchase-orders.ts`

**What Changed**: Added `purchaseOrder` relation to the invoice query, including nested vendor information.

**After**:
```typescript
const invoices = await prisma.project_invoices.findMany({
  where: { purchaseOrderId: poId },
  include: {
    vendor: {
      select: {
        id: true,
        name: true,
        contactPerson: true,
        email: true,
        phone: true,
      },
    },
    purchaseOrder: {  // ✅ NEW: Include purchase order relation
      select: {
        id: true,
        poNumber: true,  // ✅ This provides the PO reference
        totalAmount: true,
        status: true,
        vendor: {  // ✅ Include PO's vendor as fallback
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    approver: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

**Benefits**:
- ✅ PO reference (`poNumber`) is now available in the response
- ✅ PO's vendor is included as a fallback option
- ✅ More complete invoice data for better display

### 2. Frontend Mapping Enhancement

**File**: `src/modules/developer-dashboard/components/PurchaseOrdersPage.tsx`

**What Changed**: Improved vendor name resolution with fallback logic and proper PO reference extraction.

**Before**:
```typescript
const mappedInvoices: Invoice[] = response.data.data.map((inv: any) => ({
  id: inv.invoiceNumber || inv.id,
  poRef: inv.purchaseOrder?.poNumber || 'N/A',  // ❌ Always 'N/A'
  vendor: inv.vendor?.name || 'Unknown Vendor',  // ❌ No fallback
  // ... other fields
}));
```

**After**:
```typescript
const mappedInvoices: Invoice[] = response.data.data.map((inv: any) => {
  // ✅ Fallback to PO vendor if invoice doesn't have vendor
  const vendorName = inv.vendor?.name || inv.purchaseOrder?.vendor?.name || 'Unknown Vendor';
  const poRef = inv.purchaseOrder?.poNumber || 'N/A';
  
  return {
    id: inv.invoiceNumber || inv.id,
    poRef: poRef,  // ✅ Now gets actual PO number
    vendor: vendorName,  // ✅ Uses invoice vendor, falls back to PO vendor
    // ... other fields
  };
});
```

**Fallback Logic**:
1. **First**: Try `inv.vendor?.name` (invoice's direct vendor)
2. **Second**: Try `inv.purchaseOrder?.vendor?.name` (PO's vendor as fallback)
3. **Last**: Use `'Unknown Vendor'` if neither exists

---

## Data Flow

### Before Fix:

**Backend Response**:
```json
{
  "data": [
    {
      "id": "inv-123",
      "invoiceNumber": "INV-2025-001",
      "vendor": { "id": "vendor-1", "name": "ABC Construction" },
      "purchaseOrderId": "po-456",
      // ❌ No purchaseOrder object
      "amount": 50000
    }
  ]
}
```

**Frontend Mapping**:
```typescript
poRef: undefined?.poNumber || 'N/A'  // ❌ Result: 'N/A'
vendor: { name: 'ABC Construction' }?.name || 'Unknown Vendor'  // ✅ Works IF vendor exists
```

### After Fix:

**Backend Response**:
```json
{
  "data": [
    {
      "id": "inv-123",
      "invoiceNumber": "INV-2025-001",
      "vendor": { "id": "vendor-1", "name": "ABC Construction" },
      "purchaseOrderId": "po-456",
      "purchaseOrder": {  // ✅ NEW: Purchase order included
        "id": "po-456",
        "poNumber": "PO-2025-001",  // ✅ PO reference available
        "vendor": { "id": "vendor-1", "name": "ABC Construction" }  // ✅ Fallback vendor
      },
      "amount": 50000
    }
  ]
}
```

**Frontend Mapping**:
```typescript
poRef: { poNumber: 'PO-2025-001' }?.poNumber || 'N/A'  // ✅ Result: 'PO-2025-001'
vendor: 'ABC Construction' || { name: 'ABC Construction' }?.name || 'Unknown Vendor'  // ✅ Result: 'ABC Construction'
```

---

## Scenarios Handled

### Scenario 1: Invoice with Direct Vendor
- Invoice has `vendorId` set
- Backend includes `vendor` relation
- **Result**: Shows invoice's vendor name ✅

### Scenario 2: Invoice without Vendor, but PO has Vendor
- Invoice doesn't have `vendorId` (old invoices)
- PO has `vendorId` set
- Backend includes PO's vendor in `purchaseOrder.vendor`
- **Result**: Falls back to PO's vendor name ✅

### Scenario 3: Neither Invoice nor PO has Vendor
- Both invoice and PO lack vendor information
- **Result**: Shows "Unknown Vendor" (expected) ✅

### Scenario 4: PO Reference
- Invoice has `purchaseOrderId`
- Backend includes `purchaseOrder` relation
- **Result**: Shows actual PO number (e.g., "PO-2025-001") ✅

---

## Testing Checklist

### Vendor Name Display
- [x] Invoice with direct vendor → Shows invoice vendor name
- [x] Invoice without vendor, PO has vendor → Shows PO vendor name (fallback)
- [x] Neither has vendor → Shows "Unknown Vendor"
- [x] New invoices created with vendorId → Shows correct vendor

### PO Reference Display
- [x] Invoice linked to PO → Shows PO number (e.g., "PO-2025-001")
- [x] Invoice not linked to PO → Shows "N/A" (expected)
- [x] PO number format correct → Matches PO numbering scheme

### Invoice Details Dialog
- [x] Click "View Details" → Vendor name displays correctly
- [x] Click "View Details" → PO Reference displays correctly
- [x] All invoice fields populate correctly
- [x] No "Unknown Vendor" or "N/A" for valid invoices

---

## Impact

### Before Fix:
- ❌ PO Reference always showed "N/A"
- ❌ Vendor showed "Unknown Vendor" for invoices without direct vendor
- ❌ No fallback mechanism for vendor lookup
- ❌ Incomplete invoice information displayed

### After Fix:
- ✅ PO Reference shows actual PO number
- ✅ Vendor name resolves with smart fallback
- ✅ Existing invoices without vendorId can still show vendor (from PO)
- ✅ Complete invoice information displayed
- ✅ Better user experience

---

## Files Modified

1. **Backend**
   - `backend/src/routes/purchase-orders.ts` - Added `purchaseOrder` relation to invoice query (lines 586-599)

2. **Frontend**
   - `src/modules/developer-dashboard/components/PurchaseOrdersPage.tsx` - Enhanced vendor fallback logic and PO reference mapping (lines 244-264)

---

## Additional Notes

### Why This Happened
1. **PO Reference**: The backend wasn't including the `purchaseOrder` relation, so the frontend couldn't access `poNumber`
2. **Vendor**: Some invoices were created before the vendor fix, so they don't have `vendorId` set. Without a fallback, they showed "Unknown Vendor"

### Prevention
To prevent similar issues:
- ✅ Always include related entities in API responses when they're needed for display
- ✅ Implement fallback logic for optional relations
- ✅ Test with both new and existing data
- ✅ Consider data migration for existing invoices without vendorId

---

## Result

✅ **Invoice Details now show correct vendor names and PO references!**

- PO Reference displays actual PO number (e.g., "PO-2025-001")
- Vendor name resolves intelligently with fallback
- Existing invoices without vendorId can still show vendor from PO
- Better invoice tracking and management
- Professional invoice details display

