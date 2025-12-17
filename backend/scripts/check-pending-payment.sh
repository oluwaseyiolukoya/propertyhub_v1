#!/bin/bash

# Check status of pending payment
# Usage: bash scripts/check-pending-payment.sh [order_id]

ORDER_ID="${1:-PH-1765994852895-r6cbpt}"

echo "🔍 Checking Payment Status"
echo "=========================="
echo ""
echo "Order ID: $ORDER_ID"
echo ""

# Check if payment exists in database
echo "📋 Running database check..."
echo ""

# Use tsx script if available
if command -v tsx &> /dev/null; then
  echo "Using tsx to check payment status..."
  cd "$(dirname "$0")/.."
  tsx scripts/check-payment-by-reference.ts "$ORDER_ID"
else
  echo "⚠️  tsx not found. Please run manually:"
  echo ""
  echo "cd backend"
  echo "tsx scripts/check-payment-by-reference.ts $ORDER_ID"
  echo ""
  echo "Or check database directly with SQL:"
  echo ""
  echo "SELECT"
  echo "  id,"
  echo "  status,"
  echo "  \"providerReference\","
  echo "  \"paidAt\","
  echo "  metadata->>'monicreditTransactionId' as transaction_id,"
  echo "  metadata->>'webhookReceivedAt' as webhook_time"
  echo "FROM payments"
  echo "WHERE \"providerReference\" = '$ORDER_ID';"
fi

echo ""
echo "📋 Next Steps:"
echo "  1. Check production backend logs for webhook activity"
echo "  2. Check Monicredit dashboard for transaction status"
echo "  3. If webhook not received, check webhook URL configuration"
echo "  4. If webhook received but payment not found, check payload format"
