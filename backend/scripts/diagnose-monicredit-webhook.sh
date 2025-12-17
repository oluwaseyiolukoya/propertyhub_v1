#!/bin/bash

# Professional Diagnostic Script for Monicredit Webhook Issues
# This script systematically checks each component of the webhook flow

echo "🔍 MONICREDIT WEBHOOK DIAGNOSTIC TOOL"
echo "======================================"
echo ""

# Configuration
ORDER_ID="PH-1765989259432-nzgcko"
TRANSACTION_ID="ACX6942DB8C6794A"
CUSTOMER_ID="c97b0fb3-b857-416f-9071-82c9eda4169b"
WEBHOOK_URL="http://localhost:5000/api/monicredit/webhook/payment"

echo "📋 Configuration:"
echo "  Order ID: $ORDER_ID"
echo "  Transaction ID: $TRANSACTION_ID"
echo "  Customer ID: $CUSTOMER_ID"
echo "  Webhook URL: $WEBHOOK_URL"
echo ""

# Step 1: Check if backend is running
echo "Step 1: Checking if backend is running..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is NOT running. Please start it with: cd backend && npm run dev"
    exit 1
fi
echo ""

# Step 2: Check if webhook endpoint is accessible
echo "Step 2: Testing webhook endpoint accessibility..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Webhook endpoint is accessible (HTTP $HTTP_CODE)"
else
    echo "❌ Webhook endpoint returned HTTP $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Step 3: Check database connection and payment record
echo "Step 3: Checking payment record in database..."
echo "   (This requires database access - checking via Prisma Studio or direct query)"
echo "   Run this SQL query to check payment status:"
echo ""
echo "   SELECT id, status, \"providerReference\", \"paidAt\", \"updatedAt\","
echo "          metadata->>'monicreditTransactionId' as transaction_id,"
echo "          metadata->>'webhookReceivedAt' as webhook_time"
echo "   FROM payments"
echo "   WHERE \"providerReference\" = '$ORDER_ID'"
echo "      OR metadata->>'monicreditTransactionId' = '$TRANSACTION_ID';"
echo ""

# Step 4: Test webhook with proper payload
echo "Step 4: Testing webhook with proper payload (with customerId)..."
echo "   Sending webhook payload:"
echo "   {"
echo "     \"transaction_id\": \"$TRANSACTION_ID\","
echo "     \"order_id\": \"$ORDER_ID\","
echo "     \"status\": \"APPROVED\","
echo "     \"amount\": 10000,"
echo "     \"customerId\": \"$CUSTOMER_ID\""
echo "   }"
echo ""

RESPONSE1=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"transaction_id\": \"$TRANSACTION_ID\",
    \"order_id\": \"$ORDER_ID\",
    \"status\": \"APPROVED\",
    \"amount\": 10000,
    \"customerId\": \"$CUSTOMER_ID\"
  }")
HTTP_CODE1=$(echo "$RESPONSE1" | tail -n1)
BODY1=$(echo "$RESPONSE1" | head -n-1)

echo "   Response (HTTP $HTTP_CODE1): $BODY1"
if [ "$HTTP_CODE1" = "200" ]; then
    echo "   ✅ Webhook accepted"
else
    echo "   ❌ Webhook rejected"
fi
echo ""

# Step 5: Test webhook without customerId
echo "Step 5: Testing webhook without customerId (fallback mode)..."
RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"transaction_id\": \"$TRANSACTION_ID\",
    \"order_id\": \"$ORDER_ID\",
    \"status\": \"APPROVED\",
    \"amount\": 10000
  }")
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | head -n-1)

echo "   Response (HTTP $HTTP_CODE2): $BODY2"
if [ "$HTTP_CODE2" = "200" ]; then
    echo "   ✅ Webhook accepted (fallback mode)"
else
    echo "   ❌ Webhook rejected"
fi
echo ""

# Step 6: Instructions for checking logs
echo "Step 6: Check backend logs for detailed processing information"
echo "   Look for these log entries in your backend terminal:"
echo "   - [Monicredit Payment Webhook] Request received"
echo "   - [Monicredit Payment Webhook] Extracted data"
echo "   - [Monicredit Payment Webhook] Found payment, updating status"
echo "   - [Monicredit Payment Webhook] Payment updated successfully"
echo "   - [Monicredit Payment Webhook] Payment not found (if payment not found)"
echo ""

# Step 7: Summary and next steps
echo "📊 DIAGNOSTIC SUMMARY"
echo "===================="
echo ""
echo "✅ Completed checks:"
echo "   1. Backend accessibility"
echo "   2. Webhook endpoint accessibility"
echo "   3. Webhook payload testing (with customerId)"
echo "   4. Webhook payload testing (without customerId)"
echo ""
echo "📝 Next steps:"
echo "   1. Check backend logs for detailed webhook processing"
echo "   2. Verify payment status in database (use SQL query above)"
echo "   3. If payment status is still 'pending', check logs for 'Payment not found'"
echo "   4. Verify the order_id and transaction_id match what's in the database"
echo ""
