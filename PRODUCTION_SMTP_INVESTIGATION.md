# Production SMTP Investigation

## Issue Report

**Environment:** Production (api.contrezz.com)  
**Problem:** Customer creation fails with 500 error when "Send Invitation" is clicked  
**Status:** SMTP works locally but fails in production

## Errors Observed

1. **Customer Creation 500 Error:**
   ```
   POST api.contrezz.com/api/customers → 500 (Internal Server Error)
   ```

2. **Application Delete Error:**
   ```
   Cannot delete application: Customer account exists (developer2@contrezz.com)
   ```

3. **Onboarding Application 400 Error:**
   ```
   api.contrezz.com/api/admin/onboarding/applications/799c184a-06e4-45b8-b447-19704f1fb0d3 → 400
   ```

## Investigation Steps

### 1. SMTP Configuration Check

**Local (Working):**
- SMTP_HOST=mail.privateemail.com
- SMTP_PORT=465
- SMTP_USER=info@contrezz.com
- SMTP_PASS=Korede@198800
- SMTP_FROM=info@contrezz.com

**Production (Need to verify):**
- Check if environment variables are set correctly
- Verify SMTP credentials are valid
- Check if firewall/network allows SMTP connections

### 2. Possible Root Causes

#### A. Environment Variables Not Set
**Symptom:** Email configuration missing error
**Check:** 
```typescript
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error("❌ Email configuration missing");
}
```

#### B. Network/Firewall Blocking
**Symptom:** Connection timeout or EAUTH errors
**Common in:**
- Cloud hosting (DigitalOcean, AWS, etc.)
- Corporate networks
- Some ISPs block port 465/587

#### C. SMTP Credentials Invalid
**Symptom:** Authentication failure
**Possible reasons:**
- Password changed
- Account suspended
- Wrong credentials in production .env

#### D. Email Sending Throws Error
**Symptom:** 500 error when sendCustomerInvitation() is called
**Current code:** Email errors are caught but customer creation continues
**Issue:** If email throws before customer is created, it causes 500

### 3. Code Analysis

**Current Flow:**
```typescript
// backend/src/routes/customers.ts
try {
  // 1. Create customer in database ✅
  const customer = await prisma.customers.create({...});
  
  // 2. Create user ✅
  const ownerUser = await prisma.users.create({...});
  
  // 3. Send email (if requested)
  if (sendInvitation) {
    try {
      await sendCustomerInvitation({...}); // ❌ May fail here
    } catch (emailError) {
      // Email error is caught and logged
      // Customer creation continues
    }
  }
  
  // 4. Return success
  return res.status(201).json({...});
  
} catch (error) {
  // ❌ 500 error returned here
  return res.status(500).json({ 
    error: "Failed to create customer",
    details: error?.message
  });
}
```

**Problem:** If email sending throws an error that's not caught properly, it bubbles up and causes 500.

### 4. Email Library Check

**File:** `backend/src/lib/email.ts`

```typescript
export async function sendCustomerInvitation(params): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({...});
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send customer invitation email:', error);
    throw new Error(`Failed to send customer invitation email: ${error.message}`);
    // ❌ THROWS ERROR - This causes 500 if not caught
  }
}
```

**Issue Found:** `sendCustomerInvitation()` throws an error instead of returning false!

## Root Cause Identified

**The Problem:**
1. `sendCustomerInvitation()` throws an error when email fails
2. The try-catch in customers.ts catches it, but...
3. If the error happens during customer creation (before customer is saved), it causes 500
4. The error message suggests customer WAS created but email failed

**Most Likely Cause:** SMTP environment variables are not set in production, causing `getTransporter()` to fail or authentication to fail.

## Solutions

### Solution 1: Fix Email Error Handling (Immediate)

Change `sendCustomerInvitation()` to return false instead of throwing:

```typescript
export async function sendCustomerInvitation(params): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({...});
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send customer invitation email:', error);
    return false; // ✅ Return false instead of throwing
  }
}
```

### Solution 2: Verify Production Environment Variables

Check production .env file has:
```env
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@contrezz.com
SMTP_PASS=Korede@198800
SMTP_FROM=info@contrezz.com
```

### Solution 3: Add Better Error Logging

Add detailed logging to see what's failing:

```typescript
if (sendInvitation) {
  try {
    console.log('📧 SMTP Config Check:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASS
    });
    
    const emailSent = await sendCustomerInvitation({...});
    
    if (!emailSent) {
      console.error('⚠️ Email not sent but customer created successfully');
    }
  } catch (emailError: any) {
    console.error('❌ Email error:', {
      message: emailError?.message,
      code: emailError?.code,
      stack: emailError?.stack
    });
  }
}
```

### Solution 4: Check Production Firewall

If using DigitalOcean/AWS:
- Ensure outbound SMTP ports (465, 587) are not blocked
- Check security group rules
- Try using port 587 with STARTTLS instead of 465 with SSL

## Next Steps

1. ✅ Fix `sendCustomerInvitation()` to return false instead of throwing
2. ⏳ Check production environment variables
3. ⏳ Review production logs for actual error
4. ⏳ Test SMTP connection from production server
5. ⏳ Update production .env if needed

## Testing

After fixes:
1. Try creating a customer with "Send Invitation" checked
2. Check backend logs for SMTP configuration
3. Verify customer is created even if email fails
4. Check if email is received

## Production Deployment Checklist

- [ ] Update `backend/src/lib/email.ts` (return false instead of throw)
- [ ] Verify production .env has all SMTP variables
- [ ] Test SMTP connection from production server
- [ ] Deploy updated code
- [ ] Test customer creation
- [ ] Monitor logs for email errors


