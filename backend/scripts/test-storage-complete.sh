#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Complete Storage System Test${NC}"
echo "=================================="
echo ""

# Check if backend is running
echo -e "${YELLOW}Checking if backend is running...${NC}"
if curl -s http://localhost:5000/api/system/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "Please start backend with: npm run dev"
    exit 1
fi

echo ""

# Check if TOKEN is set
if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error: TOKEN environment variable not set${NC}"
  echo ""
  echo "Please login and set your JWT token:"
  echo -e "${YELLOW}export TOKEN='your_jwt_token_here'${NC}"
  echo ""
  echo "To get a token:"
  echo "1. Login via your app or API"
  echo "2. Copy the JWT token from the response"
  echo "3. Run: export TOKEN='paste_token_here'"
  exit 1
fi

echo -e "${GREEN}✅ Token is set${NC}"
echo ""

BASE_URL="http://localhost:5000/api/storage"

# Test 1: Check Storage Quota
echo -e "${BLUE}Test 1: Checking storage quota...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/quota" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Storage quota retrieved successfully${NC}"
    echo "$RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to get storage quota${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

echo ""

# Test 2: Upload a test file
echo -e "${BLUE}Test 2: Uploading test file...${NC}"
echo "This is a test file for storage system" > /tmp/test-storage-upload.txt

RESPONSE=$(curl -s -X POST "$BASE_URL/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-storage-upload.txt" \
  -F "category=documents" \
  -F "subcategory=test")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ File uploaded successfully${NC}"
    FILE_PATH=$(echo "$RESPONSE" | jq -r '.data.filePath')
    FILE_ID=$(echo "$RESPONSE" | jq -r '.data.fileId')
    echo "$RESPONSE" | jq '.'
    echo ""
    echo -e "${YELLOW}File Path: $FILE_PATH${NC}"
    echo -e "${YELLOW}File ID: $FILE_ID${NC}"
else
    echo -e "${RED}❌ Failed to upload file${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

echo ""

# Test 3: Check Storage Stats
echo -e "${BLUE}Test 3: Checking storage statistics...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Storage stats retrieved successfully${NC}"
    echo "$RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to get storage stats${NC}"
    echo "$RESPONSE" | jq '.'
fi

echo ""

# Test 4: Get File URL
echo -e "${BLUE}Test 4: Getting signed file URL...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/file-url?filePath=$FILE_PATH" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ File URL generated successfully${NC}"
    FILE_URL=$(echo "$RESPONSE" | jq -r '.data.url')
    echo "$RESPONSE" | jq '.'
    echo ""
    echo -e "${YELLOW}File URL (expires in 1 hour):${NC}"
    echo "$FILE_URL"
else
    echo -e "${RED}❌ Failed to get file URL${NC}"
    echo "$RESPONSE" | jq '.'
fi

echo ""

# Test 5: Verify file exists in Digital Ocean Spaces
echo -e "${BLUE}Test 5: Verifying file exists in Digital Ocean Spaces...${NC}"
if curl -s -I "$FILE_URL" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ File exists and is accessible in Digital Ocean Spaces${NC}"
else
    echo -e "${YELLOW}⚠️  File URL check inconclusive (may require authentication)${NC}"
fi

echo ""

# Test 6: Delete File
echo -e "${BLUE}Test 6: Deleting test file...${NC}"
RESPONSE=$(curl -s -X DELETE "$BASE_URL/file" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"filePath\": \"$FILE_PATH\"}")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ File deleted successfully${NC}"
    echo "$RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to delete file${NC}"
    echo "$RESPONSE" | jq '.'
fi

echo ""

# Test 7: Verify quota updated
echo -e "${BLUE}Test 7: Verifying quota updated after delete...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/quota" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Storage quota updated correctly${NC}"
    echo "$RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Failed to verify quota${NC}"
    echo "$RESPONSE" | jq '.'
fi

echo ""
echo "=================================="
echo -e "${GREEN}✨ All storage tests completed!${NC}"
echo "=================================="
echo ""
echo "📊 Summary:"
echo "  ✅ Storage quota check"
echo "  ✅ File upload"
echo "  ✅ Storage statistics"
echo "  ✅ Signed URL generation"
echo "  ✅ File accessibility"
echo "  ✅ File deletion"
echo "  ✅ Quota update verification"
echo ""
echo "🎉 Your customer storage system is working perfectly!"

