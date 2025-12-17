-- Compare two payments to understand why one succeeded and one is pending
-- Usage: Run this in psql or Prisma Studio

-- Payment 1: PH-1765993730760-l5gwrm (Successful)
SELECT
  'Payment 1 (Success)' as payment_label,
  id,
  status,
  "providerReference",
  "paidAt",
  "createdAt",
  "updatedAt",
  provider,
  amount,
  currency,
  metadata->>'monicreditTransactionId' as transaction_id,
  metadata->>'monicreditOrderId' as order_id,
  metadata->>'webhookReceivedAt' as webhook_time,
  metadata->>'initializedAt' as initialized_at
FROM payments
WHERE "providerReference" = 'PH-1765993730760-l5gwrm'
   OR metadata->>'monicreditTransactionId' = 'ACX6942EEFCCF028'
   OR metadata->>'monicreditOrderId' = 'PH-1765993730760-l5gwrm'
LIMIT 1;

-- Payment 2: PH-1765994852895-r6cbpt (Pending)
SELECT
  'Payment 2 (Pending)' as payment_label,
  id,
  status,
  "providerReference",
  "paidAt",
  "createdAt",
  "updatedAt",
  provider,
  amount,
  currency,
  metadata->>'monicreditTransactionId' as transaction_id,
  metadata->>'monicreditOrderId' as order_id,
  metadata->>'webhookReceivedAt' as webhook_time,
  metadata->>'initializedAt' as initialized_at
FROM payments
WHERE "providerReference" = 'PH-1765994852895-r6cbpt'
   OR metadata->>'monicreditOrderId' = 'PH-1765994852895-r6cbpt'
LIMIT 1;

-- Check if there are any recent Monicredit webhook logs
-- (This would need to be checked in backend logs, not database)
