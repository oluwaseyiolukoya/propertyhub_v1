#!/bin/bash

# Test Monicredit Webhook Endpoint
# This script sends a test webhook payload to the local backend

echo "🧪 Testing Monicredit Webhook Endpoint"
echo "======================================"
echo ""

# Test payload based on what we expect Monicredit to send
# Adjust these values based on your actual payment
ORDER_ID="PH-1765989259432-nzgcko"
TRANSACTION_ID="ACX6942DB8C6794A"
CUSTOMER_ID="c97b0fb3-b857-416f-9071-82c9eda4169b"

echo "Sending test webhook with:"
echo "  Order ID: $ORDER_ID"
echo "  Transaction ID: $TRANSACTION_ID"
echo "  Customer ID: $CUSTOMER_ID"
echo ""

# Test 1: With customerId
echo "Test 1: Webhook with customerId"
curl -X POST http://localhost:5000/api/monicredit/webhook/payment \
  -H "Content-Type: application/json" \
  -d "{
    \"transaction_id\": \"$TRANSACTION_ID\",
    \"order_id\": \"$ORDER_ID\",
    \"status\": \"APPROVED\",
    \"amount\": 10000,
    \"customerId\": \"$CUSTOMER_ID\"
  }"

echo ""
echo ""
echo "Test 2: Webhook without customerId (should find payment by order_id)"
curl -X POST http://localhost:5000/api/monicredit/webhook/payment \
  -H "Content-Type: application/json" \
  -d "{
    \"transaction_id\": \"$TRANSACTION_ID\",
    \"order_id\": \"$ORDER_ID\",
    \"status\": \"APPROVED\",
    \"amount\": 10000
  }"

echo ""
echo ""
echo "✅ Test complete! Check backend logs for webhook processing."
