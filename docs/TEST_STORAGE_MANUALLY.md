# 🧪 Manual Storage Testing Guide

## 📋 **Prerequisites**

1. ✅ Backend is running (`npm run dev`)
2. ✅ You have a customer account
3. ✅ You have a JWT token from login

---

## 🚀 **Quick Test (5 minutes)**

### **Step 1: Get Your JWT Token**

#### **Option A: Login via Frontend**
1. Login to your app as a customer
2. Open browser DevTools (F12)
3. Go to Application → Local Storage
4. Find `token` or `authToken`
5. Copy the value

#### **Option B: Login via API**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-customer@email.com",
    "password": "your-password"
  }'
```

Copy the `token` from the response.

---

### **Step 2: Set Token as Environment Variable**

```bash
export TOKEN="paste_your_jwt_token_here"
```

---

### **Step 3: Test Storage Quota**

```bash
curl -X GET http://localhost:5000/api/storage/quota \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "used": 0,
    "limit": 5368709120,
    "available": 5368709120,
    "percentage": 0,
    "usedFormatted": "0 Bytes",
    "limitFormatted": "5 GB",
    "availableFormatted": "5 GB"
  }
}
```

✅ **If you see this, storage quota tracking is working!**

---

### **Step 4: Upload a Test File**

Create a test file:
```bash
echo "This is a test file for storage" > test-file.txt
```

Upload it:
```bash
curl -X POST http://localhost:5000/api/storage/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-file.txt" \
  -F "category=documents" \
  -F "subcategory=test"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "success": true,
    "fileId": "uuid-here",
    "filePath": "customers/{customerId}/documents/test/uuid.txt",
    "fileUrl": "https://contrezz-uploads.nyc3.digitaloceanspaces.com/...",
    "fileSize": 32
  }
}
```

✅ **If you see this, file upload is working!**

**Save the `filePath` for the next steps.**

---

### **Step 5: Check Storage Statistics**

```bash
curl -X GET http://localhost:5000/api/storage/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "quota": {
      "used": 32,
      "limit": 5368709120,
      "available": 5368709088,
      "percentage": 0.0000006,
      "canUpload": true
    },
    "breakdown": [
      {
        "fileType": "document",
        "category": "test",
        "fileCount": 1,
        "totalSize": 32,
        "percentage": 100
      }
    ],
    "recentUploads": [
      {
        "fileName": "test-file.txt",
        "fileSize": 32,
        "uploadedAt": "2025-11-18T...",
        "uploadedBy": "Your Name"
      }
    ]
  }
}
```

✅ **If you see this, storage tracking and statistics are working!**

---

### **Step 6: Get Signed File URL**

```bash
# Replace FILE_PATH with the path from Step 4
FILE_PATH="customers/{customerId}/documents/test/uuid.txt"

curl -X GET "http://localhost:5000/api/storage/file-url?filePath=$FILE_PATH" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://contrezz-uploads.nyc3.digitaloceanspaces.com/...",
    "expiresIn": 3600
  }
}
```

✅ **If you see this, signed URL generation is working!**

---

### **Step 7: Verify File in Digital Ocean Spaces**

1. Go to https://cloud.digitalocean.com/spaces
2. Click on **contrezz-uploads**
3. Navigate to **customers/** folder
4. You should see your customer's folder
5. Navigate to **documents/test/**
6. You should see your uploaded file!

✅ **If you see the file, Digital Ocean Spaces integration is working!**

---

### **Step 8: Delete the Test File**

```bash
# Use the FILE_PATH from Step 4
curl -X DELETE http://localhost:5000/api/storage/file \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"filePath\": \"$FILE_PATH\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

✅ **If you see this, file deletion is working!**

---

### **Step 9: Verify Quota Updated**

```bash
curl -X GET http://localhost:5000/api/storage/quota \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "used": 0,
    "limit": 5368709120,
    "percentage": 0,
    ...
  }
}
```

✅ **If `used` is back to 0, quota tracking is working correctly!**

---

## 🎯 **Automated Test Script**

For easier testing, use the automated script:

```bash
# Make it executable
chmod +x backend/scripts/test-storage-complete.sh

# Set your token
export TOKEN="your_jwt_token_here"

# Run the test
./backend/scripts/test-storage-complete.sh
```

This will run all 7 tests automatically and show you the results.

---

## 🔍 **Verify in Database**

Check the database to see storage records:

```bash
# Connect to your database
psql -U your_username -d your_database

# Check storage transactions
SELECT * FROM storage_transactions ORDER BY created_at DESC LIMIT 5;

# Check storage usage breakdown
SELECT * FROM storage_usage;

# Check customer storage
SELECT id, company, storage_used, storage_limit 
FROM customers 
WHERE storage_used > 0 
LIMIT 5;
```

---

## ✅ **Success Checklist**

- [ ] Backend is running
- [ ] Got JWT token
- [ ] Storage quota endpoint works
- [ ] File upload works
- [ ] File appears in Digital Ocean Spaces
- [ ] Storage stats show correct data
- [ ] Signed URL generation works
- [ ] File deletion works
- [ ] Quota updates after deletion
- [ ] Database records are created
- [ ] Files are organized by customer ID

---

## 🐛 **Common Issues**

### **"Unauthorized" or "Access denied"**
- Your JWT token is invalid or expired
- You're not logged in as a customer
- Token doesn't contain `customerId`

**Solution:** Login again and get a fresh token

---

### **"Storage quota exceeded"**
- Customer has reached their storage limit

**Solution:** 
```bash
# Increase limit in database
UPDATE customers SET storage_limit = 10737418240 WHERE id = 'customer_id';
```

---

### **"Invalid file type"**
- File type is not in the allowed list

**Solution:** Check `backend/src/routes/storage.ts` and add your file type to `allowedMimes`

---

### **File upload succeeds but file not in Spaces**
- Check Digital Ocean Spaces credentials
- Verify bucket name is correct
- Check bucket permissions

**Solution:** Run `node scripts/test-spaces-connection.js` again

---

## 🎉 **All Tests Passed?**

If all tests pass, your customer storage system is **fully functional**! 🚀

You can now:
- Upload files from your frontend
- Track storage usage per customer
- Enforce storage quotas
- Generate secure file URLs
- Manage files in Digital Ocean Spaces

---

**Ready to push to git!** 🎯

