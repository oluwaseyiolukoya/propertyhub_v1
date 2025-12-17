#!/bin/bash

# Test webhook for a specific payment
# Usage: bash scripts/test-webhook-for-payment.sh [order_id] [transaction_id] [customer_id]
#
# To get payment details first, run:
#   bash scripts/get-payment-details.sh [order_id]

ORDER_ID="${1:-PH-1765993730760-l5gwrm}"
TRANSACTION_ID="${2:-}"
CUSTOMER_ID="${3:-}"

# If customer_id not provided, try to get it from database
if [ -z "$CUSTOMER_ID" ]; then
  echo "⚠️  Customer ID not provided. Attempting to get from database..."
  if command -v node &> /dev/null; then
    cd "$(dirname "$0")/.."
    CUSTOMER_ID=$(node -e "
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      (async () => {
        const payment = await prisma.payments.findFirst({
          where: { providerReference: '$ORDER_ID', provider: 'monicredit' },
          select: { customerId: true }
        });
        console.log(payment?.customerId || '');
        await prisma.\$disconnect();
      })();
    " 2>/dev/null)

    if [ -z "$CUSTOMER_ID" ]; then
      echo "❌ Could not find customer ID. Please provide it manually:"
      echo "   bash scripts/test-webhook-for-payment.sh $ORDER_ID $TRANSACTION_ID YOUR_CUSTOMER_ID"
      exit 1
    else
      echo "✅ Found customer ID: $CUSTOMER_ID"
    fi
  else
    echo "❌ Node.js not found. Please provide customer ID manually."
    exit 1
  fi
fi

echo "🧪 Testing Webhook for Payment"
echo "=============================="
echo ""
echo "Order ID: $ORDER_ID"
echo "Transaction ID: $TRANSACTION_ID"
echo "Customer ID: $CUSTOMER_ID"
echo ""

# If transaction_id not provided, try to extract from recent logs or use placeholder
if [ -z "$TRANSACTION_ID" ]; then
  echo "⚠️  Transaction ID not provided. Using placeholder."
  echo "   (In real scenario, Monicredit sends this in webhook)"
  TRANSACTION_ID="ACX_PLACEHOLDER"
fi

echo "Sending webhook payload..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5000/api/monicredit/webhook/payment \
  -H "Content-Type: application/json" \
  -d "{
    \"transaction_id\": \"$TRANSACTION_ID\",
    \"order_id\": \"$ORDER_ID\",
    \"status\": \"APPROVED\",
    \"amount\": 10000,
    \"customerId\": \"$CUSTOMER_ID\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response (HTTP $HTTP_CODE):"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Webhook accepted"
  echo ""
  echo "📋 Next steps:"
  echo "  1. Check backend logs for webhook processing"
  echo "  2. Verify payment status in database"
  echo "  3. Check if payment was found and updated"
else
  echo "❌ Webhook rejected (HTTP $HTTP_CODE)"
fi
