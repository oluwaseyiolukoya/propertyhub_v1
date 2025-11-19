# Invoice Attachment URL Issue - Debugging Guide

## Issue Description
When clicking on an invoice attachment, the link opens but shows an XML error:
```xml
<Error>
  <Code>NoSuchKey</Code>
  <Message/>
  <BucketName>contrezz-uploads</BucketName>
</Error>
```

The URL being accessed:
```
https://contrezz-uploads.nyc3.digitaloceanspaces.com/customers/{customerId}/invoices/pending/attachments/{filename}.png
```

## Root Cause Analysis

### File Upload Path
When an invoice attachment is uploaded, it's stored at:
```
customers/{customerId}/invoices/pending/attachments/{uuid}.{ext}
```

The `entityId: "pending"` is used because the invoice might not exist yet during upload.

### Potential Issues

1. **File Path Mismatch**: The file might be stored with a different path than what's recorded in the database
2. **File Not Uploaded**: The file upload might have failed silently
3. **Database Record Issue**: The `file_path` in `invoice_attachments` table might be incorrect

## Debugging Steps

### 1. Check Backend Logs
Look for these log messages when viewing invoice attachments:

```bash
cd backend
tail -f logs/app.log | grep "developer-dashboard"
```

Expected logs:
```
[developer-dashboard] Generating signed URL for file_path: customers/.../invoices/pending/attachments/xxx.png
[developer-dashboard] File exists check for customers/.../invoices/pending/attachments/xxx.png: true/false
[developer-dashboard] Generated signed URL: https://...
```

### 2. Check Database Record
Query the `invoice_attachments` table:

```sql
SELECT 
  id,
  invoice_id,
  file_path,
  file_name,
  file_size,
  uploaded_at
FROM invoice_attachments
WHERE invoice_id = 'your-invoice-id';
```

Expected result:
- `file_path` should match the actual storage location
- `file_size` should be > 0

### 3. Check Digital Ocean Spaces
Use the DO Spaces browser or AWS CLI to verify the file exists:

```bash
# List files in the bucket
aws s3 ls s3://contrezz-uploads/customers/{customerId}/invoices/pending/attachments/ \
  --endpoint-url=https://nyc3.digitaloceanspaces.com \
  --profile digitalocean
```

### 4. Check Storage Transactions
Query the `storage_transactions` table:

```sql
SELECT 
  id,
  customer_id,
  file_path,
  file_size,
  action,
  created_at
FROM storage_transactions
WHERE file_path LIKE '%pending%'
ORDER BY created_at DESC
LIMIT 10;
```

## Solution Approaches

### Option 1: Fix File Path on Upload
Ensure the file is uploaded to the correct location and the path is correctly recorded.

**File:** `backend/src/routes/storage.ts`
```typescript
// Line 333
entityId: invoiceId || "pending", // Current implementation
```

### Option 2: Move Files After Invoice Creation
When an invoice is created, move files from `pending` to the actual invoice ID folder.

```typescript
// Pseudo-code
const oldPath = `customers/${customerId}/invoices/pending/attachments/${filename}`;
const newPath = `customers/${customerId}/invoices/${invoiceId}/attachments/${filename}`;
await storageService.moveFile(oldPath, newPath);
```

### Option 3: Use Consistent "pending" Path
Keep all invoice attachments in the `pending` folder and don't move them.

**Pros:**
- Simpler implementation
- No file moving required

**Cons:**
- Less organized storage structure
- Harder to clean up orphaned files

## Recommended Fix

### Step 1: Add File Existence Check (Already Implemented)
The code now checks if the file exists before generating a signed URL:

```typescript
const fileExists = await storageService.fileExists(att.file_path);
if (!fileExists) {
  console.error(`File not found in storage: ${att.file_path}`);
  return { ...att, url: '', error: 'File not found in storage' };
}
```

### Step 2: Verify Upload Success
Ensure the upload endpoint returns the correct file path:

**File:** `backend/src/routes/storage.ts` (Line 370-390)
```typescript
res.json({
  success: true,
  message: "File uploaded successfully",
  data: {
    filePath: uploadResult.filePath, // This should match what's in storage
    fileUrl: uploadResult.fileUrl,
    fileSize: req.file.size,
    // ... other fields
  },
});
```

### Step 3: Test Upload Flow
1. Upload a new invoice attachment
2. Check backend logs for the upload path
3. Verify the file exists in Digital Ocean Spaces
4. Check the database record
5. Try to view the attachment

## Testing Commands

### Test 1: Upload and Verify
```bash
# 1. Upload a file through the UI
# 2. Check backend logs
tail -f backend/logs/app.log | grep "upload"

# 3. Check database
psql -d contrezz -c "SELECT file_path FROM invoice_attachments ORDER BY uploaded_at DESC LIMIT 1;"

# 4. Check Digital Ocean Spaces
aws s3 ls s3://contrezz-uploads/customers/ --recursive --endpoint-url=https://nyc3.digitaloceanspaces.com
```

### Test 2: View Attachment
```bash
# 1. Click "View" on an attachment in the UI
# 2. Check backend logs
tail -f backend/logs/app.log | grep "Generating signed URL"

# 3. Check if file exists
# Look for "File exists check" log message
```

## Quick Fix for Existing Attachments

If files are uploaded but the paths are wrong in the database:

```sql
-- Update file paths to match actual storage location
UPDATE invoice_attachments
SET file_path = REPLACE(file_path, '/invoices/{invoiceId}/', '/invoices/pending/')
WHERE file_path LIKE '%/invoices/%/attachments/%';
```

## Prevention

1. **Always log file paths** during upload and retrieval
2. **Verify file existence** before generating signed URLs
3. **Return meaningful errors** to the frontend
4. **Add file path validation** in the upload endpoint
5. **Implement file cleanup** for orphaned files

## Next Steps

1. Run the backend with logging enabled
2. Upload a new invoice with attachment
3. Check the logs to see the actual file path
4. Verify the file exists in Digital Ocean Spaces
5. If the file doesn't exist, check the upload endpoint logs
6. If the path is wrong, update the upload logic

## Contact

If the issue persists after following these steps, provide:
- Backend logs from upload
- Backend logs from attachment retrieval
- Database record for the attachment
- Digital Ocean Spaces file listing

