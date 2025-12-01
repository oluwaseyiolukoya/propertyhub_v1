#!/bin/bash

# Find Customer by Verification Request ID
# Usage: ./find-customer-by-request.sh <request_id>

REQUEST_ID=$1

if [ -z "$REQUEST_ID" ]; then
  echo "Usage: ./find-customer-by-request.sh <request_id>"
  echo "Example: ./find-customer-by-request.sh 090cc0a0-6786-48ae-af39-e37fddc1f188"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Finding customer for request: $REQUEST_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Load environment variables
if [ -f "verification-service/.env" ]; then
  export $(cat verification-service/.env | grep -v '^#' | xargs)
fi

# Step 1: Get customer ID from verification database
echo ""
echo "📋 Step 1: Querying verification database..."
echo ""

CUSTOMER_ID=$(psql "$DATABASE_URL" -t -c "
  SELECT \"customerId\"
  FROM verification_requests
  WHERE id = '$REQUEST_ID';
" | xargs)

if [ -z "$CUSTOMER_ID" ]; then
  echo "❌ Request ID not found in verification database!"
  exit 1
fi

echo "✅ Found Customer ID: $CUSTOMER_ID"

# Get full request details
echo ""
echo "📄 Request Details:"
echo ""

psql "$DATABASE_URL" -c "
  SELECT
    vr.id AS request_id,
    vr.\"customerId\",
    vr.\"customerType\",
    vr.status,
    vr.\"submittedAt\",
    COUNT(vd.id) AS total_documents
  FROM verification_requests vr
  LEFT JOIN verification_documents vd ON vd.\"requestId\" = vr.id
  WHERE vr.id = '$REQUEST_ID'
  GROUP BY vr.id;
"

# Get document details
echo ""
echo "📎 Documents:"
echo ""

psql "$DATABASE_URL" -c "
  SELECT
    \"documentType\",
    \"fileName\",
    status,
    \"createdAt\"
  FROM verification_documents
  WHERE \"requestId\" = '$REQUEST_ID'
  ORDER BY \"createdAt\" ASC;
"

# Step 2: Get customer details from main database
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 2: Querying main database for customer details..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Load main database URL
if [ -f "backend/.env" ]; then
  export $(cat backend/.env | grep DATABASE_URL | xargs)
fi

psql "$DATABASE_URL" -c "
  SELECT
    id,
    company,
    owner,
    email,
    phone,
    \"kycStatus\",
    \"kycVerificationId\",
    status,
    \"createdAt\"
  FROM customers
  WHERE id = '$CUSTOMER_ID';
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Customer lookup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

