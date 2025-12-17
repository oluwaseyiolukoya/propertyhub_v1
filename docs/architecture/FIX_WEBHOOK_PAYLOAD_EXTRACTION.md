# Fix Webhook Payload Extraction - Missing transactionId and orderId

## Problem

Webhook is being received but payment cannot be found because:

- `transactionId: undefined`
- `orderId: undefined`

This means the webhook payload from Monicredit doesn't have these fields in the expected format.

## Root Cause

Monicredit may send webhook payloads in different formats:

- Top-level fields: `{ transaction_id: "...", order_id: "..." }`
- Nested in `data`: `{ data: { transaction_id: "...", order_id: "..." } }`
- Nested in `transaction`: `{ transaction: { id: "...", order_id: "..." } }`
- Nested in `result`: `{ result: { transaction_id: "...", order_id: "..." } }`

The current code only checks top-level fields, missing nested structures.

## Solution: Enhanced Field Extraction

### 1. Added More Field Name Variations

**Before:**

```typescript
const transactionId =
  parsed?.transaction_id ||
  parsed?.transid ||
  parsed?.transId ||
  parsed?.transactionId ||
  parsed?.id;
```

**After:**

```typescript
const transactionId =
  parsed?.transaction_id ||
  parsed?.transid ||
  parsed?.transId ||
  parsed?.transactionId ||
  parsed?.id ||
  parsed?.data?.transaction_id ||
  parsed?.data?.transId ||
  parsed?.data?.transactionId ||
  parsed?.transaction?.id ||
  parsed?.transaction?.transaction_id ||
  parsed?.result?.transaction_id ||
  parsed?.result?.transId;
```

### 2. Enhanced Logging

Added comprehensive logging to see:

- Full payload structure
- Nested object keys
- Critical errors when both fields are undefined

**New Logging:**

```typescript
console.log("[Monicredit Payment Webhook] Extracted data:", {
  transactionId,
  orderId,
  status,
  normalizedStatus,
  amount,
  customerId,
  fullPayload: parsed,
  allKeys: Object.keys(parsed),
  nestedKeys: parsed?.data ? Object.keys(parsed.data) : null,
  transactionKeys: parsed?.transaction ? Object.keys(parsed.transaction) : null,
});

// If both are undefined, log full payload
if (!transactionId && !orderId) {
  console.error(
    "[Monicredit Payment Webhook] CRITICAL: Both transactionId and orderId are undefined!",
    {
      payloadStructure: JSON.stringify(parsed, null, 2),
      topLevelKeys: Object.keys(parsed || {}),
    }
  );
}
```

## Testing

### Step 1: Restart Backend

```bash
cd backend
npm run dev
```

### Step 2: Make a Test Payment

1. Make a payment through Monicredit
2. Wait for webhook to be received

### Step 3: Check Backend Logs

**Look for:**

```
[Monicredit Payment Webhook] Extracted data: { transactionId, orderId, ... }
```

**If both are still undefined:**

```
[Monicredit Payment Webhook] CRITICAL: Both transactionId and orderId are undefined!
```

This will show the full payload structure, allowing us to identify the correct field names.

### Step 4: Update Field Extraction

If the critical error shows a different payload structure, update the field extraction code to match Monicredit's actual format.

## Common Payload Formats

### Format 1: Top-Level

```json
{
  "transaction_id": "ACX123",
  "order_id": "PH-123",
  "status": "APPROVED"
}
```

### Format 2: Nested in data

```json
{
  "data": {
    "transaction_id": "ACX123",
    "order_id": "PH-123",
    "status": "APPROVED"
  }
}
```

### Format 3: Nested in transaction

```json
{
  "transaction": {
    "id": "ACX123",
    "order_id": "PH-123",
    "status": "APPROVED"
  }
}
```

### Format 4: Nested in result

```json
{
  "result": {
    "transaction_id": "ACX123",
    "order_id": "PH-123",
    "status": "APPROVED"
  }
}
```

## Next Steps

1. ✅ Enhanced field extraction to check nested objects
2. ✅ Added comprehensive logging
3. ⏳ Restart backend and test with new payment
4. ⏳ Check logs for actual payload structure
5. ⏳ Update field extraction if needed based on actual payload

---

**Last Updated:** December 17, 2025  
**Status:** Enhanced field extraction and logging  
**Related:** `DEBUG_PENDING_PAYMENT.md`, `WEBHOOK_PROVIDER_REFERENCE_FIX.md`
