# Fix: Monicredit Subscription Payment Initialization

## Problem

When Property Owner initiates a subscription payment with Monicredit, the initialization fails with:

- `400 Bad Request` from `/api/subscriptions/upgrade/initialize`
- Error: "Failed to initialize Monicredit payment"

## Root Cause

The Monicredit initialization code for subscriptions had:

1. **Insufficient error logging** - Didn't log the actual Monicredit API response
2. **Limited response parsing** - Only checked `monicreditData.data.authorization_url` but Monicredit might return the URL in different fields
3. **No detailed error messages** - Generic error messages didn't help diagnose the issue

## Solution

### Enhanced Error Handling

1. **Better Logging**:

   - Log all endpoints being tried
   - Log full Monicredit API response on failure
   - Log response status and statusText

2. **Flexible Response Parsing**:

   - Check multiple possible fields for `authorization_url`:
     - `monicreditData.data.authorization_url`
     - `monicreditData.authorization_url`
     - `monicreditData.data.authorizationUrl`
     - `monicreditData.authorizationUrl`
     - `monicreditData.data.redirect_url`
     - `monicreditData.redirect_url`

3. **Detailed Error Messages**:
   - Include Monicredit API error messages
   - Include response status codes
   - Include details about which endpoint was used

### Code Changes

**File**: `backend/src/routes/subscriptions.ts`

- Added comprehensive logging for Monicredit endpoint attempts
- Enhanced response parsing to check multiple possible fields
- Improved error messages with actual Monicredit API responses
- Added raw response logging for debugging

## Testing

1. **Enable Monicredit in Platform Settings**:

   - Go to Platform Settings → Integrations
   - Click Settings on Monicredit row
   - Enable Monicredit and enter credentials
   - Save configuration

2. **Initiate Subscription Payment**:

   - As Property Owner, upgrade subscription plan
   - Should use Monicredit (if enabled and Paystack disabled)
   - Check backend logs for detailed Monicredit API responses

3. **Check Backend Logs**:
   - Look for `[Upgrade Monicredit]` log entries
   - Check which endpoint was used
   - Check Monicredit API response structure
   - Verify `authorization_url` is extracted correctly

## Common Issues

### Issue 1: All Endpoints Return 404/400

**Symptom**: "All Monicredit transaction endpoints failed"

**Possible Causes**:

- Incorrect Monicredit base URL
- Monicredit API endpoint changed
- Network/firewall blocking Monicredit API

**Solution**:

- Verify `MONICREDIT_BASE_URL` environment variable
- Check Monicredit API documentation for correct endpoint
- Test Monicredit API connectivity

### Issue 2: Authorization URL Not Found

**Symptom**: "No authorization URL received from payment gateway"

**Possible Causes**:

- Monicredit response structure is different than expected
- Monicredit API returned error but status code was 200

**Solution**:

- Check backend logs for full Monicredit response
- Verify Monicredit API response structure
- Update code to handle actual response format

### Issue 3: Authentication Failed

**Symptom**: 401/403 errors from Monicredit API

**Possible Causes**:

- Incorrect public key or private key
- Keys not properly configured in Platform Settings

**Solution**:

- Verify Monicredit credentials in Platform Settings
- Check that keys are saved correctly
- Ensure keys match Monicredit dashboard

## Debugging Steps

1. **Check Backend Logs**:

   ```bash
   # Look for Monicredit initialization logs
   grep -i "monicredit" backend/logs/*.log
   ```

2. **Verify Configuration**:

   ```sql
   -- Check system_settings for Monicredit config
   SELECT key, value FROM system_settings WHERE key = 'payments.monicredit';
   ```

3. **Test Monicredit API Directly**:
   ```bash
   # Test Monicredit API endpoint
   curl -X POST https://demo.backend.monicredit.com/v1/payment/transactions/init-transaction \
     -H "Content-Type: application/json" \
     -H "Authorization: Basic $(echo -n 'PUBLIC_KEY:PRIVATE_KEY' | base64)" \
     -d '{"order_id":"TEST123","public_key":"PUBLIC_KEY",...}'
   ```

## Related Files

- `backend/src/routes/subscriptions.ts` - Subscription initialization (updated)
- `backend/src/routes/payments.ts` - Rent payment initialization (reference)
- `src/components/PlatformSettings.tsx` - Monicredit configuration UI

---

**Last Updated:** December 19, 2025  
**Status:** Enhanced error handling and logging  
**Next Steps:** Test with actual Monicredit API to verify response structure

