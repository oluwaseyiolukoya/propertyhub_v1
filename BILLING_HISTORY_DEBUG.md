# Billing History Debug Guide

## Issue
The Owner Dashboard shows "No subscription payments yet" in the Recent Billing section, even after successful upgrade payments.

## Root Cause Analysis

### 1. Backend Payments API Issue (FIXED)
**Problem**: The `/api/payments` endpoint was incorrectly scoping subscription payments by `properties.ownerId`, but subscription payments don't have a `propertyId` - they're customer-level payments.

**Fix Applied**: Updated `/backend/src/routes/payments.ts` to skip property-based scoping for subscription payments:
- For owners: Subscription payments are now filtered by `customerId` only (no property scoping)
- For managers/tenants: Subscription payments are explicitly excluded (they should only see property-related payments)

### 2. Payment Creation Verification
The subscription upgrade flow creates payment records in `/backend/src/routes/subscription.ts` (lines 196-226):
```typescript
await prisma.payments.create({
  data: {
    id: require('crypto').randomUUID(),
    customerId: customer.id,
    amount: typeof data.amount === 'number' ? data.amount / 100 : 0,
    currency: (data.currency || 'NGN').toUpperCase(),
    status: 'success',
    type: 'subscription',
    paymentMethod: data.channel || 'card',
    provider: 'paystack',
    providerReference: paymentReference,
    paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
    metadata: { planId, billingCycle, authorization: {...} },
    updatedAt: new Date()
  }
});
```

### 3. Frontend Fetching
The Owner Dashboard fetches subscription payments on mount (lines 275-295 in `PropertyOwnerDashboard.tsx`):
```typescript
const res = await apiClient.get<any>('/api/payments', { 
  page: 1, 
  pageSize: 5, 
  type: 'subscription' 
});
```

## Debugging Steps

### Step 1: Check Backend Logs
After refreshing the Owner Dashboard, check the backend console for:
```
[Payments API] Query where clause: { customerId: "...", type: "subscription" }
[Payments API] Found X payments, returning Y items
[Payments API] Subscription payments: [...]
```

### Step 2: Check Frontend Console
Open browser DevTools and look for:
```
[PropertyOwnerDashboard] Fetching subscription payments...
[PropertyOwnerDashboard] Payments API response: {...}
[PropertyOwnerDashboard] Subscription payments received: [...]
```

### Step 3: Verify Database Records
1. Open Prisma Studio: `cd backend && npx prisma studio`
2. Navigate to the `payments` table
3. Filter by:
   - `type = 'subscription'`
   - `customerId = <your-customer-id>`
   - `status = 'success'`

### Step 4: Check API Response Directly
Use curl or browser to test the API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/payments?type=subscription&page=1&pageSize=5"
```

## Expected Behavior

### After Successful Upgrade:
1. ✅ Payment record created in `payments` table with `type: 'subscription'`
2. ✅ Backend API returns the payment when queried with `type=subscription`
3. ✅ Frontend displays the payment in the "Recent Billing" section
4. ✅ Settings → Billing page also shows the payment

### Recent Billing Display:
- Shows last 5 subscription payments
- Each payment shows:
  - Type: "SUBSCRIPTION"
  - Date/Time: When payment was made
  - Amount: Currency + Amount (e.g., "NGN 5000.00")
  - Status: Badge showing "success"

## Common Issues & Solutions

### Issue 1: No payments showing but upgrade was successful
**Possible Causes**:
- Payment record creation failed (check backend logs for errors)
- Customer ID mismatch between user and payment
- Payment created with wrong `type` field

**Solution**:
1. Check backend logs during upgrade for "Payment record created"
2. Verify in Prisma Studio that payment exists with correct `customerId`
3. Ensure payment has `type: 'subscription'`

### Issue 2: "Failed to fetch payments" error
**Possible Causes**:
- Backend not running
- Authentication token expired
- Database connection issue

**Solution**:
1. Verify backend is running: `lsof -i :5000`
2. Check browser console for 401/500 errors
3. Try logging out and back in to refresh token

### Issue 3: Payments show in Prisma Studio but not in UI
**Possible Causes**:
- Frontend caching issue
- API scoping issue (should be fixed now)
- Response transformation issue

**Solution**:
1. Hard refresh browser (Cmd+Shift+R)
2. Check browser console logs for API response
3. Verify API returns correct data structure: `{ items: [...], total: N }`

## Testing Checklist

- [ ] Backend server is running on port 5000
- [ ] Frontend is running and can reach backend
- [ ] User is logged in as an owner
- [ ] Complete a test upgrade payment
- [ ] Check backend console for payment creation log
- [ ] Verify payment in Prisma Studio
- [ ] Hard refresh Owner Dashboard
- [ ] Check "Recent Billing" section shows payment
- [ ] Navigate to Settings → Billing
- [ ] Verify payment also shows in billing history table

## Files Modified

1. `/backend/src/routes/payments.ts` - Fixed subscription payment scoping
2. `/src/components/PropertyOwnerDashboard.tsx` - Added debug logging
3. `/backend/src/routes/subscription.ts` - Payment creation (already working)

## Next Steps

1. **Immediate**: Hard refresh the Owner Dashboard to see debug logs
2. **Verify**: Check if payments are being returned by the API
3. **If still not showing**: Check Prisma Studio to verify payment records exist
4. **If records don't exist**: Complete another test upgrade and watch backend logs

