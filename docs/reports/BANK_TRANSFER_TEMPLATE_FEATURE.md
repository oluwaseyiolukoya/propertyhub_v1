# Bank Transfer Template Feature - Complete

## Overview
This feature allows property owners to set up custom bank transfer instructions that will be automatically displayed to tenants when they select "Bank Transfer" as their payment method. This eliminates the need for manual communication of bank details and ensures consistent, accurate information is provided to all tenants.

## Features Implemented

### 1. **Database Schema Update**
Added `bankTransferTemplate` field to the `payment_settings` table to store custom bank transfer instructions per customer (owner).

**Schema Change**:
```prisma
model payment_settings {
  id                    String   @id @default(uuid())
  customerId            String
  provider              String
  publicKey             String?
  secretKey             String?
  testMode              Boolean  @default(false)
  isEnabled             Boolean  @default(false)
  bankTransferTemplate  String?  // Custom message for bank transfer instructions
  metadata              Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  customers  customers @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@unique([customerId, provider])
}
```

### 2. **Backend API Enhancement**
Updated the payment gateway settings endpoints to handle bank transfer templates.

**File**: `backend/src/routes/settings.ts`

**Changes**:
- **GET `/api/settings/payment-gateway`**: Now returns `bankTransferTemplate` field
- **PUT `/api/settings/payment-gateway`**: Now accepts and saves `bankTransferTemplate` field

**Request Example**:
```json
{
  "publicKey": "pk_test_...",
  "secretKey": "sk_test_...",
  "testMode": false,
  "isEnabled": true,
  "bankTransferTemplate": "Bank Name: First Bank of Nigeria\nAccount Name: Metro Properties Ltd\nAccount Number: 1234567890\n\nPlease use your unit number as reference."
}
```

**Response Example**:
```json
{
  "message": "Payment gateway updated",
  "settings": {
    "id": "...",
    "customerId": "...",
    "provider": "paystack",
    "publicKey": "pk_test_...",
    "testMode": false,
    "isEnabled": true,
    "bankTransferTemplate": "Bank Name: First Bank of Nigeria...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 3. **Owner Settings UI**
Added bank transfer template configuration section to the Paystack payment gateway settings dialog.

**File**: `src/components/PropertyOwnerSettings.tsx`

**New UI Elements**:
- **Textarea field** for entering bank transfer instructions
- **Placeholder text** with example format
- **Help text** explaining the purpose
- **Auto-save** with other Paystack settings

**Features**:
- Multi-line textarea (6 rows)
- Supports line breaks and formatting
- Optional field (can be left empty)
- Persists with other payment gateway settings
- Loads existing template on page load

**UI Location**:
```
Owner Dashboard → Settings → Payment Gateway → Configure Paystack → Bank Transfer Instructions
```

### 4. **Tenant Payment Dialog Enhancement**
Updated the tenant payment dialog to fetch and display the custom bank transfer template.

**File**: `src/components/TenantPaymentsPage.tsx`

**Changes**:
- Fetches payment gateway settings on component mount
- Stores `bankTransferTemplate` in component state
- Displays custom template when "Bank Transfer" is selected
- Falls back to generic message if no template is configured

**Display Format**:
```
┌─────────────────────────────────────────┐
│ Bank Transfer Instructions:            │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Bank Name: First Bank of Nigeria    │ │
│ │ Account Name: Metro Properties Ltd  │ │
│ │ Account Number: 1234567890          │ │
│ │                                     │ │
│ │ Please use your unit number as      │ │
│ │ reference.                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ After completing the transfer, contact │
│ your property manager to record the    │
│ transaction.                           │
└─────────────────────────────────────────┘
```

## User Flows

### Flow 1: Owner Sets Up Bank Transfer Template

1. Owner logs in and navigates to Settings
2. Clicks on "Payment Gateway" tab
3. Clicks "Configure" on Paystack gateway
4. Scrolls to "Bank Transfer Instructions" section
5. Enters custom bank details and instructions:
   ```
   Bank Name: First Bank of Nigeria
   Account Name: Metro Properties Ltd
   Account Number: 1234567890
   Sort Code: 123456
   
   Please use your unit number as payment reference.
   For urgent inquiries, call: +234 123 456 7890
   ```
6. Clicks "Save Configuration"
7. Template is saved and will be shown to all tenants

### Flow 2: Tenant Views Bank Transfer Instructions

1. Tenant logs in and navigates to Payments
2. Clicks "Pay Rent" or "Custom Payment"
3. Selects "Bank Transfer" as payment method
4. Enters payment amount
5. Sees custom bank transfer instructions in alert box
6. Copies bank details
7. Makes transfer via their bank
8. Contacts property manager to record payment

### Flow 3: Owner Updates Bank Transfer Template

1. Owner navigates to Settings → Payment Gateway
2. Clicks "Configure" on Paystack
3. Updates the bank transfer template
4. Clicks "Save Configuration"
5. New template is immediately available to tenants
6. No need to restart or refresh

## Technical Implementation

### Database Migration
```bash
cd backend
npx prisma db push --accept-data-loss
```

This adds the `bankTransferTemplate` column to the `payment_settings` table.

### Backend Changes

**File**: `backend/src/routes/settings.ts`

**GET Endpoint Enhancement**:
```typescript
const settings = await prisma.payment_settings.findFirst({
  where: { customerId, provider: 'paystack' }
});

// Returns bankTransferTemplate along with other settings
return res.json({ ...safe, secretConfigured: !!secretKey });
```

**PUT Endpoint Enhancement**:
```typescript
const { publicKey, secretKey, testMode, isEnabled, bankTransferTemplate } = req.body;

const updateData: any = { updatedAt: new Date() };
if (publicKey !== undefined) updateData.publicKey = publicKey;
if (secretKey !== undefined) updateData.secretKey = secretKey;
if (testMode !== undefined) updateData.testMode = !!testMode;
if (isEnabled !== undefined) updateData.isEnabled = !!isEnabled;
if (bankTransferTemplate !== undefined) updateData.bankTransferTemplate = bankTransferTemplate;

// Upsert with bankTransferTemplate
```

### Frontend Changes

**Owner Settings** (`src/components/PropertyOwnerSettings.tsx`):

1. **Load Template**:
```typescript
useEffect(() => {
  (async () => {
    const resp = await getPaymentGatewaySettings();
    if (!resp.error && resp.data) {
      setPaymentGateways(prev => prev.map(g => {
        if (g.id !== 'paystack') return g;
        return {
          ...g,
          bankTransferTemplate: resp.data?.bankTransferTemplate || '',
          // ... other fields
        };
      }));
    }
  })();
}, []);
```

2. **Save Template**:
```typescript
const handleSaveGatewayConfig = async () => {
  if (selectedGateway === 'paystack') {
    const payload: any = {
      ...(gatewayConfig.publicKey ? { publicKey: gatewayConfig.publicKey } : {}),
      ...(gatewayConfig.secretKey ? { secretKey: gatewayConfig.secretKey } : {}),
      testMode: !!gatewayConfig.testMode,
      isEnabled: !!gatewayConfig.enabled,
      bankTransferTemplate: gatewayConfig.bankTransferTemplate || ''
    };
    const resp = await savePaymentGatewaySettings(payload);
    // ... handle response
  }
};
```

3. **UI Component**:
```typescript
<div className="space-y-2">
  <Label htmlFor="bankTransferTemplate">Bank Transfer Instructions (Optional)</Label>
  <Textarea
    id="bankTransferTemplate"
    value={gatewayConfig.bankTransferTemplate || ''}
    onChange={(e) =>
      setGatewayConfig({ ...gatewayConfig, bankTransferTemplate: e.target.value })
    }
    placeholder="Enter custom instructions..."
    rows={6}
  />
  <p className="text-xs text-gray-500">
    This message will be shown to tenants when they select "Bank Transfer" as payment method.
  </p>
</div>
```

**Tenant Payments** (`src/components/TenantPaymentsPage.tsx`):

1. **Fetch Template**:
```typescript
const [bankTransferTemplate, setBankTransferTemplate] = useState<string>('');

React.useEffect(() => {
  // ... other initialization
  
  // Fetch bank transfer template
  (async () => {
    const resp = await getPaymentGatewaySettings();
    if (!resp.error && resp.data?.bankTransferTemplate) {
      setBankTransferTemplate(resp.data.bankTransferTemplate);
    }
  })();
}, []);
```

2. **Display Template**:
```typescript
<Alert>
  {paymentMethod === 'paystack' ? (
    // Paystack message
  ) : paymentMethod === 'bank_transfer' && bankTransferTemplate ? (
    <>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Bank Transfer Instructions:</p>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border">
            {bankTransferTemplate}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            After completing the transfer, contact your property manager to record the transaction.
          </p>
        </div>
      </AlertDescription>
    </>
  ) : (
    // Generic message
  )}
</Alert>
```

## Benefits

### For Property Owners
1. **Consistency**: All tenants receive the same, accurate bank details
2. **Efficiency**: No need to manually send bank details to each tenant
3. **Flexibility**: Can update instructions anytime without code changes
4. **Branding**: Can include company name, contact info, and special instructions
5. **Multi-property Support**: Different owners can have different bank details

### For Tenants
1. **Convenience**: Bank details readily available in payment dialog
2. **Accuracy**: No risk of typos or outdated information
3. **Clarity**: Clear instructions on how to complete the transfer
4. **Reference**: Can copy-paste details directly into banking app

### For Property Managers
1. **Reduced Support**: Fewer inquiries about bank details
2. **Faster Processing**: Tenants can make payments immediately
3. **Better Tracking**: Consistent reference format aids reconciliation

## Example Templates

### Basic Template
```
Bank Name: First Bank of Nigeria
Account Name: Metro Properties Ltd
Account Number: 1234567890

Please use your unit number as reference.
```

### Detailed Template
```
BANK TRANSFER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bank Name: First Bank of Nigeria
Account Name: Metro Properties Limited
Account Number: 1234567890
Sort Code: 123456
Swift Code: FBNINGLA (for international transfers)

IMPORTANT INSTRUCTIONS:
• Use your UNIT NUMBER as payment reference
• Include your NAME in the narration
• Keep your transfer receipt for records

For urgent payment issues:
📞 Call: +234 123 456 7890
📧 Email: payments@metroproperties.com
🕐 Office Hours: Mon-Fri, 9AM-5PM

Thank you for your prompt payment!
```

### Multi-Currency Template
```
NIGERIAN NAIRA (NGN) PAYMENTS:
Bank: First Bank of Nigeria
Account: Metro Properties Ltd
Number: 1234567890

USD PAYMENTS:
Bank: GTBank
Account: Metro Properties Ltd
Number: 0987654321
Swift: GTBINGLA

Please specify currency in transfer narration.
Use format: "UNIT-XXX [Your Name]"
```

## Security Considerations

1. **No Sensitive Data**: Template is stored as plain text (no encryption needed for public bank details)
2. **Owner-Level Access**: Only owners can set/update templates
3. **Tenant Read-Only**: Tenants can only view, not modify
4. **No PII**: Template should not contain personal identifiable information
5. **Audit Trail**: All changes are timestamped in `updatedAt` field

## Testing Checklist

- [x] Database schema updated with `bankTransferTemplate` field
- [x] Backend GET endpoint returns template
- [x] Backend PUT endpoint saves template
- [x] Owner can configure template in settings
- [x] Template persists across sessions
- [x] Tenant payment dialog fetches template
- [x] Template displays correctly with line breaks
- [x] Falls back to generic message if no template
- [x] No linter errors
- [x] Backend server restarted successfully

## Future Enhancements

1. **Template Variables**: Support placeholders like `{{TENANT_NAME}}`, `{{UNIT_NUMBER}}`, `{{AMOUNT}}`
2. **Multiple Templates**: Different templates for different properties
3. **Rich Text Editor**: WYSIWYG editor for formatting
4. **Template Preview**: Live preview before saving
5. **Template Library**: Pre-built templates for common scenarios
6. **Multi-Language Support**: Templates in different languages
7. **QR Code**: Generate QR code for mobile banking apps
8. **Copy Button**: One-click copy of bank details
9. **Template History**: Track changes to templates over time
10. **Template Analytics**: Track how often templates are viewed

## Files Modified

### Backend
- `backend/prisma/schema.prisma` - Added `bankTransferTemplate` field
- `backend/src/routes/settings.ts` - Updated GET/PUT endpoints

### Frontend
- `src/components/PropertyOwnerSettings.tsx` - Added template configuration UI
- `src/components/TenantPaymentsPage.tsx` - Added template display logic

## Summary

This feature provides a seamless way for property owners to communicate bank transfer details to tenants. By centralizing this information in the payment gateway settings, it ensures consistency, reduces manual work, and improves the overall payment experience for all users.

The implementation is:
- ✅ **Simple**: Easy to configure and use
- ✅ **Flexible**: Supports any format or content
- ✅ **Scalable**: Works for single or multiple properties
- ✅ **Maintainable**: Easy to update without code changes
- ✅ **Secure**: Appropriate access controls in place

The feature is now **production-ready** and available for immediate use!

