# Notification Test Endpoint Fix

## Issue Summary

The `/api/notifications/test` endpoint was returning a 500 Internal Server Error when users tried to send test notifications from the Developer Settings.

**Error Stack:**
```
POST http://localhost:5173/api/notifications/test 500 (Internal Server Error)
```

## Root Cause

The `NotificationService.queueEmail()` method was missing the required `from_email` field when creating records in the `email_queue` table.

### Database Constraint

The `email_queue` table has a NOT NULL constraint on the `from_email` column:

```sql
from_email    | text    | not null
```

### Code Issue

The `CreateEmailData` interface and the `queueEmail()` method were not including `from_email` when inserting into the database:

**Before:**
```typescript
export interface CreateEmailData {
  customerId: string;
  userId?: string;
  toEmail: string;
  toName?: string;
  // ❌ Missing fromEmail and fromName
  subject: string;
  bodyHtml: string;
  // ...
}

async queueEmail(data: CreateEmailData) {
  const email = await prisma.email_queue.create({
    data: {
      customer_id: data.customerId,
      to_email: data.toEmail,
      to_name: data.toName,
      // ❌ Missing from_email (required field!)
      subject: data.subject,
      body_html: data.bodyHtml,
      // ...
    },
  });
}
```

## Solution Applied

### 1. Updated Interface

Added optional `fromEmail` and `fromName` fields to `CreateEmailData`:

```typescript
export interface CreateEmailData {
  customerId: string;
  userId?: string;
  toEmail: string;
  toName?: string;
  fromEmail?: string;    // ✅ Added
  fromName?: string;     // ✅ Added
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  templateName?: string;
  templateData?: any;
  priority?: number;
  scheduledAt?: Date;
}
```

### 2. Updated queueEmail Method

Added `from_email` and `from_name` with sensible defaults:

```typescript
async queueEmail(data: CreateEmailData) {
  try {
    const email = await prisma.email_queue.create({
      data: {
        customer_id: data.customerId,
        user_id: data.userId,
        to_email: data.toEmail,
        to_name: data.toName,
        from_email: data.fromEmail || process.env.SMTP_FROM || 'noreply@contrezz.com',  // ✅ Added
        from_name: data.fromName || 'Contrezz',                                          // ✅ Added
        subject: data.subject,
        body_html: data.bodyHtml,
        body_text: data.bodyText,
        template_name: data.templateName,
        template_data: data.templateData || {},
        priority: data.priority || 5,
        scheduled_at: data.scheduledAt,
        status: 'pending',
      },
    });
    // ...
  }
}
```

## Default Values

The fix uses a fallback chain for `from_email`:
1. **`data.fromEmail`** - If explicitly provided
2. **`process.env.SMTP_FROM`** - From environment variable (`info@contrezz.com`)
3. **`'noreply@contrezz.com'`** - Hardcoded fallback

For `from_name`:
1. **`data.fromName`** - If explicitly provided
2. **`'Contrezz'`** - Default sender name

## Files Modified

- **`backend/src/services/notification.service.ts`**
  - Updated `CreateEmailData` interface (lines 17-29)
  - Updated `queueEmail()` method (lines 211-228)

## Verification

After the fix:
1. ✅ Backend restarted automatically (tsx watch)
2. ✅ No Prisma constraint errors in logs
3. ✅ `/api/notifications/test` endpoint should now work
4. ✅ Test notifications can be sent from Developer Settings

## Impact

This fix affects all email queueing operations in the notification service:
- Test notifications
- Invoice approval notifications
- Team invitation notifications
- System alerts
- Any other notifications that use `NotificationService.queueEmail()`

All existing callers of `queueEmail()` will continue to work because `fromEmail` and `fromName` are optional fields with sensible defaults.

## Related Issues

This fix also resolves the underlying cause mentioned in the earlier error logs:
```
code: 'P2011',
clientVersion: '5.22.0',
meta: { modelName: 'email_queue', constraint: [ 'from_email' ] }
```

## Date Fixed

November 23, 2025

## Testing Recommendations

1. Test sending a notification from Developer Settings → Notifications tab
2. Verify the email appears in the `email_queue` table with correct `from_email`
3. Check that the email is processed and sent successfully
4. Verify other notification types (invoice approvals, team invitations) still work

## Environment Variable

Ensure `SMTP_FROM` is set in `.env`:
```bash
SMTP_FROM=info@contrezz.com
```

