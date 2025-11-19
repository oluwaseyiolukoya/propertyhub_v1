# Invoice Edit & Delete Feature Implementation

## Overview
Added edit and delete functionality to the Project Invoices page, allowing users to modify invoice details and remove invoices (with proper safeguards for paid invoices).

## Features Implemented

### 1. **Edit Invoice** ✅
- Added "Edit" menu item to the three-dot dropdown menu for each invoice
- Reused the `CreateInvoiceModal` component in edit mode
- Pre-populates form fields with existing invoice data
- Prevents editing of paid invoices (backend validation)
- Updates invoice details including:
  - Description
  - Category
  - Amount
  - Vendor
  - Due Date
  - Notes

### 2. **Delete Invoice** ✅
- Enhanced "Delete" menu item with red styling for visual distinction
- Prevents deletion of paid invoices (backend validation)
- Confirms deletion with user before proceeding
- Automatically deletes associated attachments from storage
- Cascades deletion to `invoice_attachments` table

## Files Modified

### Frontend

#### 1. `src/modules/developer-dashboard/components/ProjectInvoicesPage.tsx`
**Changes:**
- Added `Edit` icon import
- Added state for edit modal: `showEditModal`, `invoiceToEdit`
- Added `handleEditInvoice()` function
- Added "Edit" menu item to dropdown
- Styled "Delete" menu item with red color
- Rendered edit modal with `invoiceToEdit` prop

**Code:**
```typescript
// State
const [showEditModal, setShowEditModal] = useState(false);
const [invoiceToEdit, setInvoiceToEdit] = useState<ProjectInvoice | null>(null);

// Handler
const handleEditInvoice = (invoice: ProjectInvoice) => {
  setInvoiceToEdit(invoice);
  setShowEditModal(true);
};

// Dropdown Menu
<DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
  <Edit className="w-4 h-4 mr-2" />
  Edit
</DropdownMenuItem>
<DropdownMenuItem 
  onClick={() => handleDeleteInvoice(invoice)}
  className="text-red-600 focus:text-red-600"
>
  <Trash2 className="w-4 h-4 mr-2" />
  Delete
</DropdownMenuItem>
```

#### 2. `src/modules/developer-dashboard/components/CreateInvoiceModal.tsx`
**Changes:**
- Added `invoiceToEdit` prop to interface
- Added `isEditMode` flag
- Added useEffect to populate form data in edit mode
- Updated dialog title: "Edit Invoice" vs "Create New Invoice"
- Updated button text: "Update Invoice" vs "Create Invoice"
- Modified `handleSubmit` to call update API in edit mode
- Skipped invoice number generation in edit mode
- Added import for `updateProjectInvoice`

**Key Logic:**
```typescript
const isEditMode = !!invoiceToEdit;

// Populate form in edit mode
useEffect(() => {
  if (open && isEditMode && invoiceToEdit) {
    setFormData({
      invoiceNumber: invoiceToEdit.invoiceNumber || "",
      description: invoiceToEdit.description || "",
      category: invoiceToEdit.category || "materials",
      amount: invoiceToEdit.amount || 0,
      vendorId: invoiceToEdit.vendorId || invoiceToEdit.vendor?.id,
      dueDate: invoiceToEdit.dueDate,
      notes: invoiceToEdit.notes,
    });
    // ... set other fields
  }
}, [open, isEditMode, invoiceToEdit]);

// Handle submit
if (isEditMode && invoiceToEdit) {
  const response = await updateProjectInvoice(
    invoiceToEdit.projectId,
    invoiceToEdit.id,
    updateData
  );
  // ... handle response
}
```

#### 3. `src/lib/api/invoices.ts`
**Changes:**
- Added `updateProjectInvoice()` function
- Uses `apiClient.put()` to call backend endpoint
- Returns `ApiResponse<ProjectInvoice>`

**Code:**
```typescript
export async function updateProjectInvoice(
  projectId: string,
  invoiceId: string,
  data: Partial<CreateInvoiceData>
): Promise<ApiResponse<ProjectInvoice>> {
  try {
    const response = await apiClient.put<ProjectInvoice>(
      `/api/developer-dashboard/projects/${projectId}/invoices/${invoiceId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Error updating invoice:', error);
    return { data: null, error: { message: 'Failed to update invoice' } };
  }
}
```

### Backend

#### 4. `backend/src/routes/developer-dashboard.ts`
**Changes:**
- Added `PUT /projects/:projectId/invoices/:invoiceId` endpoint
- Verifies project ownership
- Verifies invoice belongs to project
- Prevents editing paid invoices
- Updates invoice fields:
  - description
  - category
  - amount
  - currency
  - dueDate
  - notes
  - vendorId
  - updatedAt
- Returns updated invoice with vendor and purchaseOrder relations

**Code:**
```typescript
router.put('/projects/:projectId/invoices/:invoiceId', async (req: Request, res: Response) => {
  try {
    const { projectId, invoiceId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;
    const updateData = req.body;

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: { id: projectId, customerId, developerId: userId },
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify invoice belongs to project
    const existingInvoice = await prisma.project_invoices.findFirst({
      where: { id: invoiceId, projectId },
    });
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Prevent editing paid invoices
    if (existingInvoice.status === 'paid' || existingInvoice.status === 'Paid') {
      return res.status(400).json({
        error: 'Cannot edit paid invoice',
        message: 'Paid invoices cannot be modified.'
      });
    }

    // Update invoice
    const updatedInvoice = await prisma.project_invoices.update({
      where: { id: invoiceId },
      data: {
        description: updateData.description,
        category: updateData.category,
        amount: updateData.amount,
        currency: updateData.currency || 'NGN',
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : null,
        notes: updateData.notes,
        vendorId: updateData.vendorId,
        updatedAt: new Date(),
      },
      include: { vendor: true, purchaseOrder: true },
    });

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice', details: error.message });
  }
});
```

## Security & Validation

### Frontend Validation
- ✅ Checks if invoice is paid before allowing edit/delete
- ✅ Confirms deletion with user
- ✅ Validates all required fields before submission

### Backend Validation
- ✅ Verifies project ownership (user must own the project)
- ✅ Verifies invoice belongs to project
- ✅ Prevents editing/deleting paid invoices
- ✅ Returns appropriate error messages

## User Experience

### Edit Flow
1. User clicks three-dot menu on invoice row
2. Clicks "Edit"
3. Modal opens with pre-filled invoice data
4. User modifies fields as needed
5. Clicks "Update Invoice"
6. Success toast appears
7. Invoice list refreshes with updated data

### Delete Flow
1. User clicks three-dot menu on invoice row
2. Clicks "Delete" (red text)
3. Confirmation dialog appears
4. User confirms deletion
5. Invoice and attachments are deleted
6. Success toast appears
7. Invoice list refreshes

## Testing Checklist

### Edit Invoice
- [ ] Open edit modal from three-dot menu
- [ ] Verify all fields are pre-populated correctly
- [ ] Modify description and save
- [ ] Modify amount and save
- [ ] Change vendor and save
- [ ] Change due date and save
- [ ] Try to edit a paid invoice (should show error)
- [ ] Verify success toast appears
- [ ] Verify invoice list updates

### Delete Invoice
- [ ] Delete a pending invoice
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify invoice is removed from list
- [ ] Verify attachments are deleted from storage
- [ ] Try to delete a paid invoice (should show error)
- [ ] Cancel deletion and verify invoice remains

## Known Limitations

1. **Attachments in Edit Mode**: Currently, editing an invoice does not allow adding/removing attachments. Attachments can only be added during invoice creation.
2. **Invoice Number**: Invoice number cannot be changed in edit mode (by design).
3. **Project**: Cannot move invoice to a different project (by design).

## Future Enhancements

1. Allow managing attachments in edit mode (add/remove files)
2. Add audit trail to track invoice modifications
3. Add "Duplicate Invoice" feature
4. Add bulk delete functionality
5. Add soft delete with restore capability

## API Endpoints

### Update Invoice
```
PUT /api/developer-dashboard/projects/:projectId/invoices/:invoiceId
```

**Request Body:**
```json
{
  "description": "Updated description",
  "category": "materials",
  "amount": 150000,
  "currency": "NGN",
  "dueDate": "2025-12-31T00:00:00.000Z",
  "notes": "Updated notes",
  "vendorId": "vendor-id-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice updated successfully",
  "data": {
    "id": "invoice-id",
    "invoiceNumber": "INV-2025-001",
    "description": "Updated description",
    // ... other invoice fields
  }
}
```

### Delete Invoice
```
DELETE /api/developer-dashboard/projects/:projectId/invoices/:invoiceId
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice deleted successfully"
}
```

## Error Handling

### Edit Invoice Errors
- **404**: Project not found or Invoice not found
- **400**: Cannot edit paid invoice
- **500**: Server error during update

### Delete Invoice Errors
- **404**: Project not found or Invoice not found
- **400**: Cannot delete paid invoice
- **500**: Server error during deletion

## Summary

✅ **Edit functionality**: Fully implemented with form pre-population and backend validation
✅ **Delete functionality**: Enhanced with proper safeguards and attachment cleanup
✅ **UI/UX**: Clean dropdown menu with visual distinction for destructive actions
✅ **Security**: Proper ownership verification and paid invoice protection
✅ **Error handling**: Comprehensive error messages and user feedback

The invoice management system now provides a complete CRUD experience for project invoices!

