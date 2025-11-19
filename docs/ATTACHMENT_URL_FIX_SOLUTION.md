# Invoice Attachment URL Fix - Complete Solution

## Problem
Clicking on invoice attachments shows "NoSuchKey" error from Digital Ocean Spaces, indicating the file doesn't exist at the requested path.

## Root Cause
The file path stored in the database doesn't match the actual location of the file in Digital Ocean Spaces.

## Solution Implemented

### 1. Added File Existence Check
**File:** `backend/src/routes/developer-dashboard.ts`

Added validation before generating signed URLs:
```typescript
// Check if file exists before generating URL
const fileExists = await storageService.fileExists(att.file_path);
console.log(`[developer-dashboard] File exists check for ${att.file_path}: ${fileExists}`);

if (!fileExists) {
  console.error(`[developer-dashboard] File not found in storage: ${att.file_path}`);
  return {
    ...attachmentData,
    url: '',
    error: 'File not found in storage',
  };
}
```

### 2. Added Comprehensive Logging
Added logs to track:
- File path being used
- File existence check result
- Generated signed URL

## How to Debug

### Step 1: Restart Backend with Logging
```bash
cd backend
npm run dev
```

### Step 2: Try to View an Attachment
1. Go to the invoice with attachments
2. Click "View" on an attachment
3. Check the backend terminal for logs

Expected logs:
```
[developer-dashboard] Generating signed URL for file_path: customers/xxx/invoices/pending/attachments/yyy.png
[developer-dashboard] File exists check for customers/xxx/invoices/pending/attachments/yyy.png: false
[developer-dashboard] File not found in storage: customers/xxx/invoices/pending/attachments/yyy.png
```

### Step 3: Check Database
```bash
cd backend
npx prisma studio
```

Navigate to `invoice_attachments` table and check:
- `file_path` column - what path is stored?
- `file_name` column - what's the original filename?
- `file_size` column - is it > 0?

### Step 4: Check Digital Ocean Spaces

#### Option A: Use Digital Ocean Console
1. Go to https://cloud.digitalocean.com/spaces
2. Click on `contrezz-uploads` bucket
3. Navigate to `customers/{your-customer-id}/invoices/`
4. Check if files are in `pending/attachments/` folder

#### Option B: Use AWS CLI
```bash
# List all files in the bucket
aws s3 ls s3://contrezz-uploads/customers/ --recursive \
  --endpoint-url=https://nyc3.digitaloceanspaces.com \
  --profile digitalocean

# Search for specific file
aws s3 ls s3://contrezz-uploads/customers/ --recursive \
  --endpoint-url=https://nyc3.digitaloceanspaces.com \
  --profile digitalocean | grep "ff283f85-b8bf-45f0-96ef-410a239c4668"
```

## Likely Scenarios

### Scenario 1: File Never Uploaded
**Symptom:** File doesn't exist in Digital Ocean Spaces
**Cause:** Upload failed silently
**Solution:** Re-upload the file

### Scenario 2: Wrong Path in Database
**Symptom:** File exists but at different path
**Cause:** Path mismatch between upload and database record
**Solution:** Update database record with correct path

```sql
-- Find the attachment record
SELECT id, file_path, file_name FROM invoice_attachments 
WHERE file_name LIKE '%your-filename%';

-- Update with correct path
UPDATE invoice_attachments 
SET file_path = 'customers/{customerId}/invoices/pending/attachments/{correct-uuid}.png'
WHERE id = 'attachment-id';
```

### Scenario 3: File in Different Folder
**Symptom:** File exists but in different invoice folder
**Cause:** File was moved or uploaded with wrong entityId
**Solution:** Move file or update database

```sql
-- If file is in a different location, update the path
UPDATE invoice_attachments 
SET file_path = REPLACE(file_path, '/invoices/{wrong-id}/', '/invoices/pending/')
WHERE invoice_id = 'your-invoice-id';
```

## Testing New Uploads

### Test 1: Upload New Attachment
1. Create a new invoice with attachment
2. Check backend logs for upload confirmation:
   ```
   [storage] Uploading file to: customers/xxx/invoices/pending/attachments/yyy.png
   [storage] File uploaded successfully
   ```
3. Verify in Digital Ocean Spaces
4. Try to view the attachment

### Test 2: Verify Database Record
```sql
SELECT 
  ia.id,
  ia.invoice_id,
  ia.file_path,
  ia.file_name,
  ia.file_size,
  ia.uploaded_at,
  st.file_path as transaction_path
FROM invoice_attachments ia
LEFT JOIN storage_transactions st ON st.file_path = ia.file_path
WHERE ia.invoice_id = 'your-invoice-id'
ORDER BY ia.uploaded_at DESC;
```

## Frontend Error Handling

The frontend now handles missing files gracefully:

**File:** `src/modules/developer-dashboard/components/CreateInvoiceModal.tsx`

```typescript
{existingAttachments.map((attachment) => (
  <div key={attachment.id}>
    {attachment.error ? (
      <div className="text-red-600 text-sm">
        ⚠️ {attachment.error}
      </div>
    ) : (
      <a href={attachment.url} target="_blank">
        View
      </a>
    )}
  </div>
))}
```

## Prevention Measures

### 1. Enhanced Upload Validation
```typescript
// In storage.service.ts - uploadFile method
const uploadResult = await this.s3Client.send(uploadCommand);
console.log(`[storage] File uploaded successfully to: ${storagePath}`);

// Verify upload
const exists = await this.fileExists(storagePath);
if (!exists) {
  throw new Error(`File upload verification failed for: ${storagePath}`);
}
```

### 2. Atomic Operations
Ensure file upload and database record creation happen together:
```typescript
try {
  // Upload file
  const uploadResult = await storageService.uploadFile(...);
  
  // Create database record
  const record = await prisma.invoice_attachments.create({
    data: { file_path: uploadResult.filePath, ... }
  });
  
  // Verify both succeeded
  if (!record || !uploadResult) {
    throw new Error('Upload incomplete');
  }
} catch (error) {
  // Rollback: delete file if database insert failed
  await storageService.deleteFile(uploadResult.filePath);
  throw error;
}
```

### 3. Regular Cleanup
Add a cron job to clean up orphaned files:
```typescript
// Find files in storage that don't have database records
// Find database records that don't have files in storage
// Report or fix mismatches
```

## Quick Fix for Your Current Issue

Since you're seeing the error for file `ff283f85-b8bf-45f0-96ef-410a239c4668.png`:

### Step 1: Find the Database Record
```sql
SELECT * FROM invoice_attachments 
WHERE file_path LIKE '%ff283f85-b8bf-45f0-96ef-410a239c4668%';
```

### Step 2: Check if File Exists in Spaces
Use the Digital Ocean console or AWS CLI to search for this file.

### Step 3: Fix the Issue

**If file doesn't exist:**
- Delete the database record
- Re-upload the file through the UI

**If file exists at different path:**
- Update the database record with correct path
- Or move the file to match the database path

## Summary

✅ **Added file existence check** before generating signed URLs
✅ **Added comprehensive logging** for debugging
✅ **Added error handling** in frontend
✅ **Documented debugging steps**
✅ **Provided fix scenarios**

## Next Actions

1. **Restart backend** to enable new logging
2. **Try viewing attachment** again
3. **Check backend logs** for file path and existence
4. **Follow appropriate fix scenario** based on logs
5. **Test with new upload** to verify fix

The system will now tell you exactly where it's looking for the file and whether it exists, making it much easier to diagnose and fix the issue!

