# Email Setup Guide - Namecheap SMTP Configuration

## 📧 **Overview**

This guide will help you set up email sending using your Namecheap email account with SMTP.

## 🔧 **Step 1: Configure Environment Variables**

Add the following variables to your `.env` file in the `backend` directory:

```env
# ============================================================================
# EMAIL CONFIGURATION (Namecheap SMTP)
# ============================================================================

# SMTP Server Configuration
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true

# SMTP Authentication
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password

# From Address (defaults to SMTP_USER if not set)
SMTP_FROM=noreply@yourdomain.com

# Frontend URL (for email links)
FRONTEND_URL=https://contrezz.com
```

### **Replace the following:**

1. **`SMTP_USER`**: Your Namecheap email address (e.g., `noreply@contrezz.com`)
2. **`SMTP_PASS`**: Your email password
3. **`SMTP_FROM`**: The "From" address for emails (can be the same as SMTP_USER)
4. **`FRONTEND_URL`**: Your frontend URL (e.g., `https://contrezz.com` or `http://localhost:5173` for development)

## 📝 **Namecheap SMTP Settings**

### **Option 1: SSL/TLS (Recommended)**

```env
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
```

### **Option 2: STARTTLS**

```env
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_SECURE=false
```

## 🧪 **Step 2: Test Email Connection**

### **Method 1: Using API Endpoints (Recommended)**

1. **Start the backend server:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Test the connection:**

   ```bash
   # Get your admin auth token first (login as admin)
   # Then test the connection
   curl -X GET http://localhost:5000/api/email-test/connection \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN"
   ```

3. **Send a test email:**
   ```bash
   curl -X POST http://localhost:5000/api/email-test/send \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"to":"your-email@example.com"}'
   ```

### **Method 2: Using Postman or Thunder Client**

1. **Test Connection:**

   - Method: `GET`
   - URL: `http://localhost:5000/api/email-test/connection`
   - Headers: `Authorization: Bearer YOUR_AUTH_TOKEN`

2. **Send Test Email:**

   - Method: `POST`
   - URL: `http://localhost:5000/api/email-test/send`
   - Headers:
     - `Authorization: Bearer YOUR_AUTH_TOKEN`
     - `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "to": "your-email@example.com"
     }
     ```

3. **Get Email Config:**
   - Method: `GET`
   - URL: `http://localhost:5000/api/email-test/config`
   - Headers: `Authorization: Bearer YOUR_AUTH_TOKEN`

## 📊 **Expected Responses**

### **✅ Successful Connection Test**

```json
{
  "success": true,
  "message": "Email connection successful! SMTP server is ready to send emails."
}
```

### **✅ Successful Test Email**

```json
{
  "success": true,
  "message": "Test email sent successfully! Check your inbox.",
  "messageId": "<unique-message-id@yourdomain.com>"
}
```

### **❌ Failed Connection (Missing Credentials)**

```json
{
  "success": false,
  "message": "Email credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file."
}
```

### **❌ Failed Connection (Invalid Credentials)**

```json
{
  "success": false,
  "message": "Email connection failed: Invalid login: 535 Incorrect authentication data",
  "error": {
    "code": "EAUTH",
    "command": "AUTH PLAIN",
    "response": "535 Incorrect authentication data",
    "responseCode": 535
  }
}
```

## 🔍 **Troubleshooting**

### **Issue 1: "Invalid login" or "Authentication failed"**

**Possible Causes:**

- Incorrect email address or password
- Email account not activated
- Two-factor authentication enabled

**Solutions:**

1. Double-check your email address and password
2. Make sure your Namecheap email account is active
3. If 2FA is enabled, you may need to generate an app-specific password
4. Try logging into Namecheap webmail to verify credentials

### **Issue 2: "Connection timeout"**

**Possible Causes:**

- Incorrect SMTP host or port
- Firewall blocking outgoing connections
- Network issues

**Solutions:**

1. Verify SMTP_HOST is `mail.privateemail.com`
2. Try port 587 instead of 465:
   ```env
   SMTP_PORT=587
   SMTP_SECURE=false
   ```
3. Check if your firewall allows outgoing connections on port 465/587
4. Try from a different network

### **Issue 3: "Self-signed certificate" error**

**Solution:**
The email service already has `rejectUnauthorized: false` configured, but if you still see this error, you can:

1. Use port 587 with STARTTLS instead of port 465
2. Update your Node.js version to the latest

### **Issue 4: Email sent but not received**

**Possible Causes:**

- Email in spam folder
- Incorrect recipient address
- Email server delays

**Solutions:**

1. Check spam/junk folder
2. Verify the recipient email address
3. Wait a few minutes for delivery
4. Check Namecheap email logs (if available)

## 📧 **Email Templates**

The system includes the following email templates:

### **1. Test Email**

- Sent when testing email configuration
- Includes SMTP configuration details
- Beautiful HTML template with branding

### **2. Tenant Invitation Email**

- Sent when a tenant is added to a lease
- Includes login credentials and property details
- Used by property owners/managers

### **3. Customer Invitation Email**

- Sent when a new customer account is created
- Includes login credentials and plan details
- Customized based on customer type (Owner/Manager/Developer)

## 🔐 **Security Best Practices**

1. **Never commit `.env` file to git**

   - Already in `.gitignore`
   - Store sensitive credentials securely

2. **Use strong passwords**

   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols

3. **Use a dedicated email account**

   - Create a separate email like `noreply@yourdomain.com`
   - Don't use your personal email

4. **Enable 2FA on Namecheap**

   - Adds extra security to your account
   - Generate app-specific password for SMTP

5. **Monitor email sending**
   - Check logs regularly
   - Watch for unusual activity
   - Set up alerts for failures

## 📝 **Console Logs**

When testing, you'll see detailed logs in the backend console:

### **Successful Connection:**

```
📧 Initializing email transporter with config: {
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  user: 'noreply@contrezz.com',
  from: 'noreply@contrezz.com'
}
🔍 Testing email connection...
📧 SMTP Host: mail.privateemail.com
📧 SMTP Port: 465
📧 SMTP User: noreply@contrezz.com
📧 SMTP From: noreply@contrezz.com
✅ Email connection successful!
```

### **Successful Email Send:**

```
📧 Sending test email to: your-email@example.com
✅ Test email sent successfully!
📬 Message ID: <abc123@yourdomain.com>
📧 Response: 250 2.0.0 Ok: queued as ABC123
```

### **Failed Connection:**

```
📧 Initializing email transporter with config: { ... }
🔍 Testing email connection...
❌ Email connection failed: Error: Invalid login: 535 Incorrect authentication data
```

## 🚀 **Next Steps**

After successfully testing the email connection:

1. **Update Customer Creation**

   - Emails will be sent automatically when creating customers
   - Includes login credentials and welcome message

2. **Update Tenant Invitations**

   - Emails sent when adding tenants to leases
   - Includes property and unit details

3. **Monitor Email Logs**

   - Check backend console for email sending status
   - Set up error notifications

4. **Production Deployment**
   - Update `.env` on production server
   - Test email sending in production
   - Monitor delivery rates

## 📚 **API Endpoints Reference**

### **Test Connection**

```
GET /api/email-test/connection
Authorization: Bearer {admin_token}
```

### **Send Test Email**

```
POST /api/email-test/send
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "to": "recipient@example.com"
}
```

### **Get Email Config**

```
GET /api/email-test/config
Authorization: Bearer {admin_token}
```

## ✅ **Checklist**

Before going live with email:

- [ ] Environment variables configured in `.env`
- [ ] Email credentials verified (can login to webmail)
- [ ] Connection test successful
- [ ] Test email received
- [ ] Test email not in spam folder
- [ ] Email templates reviewed
- [ ] Production `.env` updated
- [ ] Production email test successful
- [ ] Monitoring set up

---

**Status:** ✅ **READY FOR TESTING**

Please add your Namecheap SMTP credentials to the `.env` file and test the connection!




