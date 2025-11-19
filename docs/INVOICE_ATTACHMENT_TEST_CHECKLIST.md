# Invoice Attachment System - Test Checklist

## Pre-Test Setup

- [ ] Backend is running (`npm run dev` in `/backend`)
- [ ] Frontend is running (`npm run dev` in root)
- [ ] Database migrations applied (`add_invoice_attachments.sql`)
- [ ] Digital Ocean Spaces configured (check `.env`)
- [ ] Logged in as Property Developer

---

## Test 1: Upload Attachments When Creating Invoice

### Steps:
1. [ ] Navigate to a project's "Purchase Orders" page
2. [ ] Click "New Invoice" button
3. [ ] Fill in required fields:
   - [ ] Vendor
   - [ ] Description
   - [ ] Category
   - [ ] Amount
4. [ ] Scroll to "Attachments" section
5. [ ] Verify storage quota is displayed at top
6. [ ] **Test Drag & Drop**:
   - [ ] Drag a PDF file into the upload zone
   - [ ] Verify file appears in the list
   - [ ] Check status shows "Pending"
7. [ ] **Test Click to Upload**:
   - [ ] Click "Choose files" button
   - [ ] Select a DOCX file
   - [ ] Verify file appears in the list
8. [ ] **Test Multiple Files**:
   - [ ] Upload a JPEG file
   - [ ] Verify all 3 files are in the list
9. [ ] **Test Remove File**:
   - [ ] Click "Remove" on one file
   - [ ] Verify it's removed from the list
10. [ ] Click "Create Invoice"
11. [ ] Wait for success message
12. [ ] Verify storage quota updates in the modal

### Expected Results:
- ✅ Files upload successfully
- ✅ Upload progress shows for each file
- ✅ Success status (✓) appears when complete
- ✅ Invoice is created
- ✅ Storage quota updates

### Potential Issues:
- ❌ "Storage quota exceeded" → Delete old files or upgrade plan
- ❌ "Invalid file type" → Only PDF, DOCX, JPEG allowed
- ❌ Upload stuck → Check network, try smaller file

---

## Test 2: View Attachments in Invoice Details

### Steps:
1. [ ] Find the invoice you just created in the list
2. [ ] Click "View Detail" button
3. [ ] Scroll to "Attachments" section
4. [ ] Verify all uploaded files are listed
5. [ ] Check each attachment shows:
   - [ ] File name
   - [ ] File size (formatted, e.g., "2.5 MB")
   - [ ] Upload date and time
   - [ ] Uploader's email
   - [ ] "View / Download" link
6. [ ] Click "View / Download" on a PDF file
7. [ ] Verify it opens in a new tab
8. [ ] Verify you can view/download the file
9. [ ] Repeat for DOCX and JPEG files

### Expected Results:
- ✅ All attachments are displayed
- ✅ File details are correct
- ✅ Links work and files open/download
- ✅ Files match what was uploaded

### Potential Issues:
- ❌ "No attachments" message → Check if invoice was created with attachments
- ❌ Link doesn't work → Check Digital Ocean Spaces configuration
- ❌ "Access denied" → Check authentication and signed URL generation

---

## Test 3: Storage Quota Tracking

### Steps:
1. [ ] Click profile menu → "Settings"
2. [ ] Go to "Billing" tab
3. [ ] Find "Storage Quota" card
4. [ ] Verify it shows:
   - [ ] Current usage (e.g., "15 MB used of 5 GB")
   - [ ] Progress bar with correct color:
     - [ ] Green if < 70% used
     - [ ] Yellow if 70-90% used
     - [ ] Red if > 90% used
   - [ ] Available space
   - [ ] Warning message (if applicable)
5. [ ] Note the current storage usage
6. [ ] Go back and create another invoice with attachments
7. [ ] Return to Settings → Billing
8. [ ] Verify storage usage increased

### Expected Results:
- ✅ Storage quota displays correctly
- ✅ Usage updates after uploads
- ✅ Progress bar color matches usage level
- ✅ Warnings appear when appropriate

### Potential Issues:
- ❌ "Storage quota information unavailable" → Check backend API
- ❌ Usage not updating → Refresh page, check database

---

## Test 4: Error Handling

### Test 4a: Storage Quota Exceeded
1. [ ] Note your current storage limit
2. [ ] Try to upload a file larger than available space
3. [ ] Verify error message: "Storage quota exceeded"
4. [ ] Verify upload is blocked
5. [ ] Verify invoice creation is prevented

### Test 4b: Invalid File Type
1. [ ] Try to upload a .txt or .zip file
2. [ ] Verify error message: "Invalid file type"
3. [ ] Verify file is not added to the list

### Test 4c: File Too Large
1. [ ] Try to upload a file > 50MB
2. [ ] Verify error message about file size
3. [ ] Verify upload is blocked

### Test 4d: Network Error
1. [ ] Start uploading a file
2. [ ] Disconnect internet briefly
3. [ ] Verify error status appears
4. [ ] Reconnect and try again
5. [ ] Verify retry works

### Expected Results:
- ✅ All errors are caught and displayed
- ✅ User-friendly error messages
- ✅ System prevents invalid operations
- ✅ Can recover from errors

---

## Test 5: Edge Cases

### Test 5a: Create Invoice Without Attachments
1. [ ] Create a new invoice
2. [ ] Don't upload any attachments
3. [ ] Click "Create Invoice"
4. [ ] Verify invoice is created successfully
5. [ ] View invoice details
6. [ ] Verify "No attachments" message appears

### Test 5b: Large Number of Attachments
1. [ ] Upload 10+ files to one invoice
2. [ ] Verify all upload successfully
3. [ ] View invoice details
4. [ ] Verify all attachments are listed
5. [ ] Verify page scrolls properly

### Test 5c: Special Characters in File Names
1. [ ] Upload a file with special characters (e.g., `invoice #123 (final).pdf`)
2. [ ] Verify upload works
3. [ ] View invoice details
4. [ ] Verify file name displays correctly
5. [ ] Verify download works

### Test 5d: Multiple Invoices Same Project
1. [ ] Create 3 invoices in the same project
2. [ ] Upload different files to each
3. [ ] View details for each invoice
4. [ ] Verify attachments are correctly linked to their respective invoices

---

## Test 6: Cross-Browser Testing

### Browsers to Test:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

### For Each Browser:
1. [ ] Upload files via drag & drop
2. [ ] Upload files via click
3. [ ] View invoice details
4. [ ] Download attachments
5. [ ] Check storage quota display

---

## Test 7: Performance

### Test 7a: Upload Speed
1. [ ] Upload a 10MB PDF
2. [ ] Note the time taken
3. [ ] Expected: < 30 seconds on good connection

### Test 7b: Page Load Speed
1. [ ] View invoice with 10 attachments
2. [ ] Note the time to load attachments section
3. [ ] Expected: < 3 seconds

### Test 7c: Storage Quota Update
1. [ ] Upload a file
2. [ ] Note time for quota to update
3. [ ] Expected: Immediate (< 1 second)

---

## Test 8: Security

### Test 8a: Signed URL Expiration
1. [ ] Get a signed URL from invoice details
2. [ ] Copy the URL
3. [ ] Wait 2 hours
4. [ ] Try to access the URL
5. [ ] Expected: Access denied or expired message

### Test 8b: Cross-Customer Access
1. [ ] Create invoice with attachments as Developer A
2. [ ] Log out
3. [ ] Log in as Developer B (different customer)
4. [ ] Try to access Developer A's invoice
5. [ ] Expected: Access denied or not found

### Test 8c: Unauthenticated Access
1. [ ] Get a signed URL
2. [ ] Log out
3. [ ] Try to access the URL in incognito mode
4. [ ] Expected: Works (signed URL is temporary public)
5. [ ] After 1 hour, try again
6. [ ] Expected: Access denied (expired)

---

## Regression Tests

### Ensure Existing Features Still Work:
- [ ] Create invoice without attachments
- [ ] Edit invoice details
- [ ] Mark invoice as paid
- [ ] Delete invoice
- [ ] View purchase orders
- [ ] Create purchase orders
- [ ] Vendor management
- [ ] Project dashboard KPIs

---

## Post-Test Verification

### Database:
1. [ ] Check `invoice_attachments` table has records
2. [ ] Verify `customer.storage_used` is updated
3. [ ] Check `storage_transactions` has audit logs

### Digital Ocean Spaces:
1. [ ] Log into Digital Ocean
2. [ ] Navigate to Spaces
3. [ ] Verify files exist in correct path:
   - `customers/{customerId}/invoices/attachments/{filename}`

### Logs:
1. [ ] Check backend logs for errors
2. [ ] Check browser console for errors
3. [ ] Verify no unexpected warnings

---

## Known Issues / Limitations

### Current Limitations:
- [ ] Maximum 50MB per file
- [ ] Only PDF, DOCX, JPEG supported
- [ ] Signed URLs expire after 1 hour
- [ ] No bulk delete for attachments
- [ ] No attachment editing (must delete and re-upload)

### Future Enhancements:
- [ ] Support more file types (PNG, XLSX, etc.)
- [ ] Attachment preview in modal
- [ ] Bulk upload (zip file)
- [ ] Attachment versioning
- [ ] Attachment comments/notes

---

## Test Results Summary

### Test Date: _______________
### Tester: _______________

| Test | Status | Notes |
|------|--------|-------|
| Upload Attachments | ☐ Pass ☐ Fail | |
| View Attachments | ☐ Pass ☐ Fail | |
| Storage Quota | ☐ Pass ☐ Fail | |
| Error Handling | ☐ Pass ☐ Fail | |
| Edge Cases | ☐ Pass ☐ Fail | |
| Cross-Browser | ☐ Pass ☐ Fail | |
| Performance | ☐ Pass ☐ Fail | |
| Security | ☐ Pass ☐ Fail | |
| Regression | ☐ Pass ☐ Fail | |

### Overall Result: ☐ PASS ☐ FAIL

### Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 

---

*Last updated: November 18, 2025*

