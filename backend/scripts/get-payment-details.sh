#!/bin/bash

# Get payment details including customer ID for webhook testing
# Usage: bash scripts/get-payment-details.sh [order_id]

ORDER_ID="${1:-PH-1765994852895-r6cbpt}"

echo "🔍 Getting Payment Details"
echo "==========================="
echo ""
echo "Order ID: $ORDER_ID"
echo ""

# Check if tsx is available
if command -v tsx &> /dev/null; then
  cd "$(dirname "$0")/.."
  echo "Querying database for payment details..."
  echo ""

  # Use Node.js to query database
  node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  (async () => {
    try {
      const payment = await prisma.payments.findFirst({
        where: {
          providerReference: '$ORDER_ID',
          provider: 'monicredit'
        },
        select: {
          id: true,
          status: true,
          providerReference: true,
          customerId: true,
          tenantId: true,
          amount: true,
          currency: true,
          metadata: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (payment) {
        const meta = payment.metadata || {};
        console.log('✅ Payment Found:');
        console.log('  ID:', payment.id);
        console.log('  Status:', payment.status);
        console.log('  Provider Reference:', payment.providerReference);
        console.log('  Customer ID:', payment.customerId);
        console.log('  Tenant ID:', payment.tenantId);
        console.log('  Amount:', payment.amount, payment.currency);
        console.log('  Created At:', payment.createdAt);
        console.log('  Updated At:', payment.updatedAt);
        console.log('');
        console.log('📋 Metadata:');
        console.log('  Transaction ID:', meta.monicreditTransactionId || 'N/A');
        console.log('  Order ID:', meta.monicreditOrderId || 'N/A');
        console.log('  Webhook Received At:', meta.webhookReceivedAt || 'N/A');
        console.log('  Initialized At:', meta.initializedAt || 'N/A');
        console.log('');
        console.log('🔧 To test webhook, use:');
        console.log('  bash scripts/test-webhook-for-payment.sh \\');
        console.log('    $ORDER_ID \\');
        console.log('    TRANSACTION_ID_FROM_MONICREDIT_DASHBOARD \\');
        console.log('    ' + payment.customerId);
      } else {
        console.log('❌ Payment not found with order_id:', '$ORDER_ID');
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      await prisma.\$disconnect();
    }
  })();
  "
else
  echo "⚠️  tsx not found. Please install it or use Prisma Studio:"
  echo ""
  echo "  npm install -g tsx"
  echo ""
  echo "Or query database directly:"
  echo ""
  echo "SELECT"
  echo "  id,"
  echo "  status,"
  echo "  \"providerReference\","
  echo "  \"customerId\","
  echo "  \"tenantId\","
  echo "  metadata->>'monicreditTransactionId' as transaction_id"
  echo "FROM payments"
  echo "WHERE \"providerReference\" = '$ORDER_ID';"
fi
