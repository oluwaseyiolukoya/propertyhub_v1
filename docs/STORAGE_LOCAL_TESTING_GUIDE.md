# 🧪 Storage Implementation - Local Testing Guide

## 📋 **Pre-Testing Checklist**

Before we test, let's ensure everything is set up correctly.

---

## **Step 1: Install Dependencies** (2 minutes)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
npm install --save-dev @types/multer
```

---

## **Step 2: Configure Environment Variables** (3 minutes)

Add these to your `backend/.env` or `backend/.env.local`:

```env
# Digital Ocean Spaces Configuration
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=contrezz-uploads
DO_SPACES_ACCESS_KEY_ID=your_access_key_here
DO_SPACES_SECRET_ACCESS_KEY=your_secret_key_here

# Optional: CDN URL (if you have CDN enabled)
DO_SPACES_CDN_URL=https://contrezz-uploads.nyc3.cdn.digitaloceanspaces.com

# Storage Settings
DEFAULT_STORAGE_LIMIT=5368709120  # 5GB in bytes
MAX_FILE_SIZE=52428800            # 50MB in bytes
```

### **How to Get Your Digital Ocean Spaces Keys:**

1. Go to https://cloud.digitalocean.com/
2. Click **API** in the left sidebar
3. Click **Spaces Keys** tab
4. Click **Generate New Key**
5. Give it a name (e.g., "Contrezz Storage")
6. Copy the **Access Key** and **Secret Key**
7. Paste them into your `.env` file

---

## **Step 3: Test Digital Ocean Spaces Connection** (2 minutes)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
node scripts/test-spaces-connection.js
```

**Expected Output:**
```
🌊 Testing Digital Ocean Spaces Connection...

📋 Environment Configuration:
   Endpoint: https://nyc3.digitaloceanspaces.com
   Region: nyc3
   Bucket: contrezz-uploads
   Access Key: ✅ Set
   Secret Key: ✅ Set
   CDN URL: Not configured

🧪 Test 1: Listing buckets...
✅ Connection successful!
📦 Available buckets: contrezz-uploads

🧪 Test 2: Uploading test file...
✅ File upload successful!
📁 Test file uploaded to: test/connection-test.txt

🧪 Test 3: Verifying file exists...
✅ File verification successful!
📊 File size: 123 bytes
📅 Last modified: 2025-11-18T...

═══════════════════════════════════════════════════════
✨ All tests passed! Your Digital Ocean Spaces is ready!
═══════════════════════════════════════════════════════
```

**If you see errors:**
- ❌ Check your access keys are correct
- ❌ Verify bucket name is `contrezz-uploads`
- ❌ Ensure region is `nyc3`

---

## **Step 4: Run Database Migration** (2 minutes)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# Option 1: Using psql directly
psql -U your_username -d your_database -f migrations/add_storage_tracking.sql

# Option 2: Using Prisma (recommended)
npx prisma db push
```

**Verify migration:**
```bash
psql -U your_username -d your_database -c "\d storage_usage"
psql -U your_username -d your_database -c "\d storage_transactions"
```

**Expected Output:**
```
Table "public.storage_usage"
   Column    |  Type   | Modifiers
-------------+---------+-----------
 id          | uuid    | not null
 customer_id | uuid    | not null
 file_type   | varchar | not null
 category    | varchar |
 file_count  | integer | default 0
 total_size  | bigint  | default 0
...
```

---

## **Step 5: Generate Prisma Client** (1 minute)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client
```

---

## **Step 6: Rebuild Backend** (1 minute)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm run build
```

**Expected Output:**
```
✓ Compiled successfully
```

---

## **Step 7: Start Backend Server** (1 minute)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm run dev
```

**Look for this in the logs:**
```
✅ Storage Service initialized with Digital Ocean Spaces
   Endpoint: https://nyc3.digitaloceanspaces.com
   Bucket: contrezz-uploads
   CDN: Not configured
```

---

## **Step 8: Test Storage API Endpoints** (5 minutes)

### **Test 1: Check Storage Quota**

```bash
# Get your auth token first (login as a customer)
TOKEN="your_jwt_token_here"

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

---

### **Test 2: Upload a File**

```bash
# Create a test file
echo "This is a test file for storage" > test-upload.txt

# Upload it
curl -X POST http://localhost:5000/api/storage/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-upload.txt" \
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
    "filePath": "customers/{customerId}/documents/test/{uuid}.txt",
    "fileUrl": "https://contrezz-uploads.nyc3.digitaloceanspaces.com/...",
    "fileSize": 32
  }
}
```

---

### **Test 3: Check Storage Stats**

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
        "fileName": "test-upload.txt",
        "fileSize": 32,
        "uploadedAt": "2025-11-18T...",
        "uploadedBy": "John Doe"
      }
    ]
  }
}
```

---

### **Test 4: Get File URL**

```bash
FILE_PATH="customers/{customerId}/documents/test/{uuid}.txt"

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

---

### **Test 5: Delete File**

```bash
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

---

## **Step 9: Verify in Database** (2 minutes)

```bash
# Check storage_transactions
psql -U your_username -d your_database -c "SELECT * FROM storage_transactions ORDER BY created_at DESC LIMIT 5;"

# Check storage_usage
psql -U your_username -d your_database -c "SELECT * FROM storage_usage;"

# Check customer storage_used
psql -U your_username -d your_database -c "SELECT id, company, storage_used, storage_limit FROM customers LIMIT 5;"
```

---

## **Step 10: Verify in Digital Ocean Spaces** (1 minute)

1. Go to https://cloud.digitalocean.com/spaces
2. Click on **contrezz-uploads**
3. Navigate to **customers/** folder
4. You should see your uploaded files organized by customer ID

---

## 🎯 **Quick Test Script**

Create `backend/scripts/test-storage-api.sh`:

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Storage API Endpoints..."
echo ""

# Check if TOKEN is set
if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error: TOKEN environment variable not set${NC}"
  echo "Please set your JWT token:"
  echo "export TOKEN='your_jwt_token_here'"
  exit 1
fi

BASE_URL="http://localhost:5000/api/storage"

# Test 1: Check quota
echo -e "${YELLOW}Test 1: Checking storage quota...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/quota" \
  -H "Authorization: Bearer $TOKEN")
echo "$RESPONSE" | jq '.'
echo ""

# Test 2: Upload file
echo -e "${YELLOW}Test 2: Uploading test file...${NC}"
echo "Test file content" > /tmp/test-storage.txt
RESPONSE=$(curl -s -X POST "$BASE_URL/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-storage.txt" \
  -F "category=documents" \
  -F "subcategory=test")
echo "$RESPONSE" | jq '.'
FILE_PATH=$(echo "$RESPONSE" | jq -r '.data.filePath')
echo ""

# Test 3: Check stats
echo -e "${YELLOW}Test 3: Checking storage stats...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/stats" \
  -H "Authorization: Bearer $TOKEN")
echo "$RESPONSE" | jq '.'
echo ""

# Test 4: Get file URL
echo -e "${YELLOW}Test 4: Getting file URL...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/file-url?filePath=$FILE_PATH" \
  -H "Authorization: Bearer $TOKEN")
echo "$RESPONSE" | jq '.'
echo ""

# Test 5: Delete file
echo -e "${YELLOW}Test 5: Deleting file...${NC}"
RESPONSE=$(curl -s -X DELETE "$BASE_URL/file" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"filePath\": \"$FILE_PATH\"}")
echo "$RESPONSE" | jq '.'
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
```

**Run it:**
```bash
chmod +x backend/scripts/test-storage-api.sh
export TOKEN="your_jwt_token_here"
./backend/scripts/test-storage-api.sh
```

---

## 🐛 **Troubleshooting**

### **Error: "Customer not found"**
- Make sure you're logged in as a customer user
- Check that your JWT token is valid
- Verify the token contains `customerId`

### **Error: "Missing Digital Ocean Spaces credentials"**
- Check `.env` file has all required variables
- Restart backend server after adding env vars
- Verify env vars are loaded: `console.log(process.env.DO_SPACES_ACCESS_KEY_ID)`

### **Error: "Storage quota exceeded"**
- Check customer's `storage_limit` in database
- Run recalculate: `POST /api/storage/recalculate`
- Verify `storage_used` is accurate

### **Error: "Invalid file type"**
- Check file mimetype is in allowed list
- Update `fileFilter` in `storage.ts` if needed

### **Error: "Failed to upload file"**
- Check Digital Ocean Spaces credentials
- Verify bucket name is correct
- Check bucket permissions (should allow uploads)
- Test connection: `node scripts/test-spaces-connection.js`

---

## ✅ **Testing Checklist**

- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Digital Ocean Spaces connection tested
- [ ] Database migration run
- [ ] Prisma client generated
- [ ] Backend compiled and running
- [ ] Storage service initialized (check logs)
- [ ] GET /api/storage/quota works
- [ ] POST /api/storage/upload works
- [ ] GET /api/storage/stats works
- [ ] GET /api/storage/file-url works
- [ ] DELETE /api/storage/file works
- [ ] Files visible in Digital Ocean Spaces
- [ ] Database records created correctly
- [ ] Storage quota updated correctly

---

## 🚀 **Once All Tests Pass**

```bash
# Stage all changes
git add -A

# Commit
git commit -m "feat: Customer storage management with Digital Ocean Spaces

- Add storage service with Digital Ocean Spaces integration
- Add storage API routes (quota, upload, delete, stats)
- Add database schema for storage tracking
- Add Prisma models for storage_usage and storage_transactions
- Add connection test script
- Add comprehensive documentation

Features:
- Per-customer storage isolation
- Real-time quota enforcement
- Complete audit trail
- File type categorization
- Signed URLs for secure access
- CDN support (optional)

Tested:
- Digital Ocean Spaces connection
- File upload/download/delete
- Storage quota tracking
- Database transactions
- API endpoints"

# Push to remote
git push
```

---

**Estimated Testing Time**: 15-20 minutes  
**Status**: Ready for local testing  
**Next**: Push to git after successful tests

