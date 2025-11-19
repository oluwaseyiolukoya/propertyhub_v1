# Invoice Attachment - Quick Start Guide

## 🚀 5-Minute Test

Follow these steps to test the invoice attachment feature:

---

## Step 1: Verify Backend is Running

```bash
# Check backend health
curl http://localhost:5000/health

# Expected output:
# {"status":"ok","timestamp":"...","uptime":...}
```

✅ **If you see the above**: Backend is running  
❌ **If connection refused**: Start backend with `cd backend && npm run dev`

---

## Step 2: Open the Application

1. Open your browser
2. Go to: **http://localhost:5173**
3. Login as a **Property Developer** (e.g., `developer@contrezz.com`)

---

## Step 3: Navigate to Purchase Orders

1. Click on any **project** from your dashboard
2. Click the **"Purchase Orders"** tab
3. You should see a list of purchase orders and invoices

---

## Step 4: Create New Invoice with Attachments

### 4a. Click "New Invoice" Button
- Look for the "New Invoice" button (usually top-right)
- Click it to open the invoice creation modal

### 4b. Fill in Required Fields
- **Vendor**: Select or create a vendor
- **Description**: e.g., "Construction materials invoice"
- **Category**: e.g., "Materials"
- **Amount**: e.g., "50000"
- **Currency**: NGN (default)

### 4c. Upload Attachments

**Look for the "Attachments" section** - it should show:
- 📊 Storage quota bar at the top
- 📤 Upload zone with "Drag files here or click to browse"

**Upload a file** (choose one method):

**Method 1: Drag & Drop**
1. Find a PDF file on your computer
2. Drag it into the upload zone
3. Watch it appear in the file list

**Method 2: Click to Browse**
1. Click "Choose files" button
2. Select a PDF, DOCX, or JPEG file
3. Click "Open"
4. Watch it appear in the file list

**What you should see**:
```
┌─────────────────────────────────────────────────┐
│ 📎 my-invoice.pdf                               │
│ 2.5 MB • ⏳ Pending                             │
│                                        [Remove] │
└─────────────────────────────────────────────────┘
```

### 4d. Create Invoice
1. Click **"Create Invoice"** button at the bottom
2. Wait for the upload progress:
   - ⏳ Pending → 🔄 Uploading → ✅ Success
3. Wait for success message: "Invoice created successfully"
4. Modal closes automatically

---

## Step 5: View Invoice Details

### 5a. Find Your Invoice
- In the invoice list, find the invoice you just created
- Look for the invoice number (e.g., "INV-2025-001")

### 5b. Open Details
- Click **"View Detail"** button on that invoice row
- A dialog opens with invoice details

### 5c. Scroll to Attachments Section
- Scroll down in the dialog
- Look for the **"Attachments"** section

**What you should see**:
```
┌─────────────────────────────────────────────────────────────┐
│ Attachments                                                 │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📎 my-invoice.pdf                                       │ │
│ │ 2.5 MB • Nov 18, 2025, 10:30 PM • developer@contrezz... │ │
│ │                              [View / Download] ────────►│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 5d. Download File
1. Click **"View / Download"** link
2. File opens in a new browser tab
3. You can view it or download it from there

---

## Step 6: Check Storage Quota

### 6a. Go to Settings
1. Click your profile menu (top-right)
2. Click **"Settings"**
3. Go to **"Billing"** tab

### 6b. Find Storage Quota Card
- Look for **"Storage Quota"** section
- Should show:
  - 📊 Progress bar (green/yellow/red)
  - "X MB used of Y GB"
  - "Z MB available"

**Example**:
```
┌──────────────────────────────────────────────┐
│ Storage Quota                                │
├──────────────────────────────────────────────┤
│ 15 MB used of 5 GB                           │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.3%   │
│ 4.98 GB available                            │
│                                              │
│ [View Files]  [Upgrade Plan]                 │
└──────────────────────────────────────────────┘
```

---

## ✅ Success Checklist

After completing the above steps, verify:

- [ ] File uploaded successfully (saw ✅ success status)
- [ ] Invoice created without errors
- [ ] Invoice appears in the list
- [ ] "View Detail" opens the dialog
- [ ] Attachments section shows your file
- [ ] File name, size, and date are correct
- [ ] "View / Download" link works
- [ ] File opens/downloads correctly
- [ ] Storage quota updated in Settings

---

## ❌ Troubleshooting

### Problem: "Storage quota exceeded"
**Solution**: 
- Go to Settings → Billing → Storage Quota
- Click "View Files" to see what's using space
- Delete old files or upgrade your plan

### Problem: "Invalid file type"
**Solution**: 
- Only PDF, DOCX, and JPEG files are supported
- Convert your file to one of these formats

### Problem: Upload stuck at "Uploading"
**Solution**: 
- Wait 30 seconds (large files take time)
- Check your internet connection
- Try a smaller file first

### Problem: "No attachments have been uploaded for this invoice"
**Solution**: 
- Make sure you created a **NEW** invoice (after this feature was implemented)
- Old invoices won't have attachments
- Try creating another invoice with a file

### Problem: "View / Download" link doesn't work
**Solution**: 
- Check Digital Ocean Spaces configuration in `.env`
- Verify `SPACES_ACCESS_KEY_ID` and `SPACES_SECRET_ACCESS_KEY` are correct
- Check backend logs for errors: `tail -f /tmp/backend_invoice_attach.log`

### Problem: File uploaded but not showing in invoice details
**Solution**: 
- Refresh the page
- Close and reopen the invoice details dialog
- Check browser console (F12 → Console) for errors
- Verify the invoice was created successfully

---

## 🔍 Debugging

### Check Backend Logs
```bash
# View recent logs
tail -n 100 /tmp/backend_invoice_attach.log

# Filter for attachment-related logs
tail -f /tmp/backend_invoice_attach.log | grep -i "attachment"

# Filter for errors
tail -f /tmp/backend_invoice_attach.log | grep -i "error"
```

### Check Database
```bash
# Connect to database
psql -U oluwaseyio -d contrezz

# Check attachment count
SELECT COUNT(*) FROM invoice_attachments;

# View recent attachments
SELECT 
  id, 
  invoice_id, 
  file_name, 
  file_size, 
  uploaded_at 
FROM invoice_attachments 
ORDER BY uploaded_at DESC 
LIMIT 5;

# Exit
\q
```

### Check Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for red errors
4. Look for network errors in **Network** tab

### Test API Directly
```bash
# Get your auth token from browser localStorage
# Then test quota endpoint:
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/storage/quota

# Expected output:
# {"success":true,"data":{"used":...,"limit":...,"available":...}}
```

---

## 📊 What to Expect

### First Time (No Attachments Yet)
- Invoice details show: "No attachments have been uploaded for this invoice."
- This is normal for old invoices

### After Uploading (New Invoice)
- Upload progress shows: Pending → Uploading → Success
- Invoice details show: File list with download links
- Storage quota increases in Settings

### File Sizes
- Small file (< 1 MB): Uploads in 1-2 seconds
- Medium file (1-10 MB): Uploads in 5-15 seconds
- Large file (10-50 MB): Uploads in 30-60 seconds

### Storage Quota Colors
- 🟢 **Green**: < 70% used (plenty of space)
- 🟡 **Yellow**: 70-90% used (getting full)
- 🔴 **Red**: > 90% used (almost full)

---

## 🎯 Quick Reference

### Supported File Types
- ✅ PDF (`.pdf`)
- ✅ Word (`.doc`, `.docx`)
- ✅ JPEG (`.jpg`, `.jpeg`)

### File Size Limits
- Maximum per file: **50 MB**
- Total storage: **Depends on your plan** (check Settings)

### Where Files are Stored
- Digital Ocean Spaces
- Path: `customers/{customerId}/invoices/attachments/{filename}`

### Security
- Files are private (require authentication)
- Download links expire after **1 hour**
- Only the customer who uploaded can access

---

## 📞 Need Help?

If you're still having issues:

1. **Check the logs** (see Debugging section above)
2. **Check the database** (see Debugging section above)
3. **Check browser console** (F12 → Console)
4. **Review the full documentation**:
   - `docs/INVOICE_ATTACHMENT_USER_GUIDE.md` - Detailed user guide
   - `docs/INVOICE_ATTACHMENT_TEST_CHECKLIST.md` - Comprehensive test checklist
   - `docs/INVOICE_ATTACHMENT_IMPLEMENTATION_STATUS.md` - Implementation details

---

## 🎉 Success!

If you've completed all steps and everything works:

**Congratulations!** 🎊 The invoice attachment system is working perfectly!

You can now:
- ✅ Upload files to invoices
- ✅ View and download attachments
- ✅ Track storage usage
- ✅ Manage your files

**Next steps**:
- Test with different file types (PDF, DOCX, JPEG)
- Test with multiple files per invoice
- Test storage quota limits
- Test with different user accounts

---

*Last updated: November 18, 2025*

