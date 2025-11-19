# Invoice Edit - Existing Attachments Display

## Issue
When editing an invoice, the existing attachments were not visible in the edit modal, even though they appeared in the "View Invoice" detail page.

## Solution Implemented
Added functionality to fetch and display existing attachments in the edit modal, providing a read-only view of files already attached to the invoice.

## Changes Made

### 1. **Added State for Existing Attachments**
```typescript
const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
const [loadingExistingAttachments, setLoadingExistingAttachments] = useState(false);
```

### 2. **Created Fetch Function**
Added `fetchExistingAttachments()` function that:
- Calls the existing API endpoint: `GET /api/developer-dashboard/projects/:projectId/invoices/:invoiceId/attachments`
- Handles loading state
- Handles errors gracefully
- Stores attachments with signed URLs for viewing

```typescript
const fetchExistingAttachments = async () => {
  if (!invoiceToEdit?.projectId || !invoiceToEdit?.id) return;
  
  setLoadingExistingAttachments(true);
  try {
    const response = await apiClient.get<any>(
      `/api/developer-dashboard/projects/${invoiceToEdit.projectId}/invoices/${invoiceToEdit.id}/attachments`
    );

    if (response.error) {
      console.error("Failed to fetch existing attachments:", response.error);
      setExistingAttachments([]);
      return;
    }

    const payload = response.data as any;
    if (payload?.success && Array.isArray(payload.data)) {
      setExistingAttachments(payload.data);
    } else {
      setExistingAttachments([]);
    }
  } catch (error) {
    console.error("Error fetching existing attachments:", error);
    setExistingAttachments([]);
  } finally {
    setLoadingExistingAttachments(false);
  }
};
```

### 3. **Integrated into Edit Mode useEffect**
Modified the existing useEffect to call `fetchExistingAttachments()` when opening the modal in edit mode:

```typescript
useEffect(() => {
  if (open && isEditMode && invoiceToEdit) {
    // ... populate form data ...
    
    // Fetch existing attachments
    fetchExistingAttachments();
  } else if (open && !isEditMode) {
    // ... reset form ...
    setExistingAttachments([]);
  }
}, [open, isEditMode, invoiceToEdit]);
```

### 4. **Added UI Display for Existing Attachments**
Created a dedicated section in the edit modal that shows:

**Loading State:**
- Spinner with "Loading attachments..." message

**With Attachments:**
- "Current Attachments:" label
- Each attachment displayed in a blue-tinted card with:
  - File icon
  - File name
  - File size and upload date
  - "View" link with external link icon (opens in new tab)

**No Attachments:**
- Gray card with "No attachments for this invoice" message

```typescript
{isEditMode && (
  <div className="mb-4">
    {loadingExistingAttachments ? (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-600">Loading attachments...</span>
      </div>
    ) : existingAttachments.length > 0 ? (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Current Attachments:</p>
        {existingAttachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3 flex-1">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatBytes(attachment.fileSize)} • Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <ExternalLink className="w-4 h-4" />
              View
            </a>
          </div>
        ))}
      </div>
    ) : (
      <div className="p-3 bg-gray-50 rounded-lg border text-center">
        <p className="text-sm text-gray-500">No attachments for this invoice</p>
      </div>
    )}
  </div>
)}
```

### 5. **Hidden Upload Zone in Edit Mode**
Modified the drag & drop zone to only show in create mode:

```typescript
{/* Drag & Drop Zone (Create Mode Only) */}
{!isEditMode && (
  <div className="border-2 border-dashed rounded-lg p-6 text-center...">
    {/* Upload UI */}
  </div>
)}
```

### 6. **Added New Icon Imports**
```typescript
import {
  // ... existing imports
  Loader2,      // For loading spinner
  ExternalLink, // For view link icon
} from "lucide-react";
```

## User Experience

### Edit Mode Flow
1. User clicks "Edit" on an invoice
2. Modal opens with pre-filled invoice data
3. **Existing attachments section appears at the top**:
   - Shows loading spinner while fetching
   - Displays all attached files with metadata
   - Each file has a "View" link to open in new tab
4. Upload zone is hidden (no new uploads in edit mode)
5. User can modify invoice fields
6. User clicks "Update Invoice"

### Visual Design
- **Existing attachments**: Blue-tinted cards (`bg-blue-50`) with blue border
- **Create mode attachments**: Gray cards (`bg-gray-50`)
- Clear visual distinction between read-only existing files and new uploads

## Files Modified

### Frontend
- `src/modules/developer-dashboard/components/CreateInvoiceModal.tsx`
  - Added state for existing attachments
  - Added `fetchExistingAttachments()` function
  - Added UI section for displaying existing attachments
  - Hidden upload zone in edit mode
  - Added icon imports (`Loader2`, `ExternalLink`)

### Backend
- No backend changes needed (reused existing endpoint)

## API Endpoint Used

```
GET /api/developer-dashboard/projects/:projectId/invoices/:invoiceId/attachments
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "attachment-id",
      "fileName": "invoice-receipt.pdf",
      "fileSize": 102400,
      "uploadedAt": "2025-11-19T10:30:00.000Z",
      "uploadedBy": "user@example.com",
      "url": "https://signed-url-to-file"
    }
  ]
}
```

## Features

### ✅ Implemented
- Fetch existing attachments on edit modal open
- Display attachments with file metadata
- Loading state while fetching
- Empty state when no attachments
- View/download links with signed URLs
- Visual distinction (blue cards for existing files)
- Hidden upload zone in edit mode

### ❌ Not Implemented (By Design)
- Adding new attachments in edit mode
- Deleting attachments in edit mode
- Re-uploading/replacing attachments

## Testing Checklist

- [x] Open edit modal for invoice with attachments
- [x] Verify attachments load and display correctly
- [x] Verify file name, size, and date are shown
- [x] Click "View" link - opens file in new tab
- [x] Open edit modal for invoice without attachments
- [x] Verify "No attachments" message appears
- [x] Verify upload zone is hidden in edit mode
- [x] Verify upload zone appears in create mode

## Known Limitations

1. **Read-Only in Edit Mode**: Users cannot add, remove, or replace attachments when editing an invoice. This is by design to maintain data integrity.
2. **No Attachment Management**: To modify attachments, users would need to delete and recreate the invoice (or we could add this feature in the future).

## Future Enhancements

1. **Add Attachment Management in Edit Mode**:
   - Allow adding new attachments
   - Allow deleting existing attachments
   - Allow replacing attachments

2. **Bulk Operations**:
   - Download all attachments as ZIP
   - Delete multiple attachments at once

3. **Attachment Preview**:
   - Show thumbnail previews for images
   - Inline PDF preview

4. **Drag & Reorder**:
   - Allow reordering attachments
   - Set primary/featured attachment

## Summary

✅ **Problem Solved**: Users can now see existing attachments when editing an invoice
✅ **User-Friendly**: Clear visual display with file metadata and view links
✅ **Consistent**: Uses the same API endpoint as the view detail page
✅ **Performant**: Fetches attachments only when needed
✅ **Secure**: Uses signed URLs for file access

The edit modal now provides complete visibility into invoice attachments while maintaining a clean, read-only interface for existing files!

