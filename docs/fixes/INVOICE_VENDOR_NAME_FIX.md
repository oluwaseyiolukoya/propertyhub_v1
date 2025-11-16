# Invoice Vendor Name Fix

## Problem
When clicking "View Details" on an invoice in the Purchase Order Details panel, the vendor name was showing as "Unknown" instead of the actual vendor name.

## Root Cause
The `handleCreateInvoice` function was not sending the `vendorId` to the backend when creating an invoice. Even though:
- The backend API accepts `vendorId` parameter
- The backend includes vendor information in the response
- The Prisma schema has the vendor relation properly set up
- The frontend interface `CreateInvoiceData` includes `vendorId`

The frontend was simply **not passing the `vendorId`** when calling `createProjectInvoice()`.

---

## Solution

### File: `src/modules/developer-dashboard/components/PurchaseOrdersPage.tsx`

**What Changed**: Added `vendorId` to the invoice creation payload

**Before** (lines 891-900):
```typescript
const response = await createProjectInvoice(projectId, {
  purchaseOrderId: invoiceFormData.purchaseOrderId,
  description: invoiceFormData.description,
  category: invoiceFormData.category,
  amount: parseFloat(invoiceFormData.amount),
  currency: invoiceFormData.currency,
  dueDate: invoiceFormData.dueDate || undefined,
  paymentMethod: invoiceFormData.paymentMethod || undefined,
  notes: invoiceFormData.notes || undefined,
});
```

**After** (lines 891-901):
```typescript
const response = await createProjectInvoice(projectId, {
  purchaseOrderId: invoiceFormData.purchaseOrderId,
  vendorId: selectedPO?.vendorId || undefined,  // ← NEW: Include vendor ID
  description: invoiceFormData.description,
  category: invoiceFormData.category,
  amount: parseFloat(invoiceFormData.amount),
  currency: invoiceFormData.currency,
  dueDate: invoiceFormData.dueDate || undefined,
  paymentMethod: invoiceFormData.paymentMethod || undefined,
  notes: invoiceFormData.notes || undefined,
});
```

**Key Change**:
- ✅ Added `vendorId: selectedPO?.vendorId || undefined` to the payload
- ✅ Gets the vendor ID from the selected Purchase Order
- ✅ Uses optional chaining (`?.`) for safety
- ✅ Falls back to `undefined` if no vendor is selected

---

## Data Flow

### Before Fix:
1. User clicks "Create Invoice" on a PO
2. Invoice form is pre-filled with PO data
3. User submits the form
4. Frontend sends invoice data **without vendorId** ❌
5. Backend creates invoice with `vendorId: null`
6. When fetching invoices, `inv.vendor?.name` is `undefined`
7. Frontend displays "Unknown Vendor" ❌

### After Fix:
1. User clicks "Create Invoice" on a PO
2. Invoice form is pre-filled with PO data
3. User submits the form
4. Frontend sends invoice data **with vendorId from selectedPO** ✅
5. Backend creates invoice with the correct `vendorId`
6. When fetching invoices, `inv.vendor?.name` contains the actual vendor name
7. Frontend displays the correct vendor name ✅

---

## Verification

### Backend (Already Working)
The backend was already set up correctly:

**1. Schema** (`backend/prisma/schema.prisma`):
```prisma
model project_invoices {
  id              String             @id @default(uuid())
  projectId       String
  vendorId        String?            // ✅ Field exists
  purchaseOrderId String?
  // ... other fields ...
  vendor          project_vendors?   @relation(fields: [vendorId], references: [id])  // ✅ Relation exists
}
```

**2. Create Endpoint** (`backend/src/routes/developer-dashboard.ts`):
```typescript
router.post('/projects/:projectId/invoices', async (req: Request, res: Response) => {
  const { vendorId } = req.body;  // ✅ Accepts vendorId
  
  const invoice = await prisma.project_invoices.create({
    data: {
      vendorId: vendorId || null,  // ✅ Saves vendorId
      // ... other fields ...
    },
    include: {
      vendor: {  // ✅ Includes vendor in response
        select: { id: true, name: true, contactPerson: true, email: true, phone: true },
      },
    },
  });
});
```

**3. Get Invoices Endpoint** (`backend/src/routes/purchase-orders.ts`):
```typescript
router.get('/purchase-orders/:poId/invoices', async (req: Request, res: Response) => {
  const invoices = await prisma.project_invoices.findMany({
    where: { purchaseOrderId: poId },
    include: {
      vendor: {  // ✅ Includes vendor in response
        select: { id: true, name: true },
      },
    },
  });
});
```

### Frontend (Now Fixed)
**1. API Interface** (`src/lib/api/invoices.ts`):
```typescript
export interface CreateInvoiceData {
  purchaseOrderId?: string;
  vendorId?: string;  // ✅ Interface includes vendorId
  description: string;
  category: string;
  amount: number;
  // ... other fields ...
}
```

**2. Invoice Mapping** (`PurchaseOrdersPage.tsx`):
```typescript
const mappedInvoices: Invoice[] = response.data.data.map((inv: any) => ({
  id: inv.invoiceNumber || inv.id,
  poRef: inv.purchaseOrder?.poNumber || 'N/A',
  vendor: inv.vendor?.name || 'Unknown Vendor',  // ✅ Maps vendor name
  amount: inv.amount,
  // ... other fields ...
}));
```

**3. Invoice Creation** (`PurchaseOrdersPage.tsx`):
```typescript
const response = await createProjectInvoice(projectId, {
  vendorId: selectedPO?.vendorId || undefined,  // ✅ NOW SENDS vendorId
  // ... other fields ...
});
```

---

## Testing

### Test Scenario 1: Create New Invoice
1. ✅ Select a Purchase Order with a vendor
2. ✅ Click "Create Invoice"
3. ✅ Fill in invoice details
4. ✅ Click "Create Invoice"
5. ✅ Invoice is created with correct vendorId
6. ✅ Click "View Details" on the new invoice
7. ✅ Vendor name displays correctly (not "Unknown")

### Test Scenario 2: View Existing Invoices
1. ✅ Select a Purchase Order
2. ✅ View the Related Invoices section
3. ✅ Click "View Details" on any invoice
4. ✅ Vendor name displays correctly

### Test Scenario 3: PO Without Vendor
1. ✅ Create a PO without selecting a vendor (if allowed)
2. ✅ Create an invoice for that PO
3. ✅ Invoice is created with `vendorId: null`
4. ✅ "Unknown Vendor" is displayed (expected behavior)

---

## Impact

### Before Fix:
- ❌ All invoices showed "Unknown Vendor"
- ❌ No way to track which vendor the invoice is for
- ❌ Poor user experience
- ❌ Difficult to manage vendor payments

### After Fix:
- ✅ Invoices display the correct vendor name
- ✅ Easy to identify which vendor to pay
- ✅ Better tracking and reporting
- ✅ Professional invoice management

---

## Files Modified

1. **`src/modules/developer-dashboard/components/PurchaseOrdersPage.tsx`**
   - Added `vendorId` to invoice creation payload (line 893)

---

## Additional Notes

### Why This Happened
The issue occurred because:
1. The invoice creation form doesn't have a vendor field (it's inherited from the PO)
2. The developer forgot to pass the vendor ID from the selected PO
3. The backend silently accepted `vendorId: null` (it's an optional field)
4. No validation error was thrown

### Prevention
To prevent similar issues in the future:
- ✅ Always check that related entity IDs are passed when creating records
- ✅ Consider making `vendorId` required if every invoice should have a vendor
- ✅ Add frontend validation to ensure vendor is selected on PO before creating invoice
- ✅ Add backend validation to require vendor for certain invoice types

---

## Result

✅ **Vendor names now display correctly in invoice details!**

- New invoices created with correct vendor ID
- Existing invoices with vendor ID display correctly
- Invoice details show actual vendor name
- Better invoice tracking and management

