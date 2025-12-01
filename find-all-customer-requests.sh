#!/bin/bash

# Find All Verification Requests for a Customer
# Usage: ./find-all-customer-requests.sh <customer_id>

CUSTOMER_ID=$1

if [ -z "$CUSTOMER_ID" ]; then
  echo "Usage: ./find-all-customer-requests.sh <customer_id>"
  echo "Example: ./find-all-customer-requests.sh 38e87b52-f527-4140-8132-9beab49481ec"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Finding all verification requests for customer: $CUSTOMER_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Load environment variables
if [ -f "verification-service/.env" ]; then
  export $(cat verification-service/.env | grep -v '^#' | xargs)
fi

# Get customer details from main database
echo ""
echo "👤 Customer Details:"
echo ""

# Load main database URL
MAIN_DB_URL=$(grep DATABASE_URL backend/.env | cut -d '=' -f2- | tr -d '"' | sed 's/?schema=public//')

psql "$MAIN_DB_URL" -c "
  SELECT
    id,
    company,
    owner,
    email,
    \"kycStatus\",
    \"kycVerificationId\" AS current_request_id,
    status,
    \"createdAt\"
  FROM customers
  WHERE id = '$CUSTOMER_ID';
"

# Get all verification requests for this customer
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 All Verification Requests (Submission History):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

psql "$DATABASE_URL" -c "
  SELECT
    vr.id AS request_id,
    vr.status,
    vr.\"submittedAt\",
    vr.\"completedAt\",
    vr.\"reviewedBy\",
    vr.\"rejectionReason\",
    COUNT(vd.id) AS total_documents
  FROM verification_requests vr
  LEFT JOIN verification_documents vd ON vd.\"requestId\" = vr.id
  WHERE vr.\"customerId\" = '$CUSTOMER_ID'
  GROUP BY vr.id
  ORDER BY vr.\"submittedAt\" DESC;
"

# Get document details for each request
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📎 Documents by Request:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get all request IDs for this customer
REQUEST_IDS=$(psql "$DATABASE_URL" -t -c "
  SELECT id
  FROM verification_requests
  WHERE \"customerId\" = '$CUSTOMER_ID'
  ORDER BY \"submittedAt\" DESC;
" | xargs)

ATTEMPT=1
for REQUEST_ID in $REQUEST_IDS; do
  echo "📁 Attempt $ATTEMPT - Request: $REQUEST_ID"
  echo ""

  psql "$DATABASE_URL" -c "
    SELECT
      \"documentType\",
      \"fileName\",
      status,
      \"createdAt\",
      LEFT(\"fileUrl\", 80) || '...' AS file_path
    FROM verification_documents
    WHERE \"requestId\" = '$REQUEST_ID'
    ORDER BY \"createdAt\" ASC;
  "

  echo ""
  ATTEMPT=$((ATTEMPT + 1))
done

# Get verification history
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📜 Verification History (Audit Trail):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

psql "$DATABASE_URL" -c "
  SELECT
    vh.\"requestId\",
    vh.action,
    vh.\"performedBy\",
    vh.\"createdAt\"
  FROM verification_history vh
  JOIN verification_requests vr ON vh.\"requestId\" = vr.id
  WHERE vr.\"customerId\" = '$CUSTOMER_ID'
  ORDER BY vh.\"createdAt\" DESC
  LIMIT 20;
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Complete verification history retrieved!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

