# Admin Monicredit Integration for Subscription Payments

## Overview

This document describes the implementation of Monicredit payment gateway integration for **platform-level subscription payments** (admin/tenant subscriptions). This is separate from the existing owner-level Monicredit integration used for rent payments.

## Architecture

### Separation of Concerns

1. **Owner Monicredit** (Rent Payments):
   - Stored in: `payment_settings` table with `customerId` (per-owner)
   - Used for: Tenant rent payments to property owners
   - Endpoint: `/api/settings/payment-gateway`
   - Scope: Customer-level (each owner has their own keys)

2. **Admin Monicredit** (Subscription Payments):
   - Stored in: `system_settings` table with key `payments.monicredit` (platform-wide)
   - Used for: Platform subscription payments (owners paying for plans)
   - Endpoint: `/api/system/admin/payment-gateway`
   - Scope: Platform-level (single configuration for all subscriptions)

### Key Design Decisions

- **No Breaking Changes**: Owner Monicredit integration remains completely unaffected
- **Platform-Level Config**: Admin Monicredit is stored in `system_settings`, not `payment_settings`
- **Provider Selection**: Subscription initialization supports both Paystack and Monicredit
- **Fallback Chain**: Paystack → Monicredit (if Paystack not configured)

## Implementation Details

### Backend Changes

#### 1. Admin Payment Gateway API Routes (`backend/src/routes/system.ts`)

**GET `/api/system/admin/payment-gateway`**
- Returns platform-level Monicredit configuration
- Admin-only access
- Returns configuration from `system_settings` table

**POST `/api/system/admin/payment-gateway`**
- Saves/updates platform-level Monicredit configuration
- Admin-only access
- Stores in `system_settings` with key `payments.monicredit`
- Auto-generates `verifyToken` for webhook verification

#### 2. Subscription Initialization (`backend/src/routes/subscriptions.ts`)

**Updated `/api/subscriptions/upgrade/initialize`**
- Now supports both Paystack and Monicredit
- Provider selection logic:
  1. Check requested provider (from `req.body.provider`)
  2. Check system-level Paystack config (`payments.paystack`)
  3. Check system-level Monicredit config (`payments.monicredit`)
  4. Default to Paystack if available, else Monicredit
- Monicredit initialization uses same logic as rent payments but adapted for subscriptions

**Key Differences from Rent Payments:**
- Uses platform-level config (not owner-level)
- Different metadata (subscription vs rent)
- Different callback URL (`/?payment_callback=upgrade&tab=billing`)

### Frontend Changes

#### 1. API Client Functions (`src/lib/api/system.ts`)

Added:
- `getAdminPaymentGateway(provider)`: Fetch platform payment gateway config
- `saveAdminPaymentGateway(config)`: Save platform payment gateway config
- `AdminPaymentGatewayConfig` interface

#### 2. UI Component (`src/components/PlatformSettings.tsx`)

**New Component: `PaymentGatewayConfigCard`**
- Location: Platform Settings → Integrations Tab
- Features:
  - Enable/Disable Monicredit
  - Test Mode toggle
  - Public Key input
  - Private Key input (with show/hide)
  - Merchant ID input (optional)
  - Webhook Verify Token display (auto-generated, read-only)
  - Save/Reset buttons

## Database Schema

### system_settings Table

```sql
{
  key: "payments.monicredit",
  value: {
    isEnabled: boolean,
    testMode: boolean,
    publicKey: string,
    privateKey: string,
    merchantId: string | null,
    verifyToken: string, // Auto-generated
    metadata: object
  },
  category: "payments",
  description: "Platform-level monicredit payment gateway configuration for subscription payments"
}
```

## Usage

### For Admins

1. **Configure Monicredit:**
   - Navigate to: Admin Dashboard → Platform Settings → Integrations Tab
   - Find "Payment Gateway Configuration" card
   - Enter Monicredit credentials:
     - Public Key (required)
     - Private Key (required)
     - Merchant ID (optional)
   - Toggle "Enable Monicredit" ON
   - Click "Save Configuration"

2. **Webhook Setup:**
   - Copy the "Webhook Verify Token" displayed in the UI
   - In Monicredit dashboard, set webhook URL to:
     ```
     https://api.app.contrezz.com/api/monicredit/webhook/payment
     ```
   - Use the verify token for webhook authentication

### For Subscription Payments

When a customer upgrades/changes their subscription plan:

1. Frontend calls `/api/subscriptions/upgrade/initialize` with `planId`
2. Backend checks available payment providers:
   - System-level Paystack config
   - System-level Monicredit config
3. If Monicredit is enabled and configured, it's used (or Paystack if both available)
4. Payment is initialized with Monicredit
5. User is redirected to Monicredit payment page
6. After payment, user is redirected back to app
7. Payment is verified via webhook or redirect callback

## Testing

### Verify Owner Integration Unaffected

1. **Owner Settings Still Work:**
   - Navigate to: Owner Dashboard → Settings → Payment Gateway
   - Owner can still configure their own Monicredit keys
   - These are stored in `payment_settings` table (separate from admin config)

2. **Rent Payments Still Work:**
   - Tenant makes rent payment
   - Uses owner's Monicredit config (from `payment_settings`)
   - Not affected by platform-level config

### Test Admin Integration

1. **Configure Platform Monicredit:**
   - Admin Dashboard → Platform Settings → Integrations
   - Configure and save Monicredit credentials

2. **Test Subscription Payment:**
   - As an owner, upgrade subscription plan
   - Should use platform Monicredit config
   - Payment should initialize and redirect correctly

## Environment Variables

No new environment variables required. The implementation uses:
- `MONICREDIT_BASE_URL` (optional, defaults to demo URL)
- `MONICREDIT_TRANSACTION_ENDPOINT` (optional)
- `MONICREDIT_REVENUE_HEAD_CODE` (optional)
- `FRONTEND_URL` (for callback URLs)

## Security Considerations

1. **Admin-Only Access**: Payment gateway configuration endpoints require `adminOnly` middleware
2. **Secret Key Protection**: Private keys are not returned in GET requests unless enabled
3. **Webhook Verification**: Auto-generated `verifyToken` for webhook security
4. **Separate Storage**: Platform config stored separately from owner configs

## Future Enhancements

1. **Paystack Platform Config**: Add Paystack configuration UI (currently uses env vars)
2. **Provider Priority**: Allow admins to set provider priority/order
3. **Multiple Providers**: Support multiple payment providers simultaneously
4. **Analytics**: Track subscription payment success rates by provider

## Related Files

- `backend/src/routes/system.ts` - Admin payment gateway API routes
- `backend/src/routes/subscriptions.ts` - Subscription initialization (updated)
- `src/lib/api/system.ts` - Frontend API client functions
- `src/components/PlatformSettings.tsx` - UI component
- `backend/src/routes/payments.ts` - Owner payment initialization (unchanged)
- `backend/src/routes/settings.ts` - Owner payment gateway settings (unchanged)

## Migration Notes

- **No Database Migration Required**: Uses existing `system_settings` table
- **No Breaking Changes**: All existing functionality remains intact
- **Backward Compatible**: Subscription payments still work with Paystack (env vars or system config)

---

**Last Updated:** December 17, 2025  
**Status:** ✅ Implemented  
**Author:** AI Assistant


