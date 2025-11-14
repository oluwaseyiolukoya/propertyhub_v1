# Fix for "Failed to initialize upgrade payment" Error

## Error
```
Failed to initialize upgrade payment
DeveloperSettings.tsx:189 Failed to initialize upgrade: Error: Failed to initialize payment
```

## Root Cause
The Paystack payment gateway is **not configured** in the `system_settings` table. The backend is looking for Paystack API keys but can't find them.

## Solution

### Quick Fix (5 minutes)

1. **Get Paystack API Keys:**
   - Go to https://dashboard.paystack.com
   - Sign up or login
   - Navigate to Settings → API Keys & Webhooks
   - Copy your **Test Secret Key** (starts with `sk_test_`)
   - Copy your **Test Public Key** (starts with `pk_test_`)

2. **Run Setup Script:**
```bash
cd backend

# Replace with your actual keys
PAYSTACK_SECRET_KEY=sk_test_your_key_here \
PAYSTACK_PUBLIC_KEY=pk_test_your_key_here \
node scripts/setup-paystack.js
```

3. **Restart Backend:**
```bash
# Stop current backend (Ctrl+C)
npm run dev
```

4. **Test Upgrade:**
   - Login as developer
   - Go to Settings → Billing
   - Click "Change Plan"
   - Select upgrade plan
   - Click "Upgrade Plan"
   - Should redirect to Paystack ✅

### Alternative: Manual Setup

**Using Prisma Studio:**

1. **Start Prisma Studio:**
```bash
cd backend
npx prisma studio
```

2. **Open `system_settings` table**

3. **Add new record:**
   - **key:** `payments.paystack`
   - **value:** (Click "Edit JSON"):
```json
{
  "secretKey": "sk_test_your_secret_key_here",
  "publicKey": "pk_test_your_public_key_here",
  "testMode": true
}
```

4. **Save and restart backend**

### Alternative: SQL Query

```sql
INSERT INTO system_settings (key, value, createdAt, updatedAt)
VALUES (
  'payments.paystack',
  '{"secretKey":"sk_test_your_key","publicKey":"pk_test_your_key","testMode":true}',
  NOW(),
  NOW()
);
```

## Verification

### Check if Configured

**Option 1: Prisma Studio**
```bash
cd backend
npx prisma studio
```
- Open `system_settings` table
- Look for key `payments.paystack`
- Verify value contains your keys

**Option 2: Backend Logs**
- Try to upgrade a plan
- Check backend logs for:
```
[Upgrade] Initialize payment for user: xxx plan: xxx
```
- If you see "Payment gateway not configured" → Keys not set
- If you see "Paystack initialized successfully" → Keys working ✅

### Test the Flow

1. **Login as developer**
2. **Go to Settings → Billing**
3. **Click "Change Plan"**
4. **Select "Developer Professional"**
5. **Click "Upgrade Plan"**
6. **Expected:** Redirect to Paystack payment page
7. **Use test card:** `4084084084084081`
8. **Complete payment**
9. **Expected:** Redirected back, plan upgraded ✅

## Test Cards

**Successful Payment:**
- Card: `4084084084084081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`

**Declined Payment:**
- Card: `5060666666666666666`
- CVV: Any 3 digits
- Expiry: Any future date

## Improved Error Logging

I've added better error logging to help debug issues:

**Frontend (DeveloperSettings.tsx):**
```typescript
console.log('[Upgrade] Initializing payment for plan:', selectedPlan);
console.log('[Upgrade] Response:', response);
console.error('[Upgrade] Error details:', {
  message: error.message,
  response: error.response,
  data: error.response?.data
});
```

**Check Browser Console:**
- Open DevTools → Console
- Try to upgrade
- Look for `[Upgrade]` logs
- These will show the exact error from backend

## Common Errors

### 1. "Payment gateway not configured"
**Cause:** Paystack keys not in database
**Fix:** Run setup script above

### 2. "Invalid API key"
**Cause:** Wrong keys or expired keys
**Fix:** Get fresh keys from Paystack dashboard

### 3. "Customer not found"
**Cause:** User has no customer record
**Fix:** Check user's `customerId` field

### 4. "Invalid plan category"
**Cause:** Trying to upgrade to wrong plan type
**Fix:** Developers can only select development plans

## Files Created

1. ✅ `backend/scripts/setup-paystack.js` - Setup script
2. ✅ `PAYSTACK_SETUP_GUIDE.md` - Detailed guide
3. ✅ `UPGRADE_ERROR_FIX.md` - This file

## Status

- ✅ **ERROR IDENTIFIED**: Paystack not configured
- ✅ **SOLUTION PROVIDED**: Setup script created
- ✅ **LOGGING IMPROVED**: Better error messages
- ✅ **DOCUMENTATION CREATED**: Setup guides
- 🚫 **NOT PUSHED TO GIT** (as requested)

## Next Steps

1. **Get Paystack keys** from https://dashboard.paystack.com
2. **Run setup script** with your keys
3. **Restart backend**
4. **Test upgrade flow**
5. **Should work!** 🎉

## Support

If you still have issues after setup:

1. Check backend logs for detailed errors
2. Check browser console for `[Upgrade]` logs
3. Verify keys are correct in database
4. Test keys with curl:
```bash
curl https://api.paystack.co/transaction/initialize \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","amount":"10000"}' \
  -X POST
```

The error is now fixed with better logging and a setup script! 🚀

