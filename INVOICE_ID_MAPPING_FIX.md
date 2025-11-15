# Invoice ID Mapping Fix - "Invoice not found" Error

## Problem
When clicking "Confirm Payment & Create Expense" (Mark as Paid), the error **"Invoice not found"** appeared, even though the invoice existed in the database.

## Root Cause
The `Invoice` interface was using a single `id` field that was mapped to `invoiceNumber` (e.g., "INV-2025-001") instead of the actual database UUID.

**Before**:
```typescript
interface Invoice {
  id: string;  // Was set to invoiceNumber (e.g., "INV-2025-001")
  // ... other fields
}

// Mapping
const mappedInvoices = response.data.data.map((inv: any) => ({
  id: inv.invoiceNumber || inv.id,  // ❌ Using invoice number as ID
  // ...
}));
```

**The Problem**:
- Frontend displayed `invoice.id` as "INV-2025-001"
- When marking as paid, it sent "INV-2025-001" to the backend
- Backend expected a UUID (e.g., "abc-123-def-456")
- Backend query: `WHERE id = 'INV-2025-001'` → **Not found!** ❌

---

## Solution

### 1. Updated Invoice Interface

**File**: `src/modules/developer-dashboard/components/PurchaseOrdersPage.tsx`

**Before**:
```typescript
interface Invoice {
  id: string;  // Ambiguous - was invoice number
  poRef: string;
  vendor: string;
  // ...
}
```

**After**:
```typescript
interface Invoice {
  id: string; // Database UUID (for API calls)
  invoiceNumber: string; // Display number (e.g., INV-2025-001)
  poRef: string;
  vendor: string;
  // ...
}
```

**Key Change**: Added separate `invoiceNumber` field to distinguish between:
- `id`: Database UUID for API calls
- `invoiceNumber`: Human-readable number for display

### 2. Updated Invoice Mapping

**Before**:
```typescript
const mappedInvoices: Invoice[] = response.data.data.map((inv: any) => ({
  id: inv.invoiceNumber || inv.id,  // ❌ Wrong: Using invoice number
  // ...
}));
```

**After**:
```typescript
const mappedInvoices: Invoice[] = response.data.data.map((inv: any) => ({
  id: inv.id,                        // ✅ Database UUID for API calls
  invoiceNumber: inv.invoiceNumber || inv.id,  // ✅ Display number
  // ...
}));
```

### 3. Updated Display References

Updated all places where invoice number is displayed to use `invoiceNumber` instead of `id`:

#### A. Invoice List in PO Details (line 1334)
**Before**:
```typescript
<span className="font-medium text-gray-900">{invoice.id}</span>  // ❌ Shows UUID
```

**After**:
```typescript
<span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>  // ✅ Shows INV-2025-001
```

#### B. Invoice Detail Dialog Title (line 2130)
**Before**:
```typescript
<DialogDescription>
  {selectedInvoiceForDetail?.id} - {selectedInvoiceForDetail?.vendor}
</DialogDescription>
```

**After**:
```typescript
<DialogDescription>
  {selectedInvoiceForDetail?.invoiceNumber} - {selectedInvoiceForDetail?.vendor}
</DialogDescription>
```

#### C. Invoice Number Field (line 2140)
**Before**:
```typescript
<p className="text-base font-semibold text-gray-900">{selectedInvoiceForDetail.id}</p>
```

**After**:
```typescript
<p className="text-base font-semibold text-gray-900">{selectedInvoiceForDetail.invoiceNumber}</p>
```

### 4. API Call (Unchanged - Now Works!)

The API call was already correct, but now it receives the correct UUID:

```typescript
handleMarkInvoiceAsPaid(selectedInvoiceForDetail.id, {  // ✅ Now sends UUID
  paymentMethod: paymentFormData.paymentMethod,
  // ...
});
```

---

## Data Flow

### Before Fix:

1. **Backend Returns**:
   ```json
   {
     "id": "abc-123-def-456",           // UUID
     "invoiceNumber": "INV-2025-001"    // Display number
   }
   ```

2. **Frontend Mapping** (Wrong):
   ```typescript
   {
     id: "INV-2025-001"  // ❌ Overwrote UUID with invoice number
   }
   ```

3. **Display**:
   ```
   Invoice: INV-2025-001  ✅ Looks correct
   ```

4. **API Call** (Wrong):
   ```typescript
   POST /api/.../invoices/INV-2025-001/mark-paid  // ❌ Wrong ID
   ```

5. **Backend Query**:
   ```sql
   SELECT * FROM project_invoices WHERE id = 'INV-2025-001'  -- ❌ Not found!
   ```

### After Fix:

1. **Backend Returns**:
   ```json
   {
     "id": "abc-123-def-456",           // UUID
     "invoiceNumber": "INV-2025-001"    // Display number
   }
   ```

2. **Frontend Mapping** (Correct):
   ```typescript
   {
     id: "abc-123-def-456",        // ✅ Database UUID
     invoiceNumber: "INV-2025-001" // ✅ Display number
   }
   ```

3. **Display**:
   ```
   Invoice: INV-2025-001  ✅ Shows invoice number
   ```

4. **API Call** (Correct):
   ```typescript
   POST /api/.../invoices/abc-123-def-456/mark-paid  // ✅ Correct UUID
   ```

5. **Backend Query**:
   ```sql
   SELECT * FROM project_invoices WHERE id = 'abc-123-def-456'  -- ✅ Found!
   ```

---

## Why This Happened

This is a common mistake when working with databases that have both:
1. **Internal ID** (UUID) - for database relationships and API calls
2. **Display ID** (human-readable) - for user interface

The original implementation tried to use a single `id` field for both purposes, which caused confusion.

---

## Testing Checklist

### Invoice Display
- [x] Invoice list shows invoice number (INV-2025-001), not UUID
- [x] Invoice detail dialog title shows invoice number
- [x] Invoice number field shows invoice number

### Mark as Paid
- [x] Click "Mark as Paid" button
- [x] Fill in payment details
- [x] Click "Confirm Payment & Create Expense"
- [x] No "Invoice not found" error ✅
- [x] Success message appears
- [x] Invoice status updates to "Paid"
- [x] Expense is created

### API Calls
- [x] Backend receives correct UUID in API call
- [x] Backend finds invoice successfully
- [x] Invoice is updated in database
- [x] Expense is created in database

---

## Files Modified

1. **`src/modules/developer-dashboard/components/PurchaseOrdersPage.tsx`**
   - Updated `Invoice` interface to include both `id` and `invoiceNumber` (lines 98-114)
   - Updated invoice mapping to use correct fields (lines 259-260)
   - Updated invoice display in list (line 1334)
   - Updated invoice display in dialog title (line 2130)
   - Updated invoice number field (line 2140)

---

## Result

✅ **"Invoice not found" error is now fixed!**

### Before Fix:
- ❌ "Invoice not found" error when marking as paid
- ❌ Backend couldn't find invoice with invoice number
- ❌ No expense created
- ❌ Confusing error message

### After Fix:
- ✅ Invoice found successfully
- ✅ Invoice marked as paid
- ✅ Expense created automatically
- ✅ Proper separation of database ID and display number
- ✅ Better code clarity

---

## Best Practices Learned

1. **Separate Display IDs from Database IDs**
   - Use `id` for database UUID
   - Use `invoiceNumber`, `orderNumber`, etc. for display

2. **Clear Field Naming**
   - Don't overload a single `id` field
   - Use descriptive names that indicate purpose

3. **Type Safety**
   - Define clear interfaces with both fields
   - Document which field is for what purpose

4. **Consistent Mapping**
   - Always map database IDs to `id` field
   - Always map display numbers to their own field

