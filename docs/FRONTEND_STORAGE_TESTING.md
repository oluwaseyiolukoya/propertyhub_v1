# 🧪 Frontend Storage Testing Guide

## 📋 **Quick Setup**

I've created a complete test component for you to test the storage system from your frontend.

---

## 🚀 **Option 1: Add Test Route (Quickest)**

### **Step 1: Add the Route**

Open your router file (e.g., `src/App.tsx` or your routes file) and add:

```typescript
import StorageTest from './components/StorageTest';

// Add this route (protected route - requires login)
<Route path="/storage-test" element={<StorageTest />} />
```

### **Step 2: Access the Test Page**

1. Start your frontend: `npm run dev`
2. Login as a customer
3. Navigate to: `http://localhost:5173/storage-test`

---

## 🎯 **Option 2: Add to Existing Dashboard**

### **Add to Customer Dashboard**

```typescript
import StorageTest from './components/StorageTest';

// In your dashboard component
<Tab label="Storage Test">
  <StorageTest />
</Tab>
```

---

## 🧪 **How to Test**

### **Test 1: Check Storage Quota** ✅

1. Open the test page
2. You should see your storage quota:
   - Used: 0 Bytes
   - Limit: 5 GB
   - Available: 5 GB
   - Progress bar showing 0%

**Expected Result:** ✅ Quota loads successfully

---

### **Test 2: Upload a File** ✅

1. Click "Choose File" button
2. Select any file (image, PDF, document, etc.)
3. Click "Upload File"
4. Wait for upload to complete

**Expected Result:**
- ✅ "Upload Successful!" message appears
- ✅ File ID and path displayed
- ✅ Storage quota updates automatically
- ✅ Progress bar increases

---

### **Test 3: Verify Storage Updates** ✅

After uploading:
1. Check the quota section
2. "Used" should now show the file size
3. Progress bar should reflect the usage
4. Percentage should be calculated

**Expected Result:** ✅ Quota reflects the uploaded file

---

### **Test 4: View Storage Statistics** ✅

Scroll down to see:
1. **Storage Breakdown**
   - File type (document, image, etc.)
   - Category (test)
   - File count
   - Total size

2. **Recent Uploads**
   - File name
   - Uploaded by (your name)
   - File size
   - Upload timestamp

**Expected Result:** ✅ Statistics show your uploaded file

---

### **Test 5: Delete File** ✅

1. Click "Delete This File" button
2. Confirm deletion
3. Wait for deletion to complete

**Expected Result:**
- ✅ "File deleted successfully!" alert
- ✅ Storage quota returns to 0
- ✅ Progress bar returns to 0%
- ✅ File removed from statistics

---

### **Test 6: Upload Multiple Files** ✅

1. Upload 2-3 different files
2. Check quota increases each time
3. Verify all files appear in statistics
4. Check breakdown by file type

**Expected Result:** ✅ Multiple files tracked correctly

---

## 📸 **What You Should See**

### **Initial State (No Files)**
```
📊 Storage Quota
Used: 0 Bytes
Limit: 5 GB
Available: 5 GB
Usage: 0.00%
[Progress bar at 0%]
```

### **After Upload (1 File)**
```
📊 Storage Quota
Used: 245 KB
Limit: 5 GB
Available: 4.99 GB
Usage: 0.005%
[Progress bar showing small blue bar]

✅ Upload Successful!
File ID: uuid-here
File Path: customers/{id}/documents/test/uuid.pdf
File Size: 245 KB
```

### **Storage Statistics**
```
📈 Storage Statistics

Storage Breakdown:
document (test)    1 files    0.24 MB

Recent Uploads:
test.pdf
by Your Name
245 KB
Nov 18, 2025, 10:30 PM
```

---

## 🐛 **Troubleshooting**

### **Error: "No token provided"**
- You're not logged in
- Login as a customer first

**Solution:**
```typescript
// Make sure you're logged in and have a valid token
localStorage.getItem('token') // Should return a JWT token
```

---

### **Error: "Access denied. Customer account required"**
- You're logged in as admin or developer
- You need a customer account

**Solution:** Login with a customer account that has `customerId`

---

### **Error: "Storage quota exceeded"**
- You've reached your storage limit

**Solution:**
```sql
-- Increase limit in database
UPDATE customers 
SET storage_limit = 10737418240 
WHERE id = 'your_customer_id';
```

---

### **Error: "Invalid file type"**
- File type not allowed

**Solution:** Check allowed file types in `backend/src/routes/storage.ts`

---

### **Upload succeeds but quota doesn't update**
- Frontend cache issue

**Solution:** Click "Refresh Quota" button or reload page

---

## 🎨 **Customize the Test Component**

### **Change Upload Category**

In `StorageTest.tsx`, line ~70:
```typescript
formData.append('category', 'documents'); // Change to: properties, tenants, projects
formData.append('subcategory', 'test'); // Change to: photos, leases, etc.
```

### **Add Entity ID**

```typescript
formData.append('entityId', 'property-123'); // Links file to specific entity
```

### **Add Metadata**

```typescript
formData.append('metadata', JSON.stringify({
  description: 'Test file',
  tags: ['test', 'demo'],
  propertyName: 'Sunset Apartments'
}));
```

---

## 🔍 **Verify in Digital Ocean Spaces**

After uploading files:

1. Go to https://cloud.digitalocean.com/spaces
2. Click on **contrezz-uploads**
3. Navigate to **customers/** folder
4. Find your customer ID folder
5. Navigate to **documents/test/**
6. You should see your uploaded files!

---

## 📊 **Verify in Database**

```sql
-- Check storage transactions
SELECT * FROM storage_transactions 
WHERE customer_id = 'your_customer_id' 
ORDER BY created_at DESC;

-- Check storage usage
SELECT * FROM storage_usage 
WHERE customer_id = 'your_customer_id';

-- Check customer storage
SELECT id, company, storage_used, storage_limit 
FROM customers 
WHERE id = 'your_customer_id';
```

---

## ✅ **Success Checklist**

- [ ] Test page loads without errors
- [ ] Storage quota displays correctly
- [ ] File upload works
- [ ] Quota updates after upload
- [ ] Progress bar updates
- [ ] Storage statistics show uploaded files
- [ ] File deletion works
- [ ] Quota returns to correct value after deletion
- [ ] Multiple files can be uploaded
- [ ] Files visible in Digital Ocean Spaces
- [ ] Database records created correctly

---

## 🚀 **Integration Example**

### **Use in Your App**

```typescript
// In any component where you need file upload
import { apiClient } from '../lib/api-client';

const handleFileUpload = async (file: File, category: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('subcategory', 'photos');
  formData.append('entityId', propertyId);

  try {
    const response = await apiClient.post('/api/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    if (response.data.success) {
      console.log('File uploaded:', response.data.data.filePath);
      // Update UI, show success message, etc.
    }
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

---

## 🎯 **Real-World Use Cases**

### **1. Property Photos**
```typescript
formData.append('category', 'properties');
formData.append('subcategory', 'photos');
formData.append('entityId', propertyId);
```

### **2. Lease Documents**
```typescript
formData.append('category', 'documents');
formData.append('subcategory', 'leases');
formData.append('entityId', tenantId);
```

### **3. Project Blueprints**
```typescript
formData.append('category', 'projects');
formData.append('subcategory', 'blueprints');
formData.append('entityId', projectId);
```

### **4. Tenant ID Documents**
```typescript
formData.append('category', 'tenants');
formData.append('subcategory', 'id-documents');
formData.append('entityId', tenantId);
```

---

## 📚 **Component Features**

The `StorageTest.tsx` component includes:

- ✅ **Storage Quota Display** - Real-time quota with progress bar
- ✅ **File Upload** - Drag & drop or click to select
- ✅ **Upload Progress** - Shows uploading state
- ✅ **Success Feedback** - Displays file details after upload
- ✅ **Storage Statistics** - Breakdown and recent uploads
- ✅ **File Deletion** - Test delete functionality
- ✅ **Auto-Refresh** - Quota and stats update after operations
- ✅ **Error Handling** - Clear error messages
- ✅ **Responsive Design** - Works on all screen sizes

---

## 🎉 **Expected Results**

If everything is working correctly:

1. ✅ Test page loads without errors
2. ✅ Quota shows 5 GB limit (or your plan's limit)
3. ✅ File uploads successfully
4. ✅ Quota updates in real-time
5. ✅ Statistics show uploaded files
6. ✅ Files appear in Digital Ocean Spaces
7. ✅ Database records are created
8. ✅ File deletion works
9. ✅ Quota returns to correct value

**If all these work, your storage system is fully functional!** 🚀

---

## 📞 **Need Help?**

If you encounter issues:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify you're logged in as a customer
4. Check Digital Ocean Spaces credentials
5. Verify database tables exist

---

**Your storage system is ready to test!** 🎯

