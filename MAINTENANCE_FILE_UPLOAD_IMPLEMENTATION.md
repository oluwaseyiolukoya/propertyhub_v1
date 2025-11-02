# Maintenance File Upload Implementation Guide

## Overview
This document outlines the implementation of file upload functionality for maintenance requests, allowing tenants to attach photos/documents when creating requests and when replying to tickets.

## Backend Implementation

### 1. Upload Route (`backend/src/routes/uploads.ts`)
**Created**: New file for handling file uploads

**Features**:
- Multer configuration for maintenance attachments
- Files stored in `uploads/maintenance/{customerId}/` directory
- Supports multiple file types: images, PDFs, documents, videos
- Max file size: 10MB per file
- Max files: 5 per upload
- Auto-generates unique filenames using UUID
- Security: Users can only access files from their own customer

**Endpoints**:
- `POST /api/uploads/maintenance` - Upload multiple files (max 5)
- `DELETE /api/uploads/maintenance/:customerId/:filename` - Delete a file

### 2. Server Configuration (`backend/src/index.ts`)
**Changes**:
- Import and register upload routes
- Static file serving already configured for `/uploads` directory

### 3. Maintenance Routes (`backend/src/routes/maintenance.ts`)
**Already Configured**:
- `POST /:id/replies` endpoint accepts `attachments` array
- Attachments are stored in `maintenance_updates.attachments` (JSON field)
- Schema already supports attachments

## Frontend Implementation

### 1. Upload API Helper (`src/lib/api/uploads.ts`)
**Created**: New file with upload functions

**Functions**:
```typescript
uploadMaintenanceFiles(files: File[]): Promise<{ files: UploadedFile[] }>
deleteMaintenanceFile(customerId: string, filename: string)
```

**UploadedFile Interface**:
```typescript
{
  filename: string;        // Server filename (UUID)
  originalName: string;    // Original filename
  mimetype: string;        // File MIME type
  size: number;            // File size in bytes
  url: string;             // Relative URL path
}
```

### 2. File Upload Component (`src/components/FileUpload.tsx`)
**Created**: Reusable file upload component

**Features**:
- Drag & drop support (UI ready)
- File type validation
- File size validation
- Preview of selected files
- Display existing uploaded files
- Remove files before upload
- Progress indication during upload
- Responsive design

**Props**:
```typescript
{
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;           // Default: 5
  maxSize?: number;            // Default: 10MB
  accept?: string;             // File types
  existingFiles?: UploadedFile[];
  onRemoveFile?: (file: UploadedFile) => void;
}
```

### 3. Tenant Component Integration

#### Required Changes to `TenantMaintenanceRequests.tsx`:

**Step 1: Add State**
```typescript
const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
const [replyFiles, setReplyFiles] = useState<UploadedFile[]>([]);
```

**Step 2: Update handleSubmitRequest**
```typescript
const handleSubmitRequest = async () => {
  if (!tenantLease?.propertyId) {
    toast.error('No active lease found');
    return;
  }

  try {
    const resp = await createMaintenanceRequest({
      propertyId: tenantLease.propertyId,
      unitId: tenantLease.unitId,
      title: newRequest.title,
      description: newRequest.description,
      category: newRequest.category,
      priority: newRequest.priority,
      images: uploadedFiles.map(f => f.url), // Use uploaded file URLs
    });
    
    if (resp.error) {
      toast.error(resp.error.error || 'Failed to submit request');
    } else {
      toast.success('Maintenance request submitted successfully');
      setShowNewRequestDialog(false);
      setNewRequest({ title: '', category: '', priority: 'medium', description: '', images: [] });
      setUploadedFiles([]); // Clear uploaded files
      fetchTickets();
    }
  } catch {
    toast.error('Failed to submit request');
  }
};
```

**Step 3: Update handleReply**
```typescript
const handleReply = async () => {
  if (!selectedRequest) return;
  if (!replyNote.trim()) return;
  
  try {
    const resp = await replyMaintenanceRequest(selectedRequest.id, { 
      note: replyNote.trim(),
      attachments: replyFiles // Include reply attachments
    });
    
    if (resp.error) {
      toast.error(resp.error.error || 'Failed to send reply');
    } else {
      toast.success('Reply sent');
      setReplyNote('');
      setReplyFiles([]); // Clear reply files
      
      // Refresh the full ticket details
      const refreshResp = await getMaintenanceRequest(selectedRequest.id);
      if (!refreshResp.error && refreshResp.data) {
        setSelectedRequest(refreshResp.data);
      }
    }
  } catch {
    toast.error('Failed to send reply');
  }
};
```

**Step 4: Replace File Upload Section in Form**

Replace the old photos section:
```tsx
<div className="space-y-2">
  <Label>Photos (Optional)</Label>
  <div className="border-2 border-dashed rounded-lg p-6 text-center">
    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
    <p className="text-sm text-muted-foreground mb-2">Upload photos of the issue</p>
    <Button variant="outline" size="sm">Choose Files</Button>
  </div>
</div>
```

With:
```tsx
<div className="space-y-2">
  <Label>Photos & Documents (Optional)</Label>
  <FileUpload
    onFilesUploaded={(files) => setUploadedFiles([...uploadedFiles, ...files])}
    existingFiles={uploadedFiles}
    onRemoveFile={(file) => setUploadedFiles(uploadedFiles.filter(f => f.filename !== file.filename))}
    maxFiles={5}
    maxSize={10}
  />
</div>
```

**Step 5: Add File Upload to Reply Section**

In the ticket details dialog, add file upload above the reply textarea:
```tsx
<div className="space-y-3">
  {/* Reply Files */}
  <FileUpload
    onFilesUploaded={(files) => setReplyFiles([...replyFiles, ...files])}
    existingFiles={replyFiles}
    onRemoveFile={(file) => setReplyFiles(replyFiles.filter(f => f.filename !== file.filename))}
    maxFiles={3}
    maxSize={10}
  />
  
  {/* Reply Textarea */}
  <div className="flex items-start space-x-2">
    <Textarea
      placeholder="Type your reply..."
      value={replyNote}
      onChange={(e) => setReplyNote(e.target.value)}
      rows={2}
    />
    <Button onClick={handleReply} disabled={!replyNote.trim()}>Send</Button>
  </div>
</div>
```

**Step 6: Display Attachments in Updates**

Update the updates display to show attachments:
```tsx
{(selectedRequest.updates || []).map((update: any, index: number) => (
  <div key={index} className="flex space-x-3 pb-3 border-b last:border-0">
    <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium">{update?.updatedBy?.name || 'Update'}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(update.createdAt).toLocaleString()}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">{update.note || update.message}</p>
      
      {/* Display attachments */}
      {update.attachments && update.attachments.length > 0 && (
        <div className="mt-2 space-y-1">
          {update.attachments.map((file: any, idx: number) => (
            <a
              key={idx}
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${file.url || file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
            >
              <File className="h-3 w-3" />
              <span>{file.originalName || 'Attachment'}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  </div>
))}
```

## File Storage Structure

```
backend/
  uploads/
    maintenance/
      {customerId}/
        {uuid}.jpg
        {uuid}.pdf
        {uuid}.mp4
```

## Supported File Types

### Images
- JPEG/JPG
- PNG
- GIF
- WebP

### Documents
- PDF
- DOC/DOCX

### Videos
- MP4
- QuickTime (MOV)

## Security Considerations

1. **File Size Limits**: 10MB per file to prevent abuse
2. **File Type Validation**: Only allowed MIME types accepted
3. **Customer Isolation**: Files stored in customer-specific directories
4. **Access Control**: Users can only access files from their own customer
5. **Unique Filenames**: UUID prevents filename conflicts and guessing

## User Experience Flow

### Creating New Request
1. Tenant fills out request form
2. Clicks "Choose Files" in FileUpload component
3. Selects up to 5 files
4. Files are uploaded immediately
5. Uploaded files show with preview/name
6. Can remove files before submitting
7. Submits request with file URLs

### Replying to Ticket
1. Tenant/Manager opens ticket details
2. Sees existing attachments from previous updates
3. Can attach files to their reply
4. Files upload before sending reply
5. Reply includes attachments
6. All parties see attachments in thread

## Testing Checklist

### Backend
- [ ] Upload single file
- [ ] Upload multiple files (up to 5)
- [ ] Reject files over 10MB
- [ ] Reject invalid file types
- [ ] Files stored in correct customer directory
- [ ] File URLs returned correctly
- [ ] Delete file endpoint works
- [ ] Access control prevents cross-customer access

### Frontend
- [ ] FileUpload component renders
- [ ] File selection works
- [ ] File validation shows errors
- [ ] Upload progress indication
- [ ] Uploaded files display correctly
- [ ] Remove file before upload works
- [ ] Files included in request creation
- [ ] Files included in replies
- [ ] Attachments display in ticket details
- [ ] File links open in new tab
- [ ] Mobile responsive

## Next Steps

1. ✅ Backend upload route created
2. ✅ Frontend upload API helper created
3. ✅ FileUpload component created
4. ⏳ Integrate FileUpload into TenantMaintenanceRequests
5. ⏳ Test file upload flow
6. ⏳ Add file upload to Manager/Owner components (optional)

## Status
🔨 **IN PROGRESS** - Backend complete, frontend components created, integration pending.

