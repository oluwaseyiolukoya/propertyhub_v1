-- SQL Query to Check Monicredit Payment Status
-- Run this in your PostgreSQL database to verify payment status

-- Check payment by order_id (our internal reference)
SELECT
  id,
  status,
  "providerReference",
  "paidAt",
  "updatedAt",
  "createdAt",
  metadata->>'monicreditTransactionId' as transaction_id,
  metadata->>'monicreditOrderId' as order_id,
  metadata->>'webhookReceivedAt' as webhook_time,
  "customerId",
  "tenantId",
  amount,
  currency
FROM payments
WHERE "providerReference" = 'PH-1765989259432-nzgcko';

-- Check payment by transaction_id (Monicredit's ID)
SELECT
  id,
  status,
  "providerReference",
  "paidAt",
  "updatedAt",
  "createdAt",
  metadata->>'monicreditTransactionId' as transaction_id,
  metadata->>'monicreditOrderId' as order_id,
  metadata->>'webhookReceivedAt' as webhook_time,
  "customerId",
  "tenantId",
  amount,
  currency
FROM payments
WHERE metadata->>'monicreditTransactionId' = 'ACX6942DB8C6794A';

-- Check all recent Monicredit payments
SELECT
  id,
  status,
  "providerReference",
  "paidAt",
  "updatedAt",
  metadata->>'monicreditTransactionId' as transaction_id,
  "customerId"
FROM payments
WHERE provider = 'monicredit'
ORDER BY "createdAt" DESC
LIMIT 10;
