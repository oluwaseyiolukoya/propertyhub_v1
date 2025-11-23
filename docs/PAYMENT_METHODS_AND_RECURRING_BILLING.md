# Payment Methods & Automatic Recurring Billing

## Overview

This document describes the implementation of payment method management and automatic recurring billing for developers. The system allows developers to add, manage, and set default payment cards for automatic subscription renewals using Paystack.

## Features

### 1. Payment Method Management

Developers can:
- **Add payment cards** using Paystack's secure tokenization
- **View all saved cards** with masked details (last 4 digits)
- **Set a default card** for automatic billing
- **Remove cards** they no longer want to use
- See card details: brand, expiration, bank, account name

### 2. Automatic Recurring Billing

The system automatically:
- **Charges the default payment method** when subscriptions are due for renewal
- **Processes billing daily** at 01:00 AM UTC via cron job
- **Updates subscription dates** after successful payment
- **Records all transactions** in the payments table
- **Handles failed payments** gracefully with error logging

## Architecture

### Backend Components

#### 1. Payment Methods API (`backend/src/routes/payment-methods.ts`)

**Endpoints:**

- `GET /api/payment-methods`
  - Lists all active payment methods for the authenticated customer
  - Returns: Array of payment methods with card details (masked)
  - Auth: Required (customer only)

- `POST /api/payment-methods/initialize-authorization`
  - Initializes a Paystack transaction for card authorization
  - Amount: ₦100 (minimum for authorization)
  - Returns: Authorization URL, access code, and reference
  - Auth: Required (customer only)

- `POST /api/payment-methods/add`
  - Adds a new payment method using Paystack reference
  - Verifies the transaction with Paystack
  - Extracts and stores authorization code
  - Can set as default automatically
  - Auth: Required (customer only)

- `POST /api/payment-methods/:id/set-default`
  - Sets a payment method as the default
  - Unsets all other defaults automatically
  - Auth: Required (customer only)

- `DELETE /api/payment-methods/:id`
  - Soft deletes a payment method (sets `isActive = false`)
  - Auto-promotes another card to default if needed
  - Auth: Required (customer only)

#### 2. Recurring Billing Service (`backend/src/services/recurring-billing.service.ts`)

**Functions:**

- `processRecurringBilling(customerId: string)`
  - Processes billing for a single customer
  - Validates customer status, plan, and payment method
  - Charges the default payment method via Paystack
  - Records payment transaction
  - Updates subscription start date for next cycle
  - Returns: Success/failure result with details

- `processAllRecurringBilling()`
  - Finds all active customers due for renewal (within 24 hours)
  - Processes billing for each customer
  - Adds 1-second delay between charges to avoid rate limiting
  - Returns: Array of results for all processed customers

**Billing Logic:**
- Checks if `subscriptionStartDate + billingCycle` is within the next 24 hours
- Calculates amount based on `billingCycle` (monthly or annual)
- Uses Paystack's `/transaction/charge_authorization` endpoint
- Converts amount to kobo (multiply by 100) for Paystack

#### 3. Admin Billing API (`backend/src/routes/admin-billing.ts`)

**Endpoints:**

- `POST /api/admin/billing/process-recurring`
  - Manually triggers recurring billing for all customers
  - Returns: Summary of successful/failed charges
  - Auth: Required (admin only)

- `POST /api/admin/billing/process-customer/:customerId`
  - Manually triggers recurring billing for a specific customer
  - Returns: Result for that customer
  - Auth: Required (admin only)

#### 4. Cron Job (`backend/src/lib/cron-jobs.ts`)

**Schedule:**
- **Daily at 01:00 AM UTC**
- Calls `processAllRecurringBilling()`
- Logs success/failure counts

### Frontend Components

#### 1. Payment Methods API Client (`src/lib/api/payment-methods.ts`)

**Functions:**
- `getPaymentMethods()` - Fetch all payment methods
- `initializeCardAuthorization()` - Start card authorization flow
- `addPaymentMethod(reference, setAsDefault)` - Add card after authorization
- `setDefaultPaymentMethod(paymentMethodId)` - Set default card
- `removePaymentMethod(paymentMethodId)` - Remove a card

#### 2. Payment Methods Manager Component (`src/components/PaymentMethodsManager.tsx`)

**Features:**
- Beautiful card-based UI showing all payment methods
- Visual indicators for default card (blue border, badge)
- "Add Card" button to initiate Paystack authorization
- Paystack popup integration for secure card entry
- Callback handling after successful authorization
- Set default and remove actions for each card
- Empty state with call-to-action
- Security note about PCI-DSS compliance

**User Flow:**
1. Click "Add Card"
2. Paystack popup opens with ₦100 authorization charge
3. User enters card details securely
4. On success, page reloads with card added
5. Card is verified and saved with authorization code
6. Card appears in the list, marked as default (if first card)

#### 3. Developer Settings Integration (`src/modules/developer-dashboard/components/DeveloperSettings.tsx`)

**Location:**
- Settings → Billing tab
- New "Payment Methods" card below subscription plan
- Full `PaymentMethodsManager` component embedded

## Database Schema

### `payment_methods` Table

```sql
CREATE TABLE payment_methods (
  id                TEXT PRIMARY KEY,
  tenantId          TEXT NOT NULL,
  customerId        TEXT NOT NULL,
  type              TEXT DEFAULT 'card',
  provider          TEXT DEFAULT 'paystack',
  authorizationCode TEXT,           -- Paystack authorization code for recurring charges
  cardBrand         TEXT,           -- Visa, Mastercard, Verve, etc.
  cardLast4         TEXT,           -- Last 4 digits
  cardExpMonth      TEXT,           -- MM
  cardExpYear       TEXT,           -- YYYY
  cardBin           TEXT,           -- First 6 digits
  cardType          TEXT,           -- debit/credit
  bank              TEXT,           -- Issuing bank
  accountName       TEXT,           -- Cardholder name
  isDefault         BOOLEAN DEFAULT FALSE,
  isActive          BOOLEAN DEFAULT TRUE,
  metadata          JSONB,
  createdAt         TIMESTAMP DEFAULT NOW(),
  updatedAt         TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (tenantId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_methods_customer ON payment_methods(customerId);
CREATE INDEX idx_payment_methods_default ON payment_methods(isDefault);
CREATE INDEX idx_payment_methods_active ON payment_methods(isActive);
```

## Security Considerations

1. **PCI-DSS Compliance**
   - Card details never touch our servers
   - Paystack handles all card data
   - We only store authorization codes and masked details

2. **Authorization Codes**
   - Stored securely in the database
   - Used only for recurring charges
   - Cannot be used to retrieve full card details

3. **Authentication**
   - All endpoints require authentication
   - Customers can only access their own payment methods
   - Admin endpoints require admin role

4. **Soft Deletes**
   - Payment methods are soft-deleted (isActive = false)
   - Maintains audit trail
   - Prevents accidental data loss

## Testing

### Manual Testing Steps

1. **Add a Payment Method**
   ```bash
   # As a developer user:
   1. Navigate to Settings → Billing
   2. Scroll to "Payment Methods" section
   3. Click "Add Card"
   4. Enter test card: 5060666666666666666 (Verve)
   5. CVV: 123, Expiry: 12/25, PIN: 1234
   6. Verify card appears in the list
   ```

2. **Set Default Payment Method**
   ```bash
   1. Add multiple cards
   2. Click "Set as Default" on a non-default card
   3. Verify the blue border moves to the new default
   4. Verify "Default" badge appears on the new card
   ```

3. **Remove a Payment Method**
   ```bash
   1. Click "Remove" on a card
   2. Confirm the deletion
   3. Verify card is removed from the list
   4. If it was default, verify another card becomes default
   ```

4. **Test Recurring Billing (Admin)**
   ```bash
   # As an admin:
   curl -X POST http://localhost:5000/api/admin/billing/process-customer/{customerId} \
     -H "Authorization: Bearer {admin_token}"
   
   # Check response for success/failure
   # Verify payment record in database
   # Verify subscriptionStartDate updated
   ```

5. **Test Cron Job**
   ```bash
   # Wait for 01:00 AM UTC or manually trigger in code
   # Check logs for:
   # - "💳 Recurring billing processor job triggered"
   # - Success/failure counts
   # - Individual customer processing logs
   ```

### Paystack Test Cards

| Card Number          | Brand      | CVV | PIN  | Description          |
|---------------------|------------|-----|------|---------------------|
| 5060666666666666666 | Verve      | 123 | 1234 | Successful charge   |
| 4084084084084081    | Visa       | 408 | 0000 | Successful charge   |
| 5531886652142950    | Mastercard | 564 | 3310 | Successful charge   |
| 507850785078507812  | Verve      | 884 | 1111 | Insufficient funds  |

## Environment Variables

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here

# Frontend URL (for callbacks)
FRONTEND_URL=http://localhost:5173
```

## Error Handling

### Backend Errors

1. **No Default Payment Method**
   - Status: 400
   - Message: "No default payment method"
   - Action: Customer needs to add a card

2. **Charge Failed**
   - Status: 400
   - Message: Paystack error message
   - Action: Logged in payments table with status 'failed'

3. **Invalid Authorization Code**
   - Status: 400
   - Message: "No authorization code found in transaction"
   - Action: Customer needs to re-add the card

4. **Customer Not Active**
   - Status: 400
   - Message: "Customer is not active"
   - Action: No charge attempted

### Frontend Errors

1. **Card Already Added**
   - Toast: "This payment method is already added"
   - Action: User can set it as default instead

2. **Authorization Failed**
   - Toast: "Failed to add payment method"
   - Action: User can try again with a different card

3. **Network Error**
   - Toast: "Failed to load payment methods"
   - Action: Page can be refreshed

## Future Enhancements

1. **Email Notifications**
   - Send receipt after successful recurring charge
   - Alert customer when payment fails
   - Remind customer before next billing date

2. **Payment Retry Logic**
   - Retry failed payments after 24 hours
   - Retry up to 3 times before suspending account
   - Exponential backoff between retries

3. **Payment History**
   - Show all recurring charges in billing history
   - Filter by payment method
   - Download receipts

4. **Multiple Payment Methods**
   - Allow backup payment methods
   - Auto-fallback if primary fails
   - Smart routing based on success rates

5. **Webhooks**
   - Listen for Paystack webhooks
   - Handle charge.success, charge.failed events
   - Update payment status in real-time

## Troubleshooting

### Issue: Card authorization fails with "Invalid card"

**Solution:**
- Verify using a valid test card from Paystack
- Check that CVV and expiry are correct
- Ensure card is not expired

### Issue: Recurring billing not charging customers

**Solution:**
1. Check cron job is running: `ps aux | grep node`
2. Verify subscriptionStartDate is set for customers
3. Check that customers have default payment methods
4. Review logs for errors: `tail -f backend/logs/app.log`

### Issue: "No authorization code found" error

**Solution:**
- The transaction may not have completed successfully
- Ask customer to re-add the card
- Verify Paystack transaction status in Paystack dashboard

### Issue: Payment method not appearing after adding

**Solution:**
1. Check browser console for errors
2. Verify callback URL is correct
3. Check that reference was passed correctly
4. Verify transaction was successful in Paystack dashboard

## API Reference

### Payment Methods Endpoints

#### GET /api/payment-methods

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_123",
      "type": "card",
      "provider": "paystack",
      "cardBrand": "Visa",
      "cardLast4": "4081",
      "cardExpMonth": "12",
      "cardExpYear": "2025",
      "bank": "GTBank",
      "accountName": "John Doe",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2025-11-23T10:00:00Z",
      "updatedAt": "2025-11-23T10:00:00Z"
    }
  ]
}
```

#### POST /api/payment-methods/initialize-authorization

**Response:**
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "abc123",
    "reference": "ref_123456"
  }
}
```

#### POST /api/payment-methods/add

**Request:**
```json
{
  "reference": "ref_123456",
  "setAsDefault": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method added successfully",
  "data": {
    "id": "pm_123",
    "type": "card",
    "provider": "paystack",
    "cardBrand": "Visa",
    "cardLast4": "4081",
    "isDefault": true,
    "createdAt": "2025-11-23T10:00:00Z"
  }
}
```

## Conclusion

The payment methods and recurring billing system provides a seamless, secure, and automated way for developers to manage their subscription payments. By leveraging Paystack's robust payment infrastructure and implementing comprehensive error handling, the system ensures reliable recurring billing while maintaining PCI-DSS compliance.

---

**Last Updated:** November 23, 2025  
**Version:** 1.0.0  
**Author:** Development Team

