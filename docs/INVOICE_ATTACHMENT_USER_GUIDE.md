# Invoice Attachment User Guide

## Overview
The invoice attachment system allows property developers to upload, view, and download files (PDF, DOCX, JPEG) associated with their project invoices. All files are stored securely in your customer's Digital Ocean Spaces storage and count towards your plan's storage quota.

---

## Features

### ✅ Upload Attachments
- **Supported file types**: PDF, DOCX, JPEG
- **Maximum file size**: 50MB per file
- **Storage quota**: Files count towards your plan's storage limit
- **Real-time validation**: System checks quota before upload

### ✅ View Attachments
- View all attachments linked to an invoice
- See file details (name, size, upload date, uploader)
- Download or view files directly in browser

### ✅ Storage Tracking
- Monitor storage usage in Settings page
- Visual progress bar with color-coded alerts
- Automatic quota updates after uploads/deletions

---

## How to Use

### 1. Creating an Invoice with Attachments

1. **Navigate to Purchase Orders**
   - Go to your project dashboard
   - Click on a project
   - Go to the "Purchase Orders" tab

2. **Create New Invoice**
   - Click the "New Invoice" button
   - Fill in the invoice details (vendor, amount, description, etc.)

3. **Upload Attachments**
   - Scroll to the "Attachments" section
   - You'll see your current storage quota at the top
   - **Two ways to upload**:
     - **Drag & Drop**: Drag files directly into the upload zone
     - **Click to Browse**: Click "Choose files" to select from your computer

4. **Monitor Upload Progress**
   - Each file shows its upload status:
     - ⏳ **Pending**: Waiting to upload
     - 🔄 **Uploading**: Upload in progress
     - ✅ **Success**: Upload complete
     - ❌ **Error**: Upload failed (see error message)

5. **Remove Files (Before Creating Invoice)**
   - Click the "Remove" button next to any file to delete it from the list
   - This only removes it from the pending list, not from storage

6. **Create Invoice**
   - Click "Create Invoice"
   - System will:
     - Upload all pending attachments to your storage
     - Check storage quota for each file
     - Create the invoice with linked attachments
     - Update your storage usage

---

### 2. Viewing Invoice Attachments

1. **Open Invoice Details**
   - In the Purchase Orders list, find your invoice
   - Click "View Detail" on the invoice row

2. **Scroll to Attachments Section**
   - The "Attachments" section shows all uploaded files
   - Each attachment displays:
     - 📎 File icon
     - File name
     - File size (formatted, e.g., "2.5 MB")
     - Upload date and time
     - Uploader's email

3. **Download or View Files**
   - Click "View / Download" link next to any attachment
   - Files open in a new browser tab
   - You can download from there or view directly (for PDFs, images)

---

### 3. Monitoring Storage Quota

1. **Go to Settings**
   - Click your profile menu
   - Select "Settings"
   - Go to the "Billing" tab

2. **View Storage Quota Card**
   - Shows current usage: "X MB used of Y GB"
   - Visual progress bar:
     - 🟢 **Green**: < 70% used
     - 🟡 **Yellow**: 70-90% used
     - 🔴 **Red**: > 90% used
   - Displays available space
   - Shows warning messages when running low

3. **Manage Storage**
   - Click "View Files" to see all uploaded files
   - Click "Upgrade Plan" to increase storage limit (if needed)

---

## Error Handling

### Common Errors and Solutions

#### ❌ "Storage quota exceeded"
**Problem**: Not enough storage space for the file.

**Solutions**:
- Delete unused files from your storage
- Upgrade your plan for more storage
- Upload smaller files

#### ❌ "Invalid file type"
**Problem**: File type not supported.

**Solutions**:
- Only upload PDF, DOCX, or JPEG files
- Convert your file to a supported format

#### ❌ "File size exceeds limit"
**Problem**: File is larger than 50MB.

**Solutions**:
- Compress the file
- Split into multiple smaller files
- Use a file compression tool

#### ❌ "Failed to upload attachment"
**Problem**: Network or server error.

**Solutions**:
- Check your internet connection
- Try uploading again
- Contact support if issue persists

---

## Technical Details

### Storage Location
- Files are stored in Digital Ocean Spaces (S3-compatible)
- Each customer has isolated storage
- Files are organized by category: `customers/{customerId}/invoices/attachments/`

### Security
- All files require authentication to access
- Signed URLs expire after 1 hour
- Files are only accessible by the customer who uploaded them
- Automatic audit trail for all uploads/deletions

### Database
- Attachment metadata stored in `invoice_attachments` table
- Linked to invoices via `invoice_id`
- Tracks file size, type, uploader, and upload date

### API Endpoints
- `POST /api/storage/upload-invoice-attachment` - Upload attachment
- `GET /api/developer-dashboard/projects/:projectId/invoices/:invoiceId/attachments` - List attachments
- `DELETE /api/storage/delete-invoice-attachment` - Delete attachment

---

## Best Practices

### 📋 File Naming
- Use descriptive file names (e.g., `invoice-2025-001-receipt.pdf`)
- Avoid special characters in file names
- Keep names concise but meaningful

### 📦 File Organization
- Upload all related documents together when creating invoice
- Use consistent naming conventions across your team
- Keep file sizes reasonable (compress when possible)

### 💾 Storage Management
- Regularly review and delete unused files
- Monitor storage usage in Settings
- Upgrade plan before reaching quota limit

### 🔒 Security
- Only upload necessary documents
- Don't share signed URLs (they expire automatically)
- Report any suspicious activity to support

---

## Troubleshooting

### Attachments Not Showing in Invoice Details

**Check**:
1. Did the invoice creation succeed?
2. Did all file uploads complete successfully?
3. Refresh the page and try viewing details again
4. Check browser console for errors (F12 → Console tab)

**If still not working**:
- Contact support with invoice ID and timestamp

### Upload Stuck at "Uploading"

**Try**:
1. Wait 30 seconds (large files take time)
2. Check your internet connection
3. Cancel and try uploading again
4. Try a smaller file first to test

### Storage Quota Not Updating

**Solutions**:
1. Refresh the page
2. Go to Settings → Billing → Storage Quota
3. Click "Recalculate" (if available)
4. Contact support if discrepancy persists

---

## Support

If you encounter any issues not covered in this guide:

1. **Check the browser console** (F12 → Console) for error messages
2. **Note the invoice ID** and timestamp of the issue
3. **Contact support** with:
   - Description of the problem
   - Steps to reproduce
   - Any error messages
   - Screenshots (if applicable)

---

## Summary

✅ **Upload**: Drag & drop or click to upload PDF, DOCX, JPEG files when creating invoices

✅ **View**: Click "View Detail" on any invoice to see and download attachments

✅ **Monitor**: Check storage usage in Settings → Billing → Storage Quota

✅ **Secure**: All files are private, authenticated, and automatically tracked

---

*Last updated: November 18, 2025*

