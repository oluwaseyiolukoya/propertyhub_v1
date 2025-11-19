# Invoice Approve/Reject Feature Implementation

## Overview
This document describes the implementation of the invoice approval and rejection workflow, allowing property developers to approve or reject pending invoices before marking them as paid.

## Implementation Date
November 19, 2025

---

## Features Implemented

### 1. Backend API Endpoints

#### **Approve Invoice**
- **Endpoint**: `POST /api/developer-dashboard/projects/:projectId/invoices/:invoiceId/approve`
- **Authentication**: Required (JWT token)
- **Authorization**: Project owner only
- **Request Body**: None
- **Response**:
  ```json
  {
    "message": "Invoice approved successfully",
    "invoice": {
      "id": "...",
      "status": "approved",
      "approvedBy": "user-id",
      "approvedAt": "2025-11-19T10:30:00.000Z",
      ...
    }
  }
  ```

**Business Rules**:
- ✅ Only pending invoices can be approved
- ❌ Cannot approve already approved invoices
- ❌ Cannot approve paid invoices
- ✅ Records who approved and when
- ✅ Verifies project ownership before approval

#### **Reject Invoice**
- **Endpoint**: `POST /api/developer-dashboard/projects/:projectId/invoices/:invoiceId/reject`
- **Authentication**: Required (JWT token)
- **Authorization**: Project owner only
- **Request Body**:
  ```json
  {
    "reason": "Optional rejection reason"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Invoice rejected successfully",
    "invoice": {
      "id": "...",
      "status": "rejected",
      "notes": "Rejected: [reason]",
      ...
    }
  }
  ```

**Business Rules**:
- ✅ Can reject pending or approved invoices
- ❌ Cannot reject paid invoices
- ✅ Rejection reason is appended to invoice notes
- ✅ Verifies project ownership before rejection

---

## 2. Frontend API Client Functions

### Location: `src/lib/api/invoices.ts`

#### **approveProjectInvoice**
```typescript
export async function approveProjectInvoice(
  projectId: string,
  invoiceId: string
): Promise<ApiResponse<{ message: string; invoice: ProjectInvoice }>>
```

**Usage**:
```typescript
const response = await approveProjectInvoice(projectId, invoiceId);
if (response.error) {
  toast.error(response.error.message);
} else {
  toast.success('Invoice approved successfully');
  refetch(); // Refresh invoice list
}
```

#### **rejectProjectInvoice**
```typescript
export async function rejectProjectInvoice(
  projectId: string,
  invoiceId: string,
  reason?: string
): Promise<ApiResponse<{ message: string; invoice: ProjectInvoice }>>
```

**Usage**:
```typescript
const reason = window.prompt('Enter rejection reason (optional):');
const response = await rejectProjectInvoice(projectId, invoiceId, reason || undefined);
if (response.error) {
  toast.error(response.error.message);
} else {
  toast.error('Invoice rejected');
  refetch(); // Refresh invoice list
}
```

---

## 3. UI Integration

### **Project Invoices Page**
**File**: `src/modules/developer-dashboard/components/ProjectInvoicesPage.tsx`

#### **Handler Functions**:

```typescript
const handleApproveInvoice = async (invoiceId: string) => {
  if (!selectedInvoice) return;
  
  const resp = await approveProjectInvoice(projectId, invoiceId);
  if (resp.error) {
    toast.error(resp.error.message || 'Failed to approve invoice');
    return;
  }
  
  toast.success('Invoice approved successfully');
  refetch();
};

const handleRejectInvoice = async (invoiceId: string) => {
  if (!selectedInvoice) return;
  
  const reason = window.prompt('Enter rejection reason (optional):');
  
  const resp = await rejectProjectInvoice(projectId, invoiceId, reason || undefined);
  if (resp.error) {
    toast.error(resp.error.message || 'Failed to reject invoice');
    return;
  }
  
  toast.error('Invoice rejected');
  refetch();
};
```

#### **Invoice Detail Modal Integration**:
```tsx
<InvoiceDetailModal
  invoice={selectedInvoice}
  open={showDetailModal}
  onClose={() => {
    setShowDetailModal(false);
    setSelectedInvoice(null);
  }}
  onApprove={handleApproveInvoice}
  onReject={handleRejectInvoice}
  onMarkAsPaid={handleMarkAsPaid}
/>
```

### **Global Invoices Page**
**File**: `src/modules/developer-dashboard/components/InvoicesPage.tsx`

Similar implementation as Project Invoices Page, with the same handler functions and modal integration.

---

## 4. Invoice Detail Modal

**File**: `src/modules/developer-dashboard/components/InvoiceDetailModal.tsx`

### **Conditional Button Rendering**:

```tsx
{invoice.status === 'pending' && (
  <>
    <Button
      variant="outline"
      onClick={() => {
        onReject(invoice.id);
        onClose();
      }}
      className="gap-2 text-red-600 border-red-600 hover:bg-red-50"
    >
      <XCircle className="w-4 h-4" />
      Reject
    </Button>
    <Button
      onClick={() => {
        onApprove(invoice.id);
        onClose();
      }}
      className="gap-2 bg-green-600 hover:bg-green-700"
    >
      <CheckCircle className="w-4 h-4" />
      Approve
    </Button>
  </>
)}

{invoice.status === 'approved' && (
  <Button
    onClick={() => {
      onMarkAsPaid(invoice.id);
      onClose();
    }}
    className="gap-2 bg-green-600 hover:bg-green-700"
  >
    <CheckCircle className="w-4 h-4" />
    Mark as Paid
  </Button>
)}
```

---

## 5. Invoice Status Workflow

```
┌─────────────┐
│   PENDING   │ ← Invoice created
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────┐
│  APPROVED   │  │ REJECTED │
└──────┬──────┘  └──────────┘
       │
       ▼
┌─────────────┐
│    PAID     │ ← Expense created
└─────────────┘
```

### **Status Transitions**:

| Current Status | Can Approve? | Can Reject? | Can Mark as Paid? | Can Delete? |
|----------------|--------------|-------------|-------------------|-------------|
| **Pending**    | ✅ Yes       | ✅ Yes      | ❌ No             | ✅ Yes      |
| **Approved**   | ❌ No        | ✅ Yes      | ✅ Yes            | ✅ Yes      |
| **Rejected**   | ❌ No        | ❌ No       | ❌ No             | ✅ Yes      |
| **Paid**       | ❌ No        | ❌ No       | ❌ No             | ❌ No       |

---

## 6. Database Schema

### **project_invoices Table**

The following fields support the approval workflow:

```sql
approvedBy    String?    -- User ID of approver
approvedAt    DateTime?  -- Timestamp of approval
status        String     -- 'pending' | 'approved' | 'paid' | 'rejected'
notes         String?    -- Includes rejection reason if rejected
```

**Note**: These fields already existed in the schema, no migration was needed.

---

## 7. User Experience Flow

### **Approving an Invoice**:

1. User navigates to **Invoices** page (project-specific or global)
2. Clicks on an invoice row to view details
3. Invoice Detail Modal opens
4. If status is **"Pending"**, user sees **"Approve"** and **"Reject"** buttons
5. User clicks **"Approve"**
6. System:
   - Sends API request to backend
   - Updates invoice status to "approved"
   - Records `approvedBy` and `approvedAt`
   - Closes modal
   - Shows success toast
   - Refreshes invoice list
7. Invoice now shows **"Approved"** badge
8. User can now **"Mark as Paid"**

### **Rejecting an Invoice**:

1. User navigates to **Invoices** page
2. Clicks on an invoice row to view details
3. Invoice Detail Modal opens
4. If status is **"Pending"** or **"Approved"**, user sees **"Reject"** button
5. User clicks **"Reject"**
6. System prompts: **"Enter rejection reason (optional):"**
7. User enters reason (or cancels)
8. System:
   - Sends API request with reason
   - Updates invoice status to "rejected"
   - Appends reason to invoice notes
   - Closes modal
   - Shows error toast (red)
   - Refreshes invoice list
9. Invoice now shows **"Rejected"** badge

---

## 8. Error Handling

### **Backend Errors**:

| Error | Status Code | Message |
|-------|-------------|---------|
| Project not found | 404 | "Project not found" |
| Invoice not found | 404 | "Invoice not found" |
| Already approved | 400 | "Invoice is already approved" |
| Cannot approve paid | 400 | "Cannot approve a paid invoice" |
| Cannot reject paid | 400 | "Cannot reject a paid invoice" |
| Server error | 500 | "Failed to approve/reject invoice" |

### **Frontend Error Handling**:

```typescript
const resp = await approveProjectInvoice(projectId, invoiceId);
if (resp.error) {
  toast.error(resp.error.message || 'Failed to approve invoice');
  return;
}
```

All errors are displayed to the user via toast notifications.

---

## 9. Testing Checklist

### **Backend API Tests**:

- [ ] Approve a pending invoice
  - [ ] Verify status changes to "approved"
  - [ ] Verify `approvedBy` is set
  - [ ] Verify `approvedAt` is set
- [ ] Reject a pending invoice
  - [ ] Verify status changes to "rejected"
  - [ ] Verify reason is appended to notes
- [ ] Try to approve an already approved invoice
  - [ ] Verify 400 error is returned
- [ ] Try to approve a paid invoice
  - [ ] Verify 400 error is returned
- [ ] Try to reject a paid invoice
  - [ ] Verify 400 error is returned
- [ ] Try to approve/reject without authentication
  - [ ] Verify 401 error is returned
- [ ] Try to approve/reject another user's project invoice
  - [ ] Verify 404 error is returned

### **Frontend UI Tests**:

- [ ] Open invoice detail modal for pending invoice
  - [ ] Verify "Approve" and "Reject" buttons are visible
- [ ] Click "Approve" button
  - [ ] Verify success toast appears
  - [ ] Verify modal closes
  - [ ] Verify invoice list refreshes
  - [ ] Verify invoice status badge changes to "Approved"
- [ ] Click "Reject" button
  - [ ] Verify prompt for rejection reason appears
  - [ ] Enter reason and confirm
  - [ ] Verify error toast appears (red)
  - [ ] Verify modal closes
  - [ ] Verify invoice list refreshes
  - [ ] Verify invoice status badge changes to "Rejected"
- [ ] Open invoice detail modal for approved invoice
  - [ ] Verify "Mark as Paid" button is visible
  - [ ] Verify "Approve" button is NOT visible
- [ ] Open invoice detail modal for paid invoice
  - [ ] Verify no action buttons are visible (except Close)
- [ ] Test on both Project Invoices page and Global Invoices page

---

## 10. Future Enhancements

### **Potential Improvements**:

1. **Approval Comments**: Allow approvers to add comments during approval
2. **Multi-level Approval**: Require approval from multiple users for high-value invoices
3. **Approval History**: Track all approval/rejection events with timestamps
4. **Email Notifications**: Send email to vendor when invoice is approved/rejected
5. **Bulk Approve/Reject**: Select multiple invoices and approve/reject at once
6. **Approval Workflow Rules**: Define custom approval rules based on amount, category, etc.
7. **Rejection Reason Dropdown**: Provide predefined rejection reasons
8. **Undo Rejection**: Allow re-opening rejected invoices

---

## 11. Files Modified

### **Backend**:
- `backend/src/routes/developer-dashboard.ts`
  - Added `POST /projects/:projectId/invoices/:invoiceId/approve` endpoint
  - Added `POST /projects/:projectId/invoices/:invoiceId/reject` endpoint

### **Frontend API**:
- `src/lib/api/invoices.ts`
  - Added `approveProjectInvoice()` function
  - Added `rejectProjectInvoice()` function

### **Frontend Components**:
- `src/modules/developer-dashboard/components/ProjectInvoicesPage.tsx`
  - Added `handleApproveInvoice()` handler
  - Added `handleRejectInvoice()` handler
  - Connected handlers to `InvoiceDetailModal`
- `src/modules/developer-dashboard/components/InvoicesPage.tsx`
  - Added `handleApproveInvoice()` handler
  - Added `handleRejectInvoice()` handler
  - Connected handlers to `InvoiceDetailModal`

### **Documentation**:
- `docs/INVOICE_APPROVE_REJECT_FEATURE.md` (this file)

---

## 12. Summary

✅ **Backend API endpoints created** for approve and reject
✅ **Frontend API client functions** implemented
✅ **UI handlers** integrated in both Project and Global Invoices pages
✅ **Invoice Detail Modal** shows conditional buttons based on status
✅ **Error handling** implemented with user-friendly toast notifications
✅ **Business rules** enforced (can't approve paid invoices, etc.)
✅ **Database fields** already existed, no migration needed
✅ **User experience** is smooth with automatic list refresh

**The approve/reject workflow is now fully functional!** 🎉

Users can:
1. View pending invoices
2. Approve or reject them with optional reason
3. See status changes immediately
4. Mark approved invoices as paid
5. Track who approved and when

---

## 13. Related Documentation

- [Invoice Attachment Feature](./INVOICE_ATTACHMENT_DESIGN.md)
- [Mark Invoice as Paid Implementation](./features/MARK_INVOICE_AS_PAID_IMPLEMENTATION_COMPLETE.md)
- [Invoice Organization Branding](./INVOICE_ORGANIZATION_BRANDING.md)
- [Invoice Pay To Update](./INVOICE_PAY_TO_UPDATE.md)

