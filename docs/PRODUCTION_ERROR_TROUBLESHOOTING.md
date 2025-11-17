# Production Error Troubleshooting - Landing Page Forms

## 🚨 Error: 500 Internal Server Error on Form Submission

If you're getting a 500 error when submitting the contact form in production, follow these steps:

---

## 🔍 **Step 1: Check Backend Logs**

### **For Render.com:**
1. Go to your backend service dashboard
2. Click **"Logs"** tab
3. Look for error messages when form is submitted
4. Search for: `❌ Form submission error:`

### **Common Error Messages:**

#### **Error 1: Table doesn't exist**
```
Error: relation "landing_page_submissions" does not exist
```
**Solution:** Run the production migration (see Step 2)

#### **Error 2: Column doesn't exist**
```
Error: column "ticketNumber" of relation "landing_page_submissions" does not exist
```
**Solution:** Run the ticket number migration (see Step 3)

#### **Error 3: Database connection failed**
```
Error: Can't reach database server
```
**Solution:** Check `DATABASE_URL` environment variable

#### **Error 4: Email service failed**
```
Error: Invalid login: 535 Authentication failed
```
**Solution:** Check SMTP credentials (see Step 4)

---

## 🔧 **Step 2: Run Production Migration**

### **Option A: Using Prisma (Recommended)**

```bash
# SSH into your production server or use Render shell
cd backend
npx prisma migrate deploy
```

### **Option B: Using SQL Script**

1. Connect to your production database
2. Run the SQL script:

```bash
psql $DATABASE_URL -f backend/migrations/PRODUCTION_SETUP.sql
```

Or manually:
1. Go to your database dashboard (e.g., Render PostgreSQL)
2. Open SQL console
3. Copy and paste contents of `backend/migrations/PRODUCTION_SETUP.sql`
4. Execute

---

## 🎫 **Step 3: Add Ticket Number Column (If Missing)**

If the `ticketNumber` column is missing:

```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'landing_page_submissions' 
  AND column_name = 'ticketNumber';

-- If not exists, add it
ALTER TABLE "public"."landing_page_submissions" 
ADD COLUMN "ticketNumber" SERIAL;

ALTER TABLE "public"."landing_page_submissions" 
ADD CONSTRAINT "landing_page_submissions_ticketNumber_key" 
UNIQUE ("ticketNumber");

-- Set starting value (optional)
SELECT setval(
  pg_get_serial_sequence('"public"."landing_page_submissions"', 'ticketNumber'), 
  100000, 
  false
);
```

---

## 📧 **Step 4: Verify Email Configuration**

### **Check Environment Variables:**

Make sure these are set in production:

```bash
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@yourdomain.com
```

### **Test Email Service:**

The form submission will still work even if email fails, but check logs for:
```
✅ Confirmation email sent successfully
```
or
```
❌ Failed to send confirmation email: [error details]
```

**Note:** Email failures won't cause a 500 error - the form submission will succeed regardless.

---

## 🗄️ **Step 5: Verify Database Schema**

Run this query to check your database:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('landing_page_submissions', 'submission_responses');

-- Check landing_page_submissions columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'landing_page_submissions'
ORDER BY ordinal_position;

-- Check for existing submissions
SELECT COUNT(*) as total_submissions
FROM landing_page_submissions;
```

---

## 🔐 **Step 6: Check Prisma Client**

Make sure Prisma Client is generated in production:

```bash
# In your backend directory
npx prisma generate
```

### **For Render.com:**
Add this to your build command:
```bash
npm install && npx prisma generate && npm run build
```

---

## 🧪 **Step 7: Test with Minimal Data**

Try submitting a form with minimal data to isolate the issue:

```json
{
  "formType": "contact_us",
  "name": "Test User",
  "email": "test@example.com",
  "message": "This is a test message with more than 10 characters"
}
```

Use curl or Postman:
```bash
curl -X POST https://api.contrezz.com/api/landing-forms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "contact_us",
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message"
  }'
```

---

## 📊 **Step 8: Check Database Permissions**

Ensure your database user has the correct permissions:

```sql
-- Check current user permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'landing_page_submissions';

-- Grant permissions if needed (run as admin)
GRANT SELECT, INSERT, UPDATE, DELETE 
ON landing_page_submissions 
TO your_database_user;

GRANT USAGE, SELECT 
ON SEQUENCE landing_page_submissions_ticketnumber_seq 
TO your_database_user;
```

---

## 🚀 **Step 9: Restart Backend Service**

After making changes:

### **For Render.com:**
1. Go to your backend service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Or click **"Restart"** if no code changes

### **For Other Platforms:**
```bash
# Restart your Node.js process
pm2 restart backend
# or
systemctl restart your-backend-service
```

---

## 📝 **Step 10: Enable Detailed Error Logging**

The code now includes detailed error logging. Check your logs for:

```
❌ Form submission error: [error object]
Error name: [error type]
Error message: [detailed message]
Error stack: [stack trace]
```

This will tell you exactly what's failing.

---

## ✅ **Verification Checklist**

After fixing, verify:

- [ ] Tables exist in production database
- [ ] `ticketNumber` column exists and is SERIAL
- [ ] Prisma Client is generated
- [ ] Environment variables are set correctly
- [ ] Database user has correct permissions
- [ ] Backend service is running
- [ ] Form submission returns 201 status
- [ ] Data appears in database
- [ ] Confirmation email is sent (optional)

---

## 🆘 **Quick Fix Commands**

Run these in order:

```bash
# 1. Connect to production database
psql $DATABASE_URL

# 2. Run setup script
\i backend/migrations/PRODUCTION_SETUP.sql

# 3. Verify tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%landing_page%';

# 4. Exit psql
\q

# 5. Regenerate Prisma Client
cd backend
npx prisma generate

# 6. Restart backend
# (Use your platform's restart method)
```

---

## 🔍 **Most Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 Error | Tables don't exist | Run migration script |
| 500 Error | `ticketNumber` missing | Add SERIAL column |
| 500 Error | Prisma Client outdated | Run `npx prisma generate` |
| 400 Error | Validation failed | Check message length (min 10 chars) |
| 429 Error | Rate limit | Wait 24 hours or clear rate limit |
| Email not sent | SMTP config missing | Set SMTP env vars (non-critical) |

---

## 📞 **Still Having Issues?**

1. **Share the exact error** from backend logs
2. **Check database** - does the table exist?
3. **Verify environment variables** are set
4. **Test locally** with production database URL
5. **Check Prisma schema** matches database

---

## 🎯 **Expected Success Response**

When working correctly, you should see:

```json
{
  "success": true,
  "message": "Form submitted successfully",
  "data": {
    "id": "uuid-here",
    "status": "new",
    "submittedAt": "2025-11-17T..."
  }
}
```

And in logs:
```
📥 Landing form submission received: {...}
✅ Form submitted successfully: uuid-here
📧 Sending confirmation email to user@example.com...
✅ Confirmation email sent successfully
```

---

**Status:** Use this guide to diagnose and fix production errors! 🚀

