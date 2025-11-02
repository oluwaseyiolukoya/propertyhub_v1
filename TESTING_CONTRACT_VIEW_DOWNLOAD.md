# Testing Contract View & Download Feature

## Quick Test Guide

### Prerequisites
- Backend running on port 5000 ✅
- Frontend running on port 5173 ✅
- Logged in as a Tenant user

### Test Steps

#### 1. Navigate to Documents Page
1. Login as a tenant (e.g., `testtenantuser@gmail.com`)
2. Click on "Documents" in the sidebar
3. You should see the Documents page with tabs

#### 2. Test Document Viewing
1. **View from Document Card**:
   - Locate any document in the list
   - Click the eye icon (👁️) button
   - A large modal dialog should open showing:
     - Document name and description
     - Document details (format, size, date)
     - Download buttons for PDF and DOCX
     - Document preview in an iframe

2. **View from Tabs**:
   - Navigate to "Lease & Inspections" tab
   - Click "View" button on a lease document
   - Modal should open with document preview

#### 3. Test Document Downloading

**From Document Card:**
1. Click the download icon (⬇️) on any document
2. Document should open in a new tab/window
3. Success toast notification should appear

**From View Dialog:**
1. Open a document using "View" button
2. Click "PDF" button to download as PDF
3. Click "DOCX" button to download as DOCX
4. Each download should:
   - Open in a new tab/window
   - Show success toast notification
   - Download the correct format

#### 4. Test Different Document Types

**Lease Agreement (Generated Contract):**
- Should preview in PDF format
- Download as PDF should work
- Download as DOCX should work

**Uploaded PDF:**
- Should preview in iframe
- Download should serve original file

**Uploaded Image:**
- Should display as image in modal
- Download should serve original file

#### 5. Test Modal Functionality
1. Open document view dialog
2. Click outside modal to close (or X button)
3. Modal should close smoothly
4. Open another document
5. Previous document should be replaced

### Expected Results

✅ **View Button Works**: Modal opens with document preview
✅ **Download Button Works**: Document downloads in new tab
✅ **Format Selection Works**: Can choose PDF or DOCX
✅ **Toast Notifications**: Success messages appear
✅ **Modal Closes**: Dialog closes properly
✅ **Preview Displays**: Documents show correctly in iframe/img
✅ **No Console Errors**: Check browser console for errors

### Common Issues & Solutions

#### Issue: "Failed to load document"
- **Solution**: Check backend is running and document exists in database

#### Issue: Preview shows blank
- **Solution**: 
  - Check if document has content or fileUrl
  - Verify file path is correct
  - Check browser console for CORS errors

#### Issue: Download fails
- **Solution**:
  - Verify user has access to document
  - Check backend logs for permission errors
  - Ensure document ID is valid

#### Issue: DOCX download not working
- **Solution**:
  - Check if document has HTML content in metadata
  - Verify docx library is installed in backend
  - Check backend logs for conversion errors

### Browser Console Commands

To test programmatically:
```javascript
// Check if documents are loaded
console.log('Documents:', localStorage.getItem('documents'));

// Check API URL
console.log('API URL:', import.meta.env.VITE_API_URL);

// Test download URL generation
const testUrl = downloadDocumentInFormat('test-id', 'pdf');
console.log('Download URL:', testUrl);
```

### Backend Verification

Check backend logs:
```bash
tail -f /tmp/backend.log
```

Expected log entries when viewing/downloading:
- "Download access check: ..."
- "Download access result: true"
- No error messages

### Success Criteria
- ✅ All documents can be viewed
- ✅ All documents can be downloaded
- ✅ PDF and DOCX formats work
- ✅ Modal UI is responsive
- ✅ No console errors
- ✅ Toast notifications appear
- ✅ User experience is smooth

## Next Steps
If all tests pass, the feature is ready for production use!

