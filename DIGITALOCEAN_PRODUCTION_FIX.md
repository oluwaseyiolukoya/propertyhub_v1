# 🚨 DigitalOcean Production Fix - Contact Form 500 Error

## ⚡ **Quick Fix for DigitalOcean Server**

The `landing_page_submissions` table doesn't exist in your production database yet.

---

## ✅ **SOLUTION - Step by Step:**

### **Step 1: SSH into Your DigitalOcean Droplet**

```bash
ssh root@your-server-ip
# or
ssh your-username@your-server-ip
```

---

### **Step 2: Navigate to Your Backend Directory**

```bash
cd /path/to/your/backend
# Example: cd /var/www/propertyhub/backend
```

---

### **Step 3: Run Prisma Migration (Recommended)**

```bash
# Make sure you're in the backend directory
npx prisma migrate deploy
```

**If you get "command not found":**
```bash
# Use npm instead
npm run prisma migrate deploy
```

**If Prisma is not installed globally:**
```bash
# Install dependencies first
npm install
npx prisma generate
npx prisma migrate deploy
```

---

### **Step 4: Restart Your Backend Service**

**If using PM2:**
```bash
pm2 restart backend
# or
pm2 restart all
```

**If using systemd:**
```bash
sudo systemctl restart your-backend-service
```

**If using Docker:**
```bash
docker-compose restart backend
# or
docker restart your-backend-container
```

**If running directly with Node:**
```bash
# Find the process
ps aux | grep node

# Kill it
kill -9 <process-id>

# Restart it
cd /path/to/backend
npm start &
# or
node dist/index.js &
```

---

### **Step 5: Verify Tables Were Created**

```bash
# Connect to PostgreSQL
psql -U your-db-user -d your-db-name

# Or if using connection string
psql "postgresql://user:password@localhost:5432/contrezz"

# Check if tables exist
\dt landing_page*

# You should see:
# landing_page_submissions
# submission_responses

# Exit psql
\q
```

---

## 🔄 **Alternative Method: Run SQL Script Directly**

If Prisma migration doesn't work:

### **Option A: Using psql Command**

```bash
# From your server
psql -U your-db-user -d your-db-name -f backend/migrations/PRODUCTION_SETUP.sql

# Or with connection string
psql "postgresql://user:password@localhost:5432/contrezz" -f backend/migrations/PRODUCTION_SETUP.sql
```

### **Option B: Copy SQL and Run Manually**

```bash
# 1. Connect to PostgreSQL
psql -U your-db-user -d your-db-name

# 2. Copy the SQL from backend/migrations/PRODUCTION_SETUP.sql
# 3. Paste and execute in psql

# 4. Verify
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%landing_page%';

# 5. Exit
\q
```

---

## 📊 **Check Your Database Connection**

### **Find Your Database Credentials:**

```bash
# Check environment variables
cat /path/to/backend/.env | grep DATABASE_URL

# Or check your process environment
pm2 env 0 | grep DATABASE_URL
```

### **Test Database Connection:**

```bash
# Try connecting
psql $DATABASE_URL

# Or manually
psql -U your-db-user -h localhost -d your-db-name
```

---

## 🔍 **Check Backend Logs**

### **If using PM2:**
```bash
pm2 logs backend
# or
pm2 logs --lines 100
```

### **If using systemd:**
```bash
sudo journalctl -u your-backend-service -n 100 -f
```

### **If using Docker:**
```bash
docker logs your-backend-container --tail 100 -f
```

### **If using log files:**
```bash
tail -f /path/to/backend/logs/*.log
# or
tail -f /var/log/your-app/*.log
```

**Look for:**
```
❌ Form submission error: [error details]
Error message: relation "landing_page_submissions" does not exist
```

---

## 🚀 **Complete Setup Script (Run All at Once)**

Create a file `fix-production.sh`:

```bash
#!/bin/bash

echo "🔧 Fixing Production Landing Page Forms..."

# Navigate to backend
cd /path/to/your/backend || exit

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Restart backend
echo "🔄 Restarting backend service..."
pm2 restart backend

echo "✅ Done! Check if form submission works now."
echo "📊 View logs: pm2 logs backend"
```

**Make it executable and run:**
```bash
chmod +x fix-production.sh
./fix-production.sh
```

---

## 🗄️ **Manual Database Setup (If All Else Fails)**

```bash
# 1. Connect to PostgreSQL
psql -U your-db-user -d your-db-name

# 2. Run this SQL:
```

```sql
-- Create landing_page_submissions table
CREATE TABLE IF NOT EXISTS "public"."landing_page_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" SERIAL UNIQUE,
    "formType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "timezone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "source" TEXT,
    "referralUrl" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "assignedToId" TEXT,
    "adminNotes" TEXT,
    "internalTags" TEXT[],
    "responseStatus" TEXT,
    "responseDate" TIMESTAMP(3),
    "responseBy" TEXT,
    "responseNotes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browserInfo" JSONB,
    "deviceInfo" JSONB,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "landing_page_submissions_formType_idx" ON "public"."landing_page_submissions"("formType");
CREATE INDEX IF NOT EXISTS "landing_page_submissions_status_idx" ON "public"."landing_page_submissions"("status");
CREATE INDEX IF NOT EXISTS "landing_page_submissions_email_idx" ON "public"."landing_page_submissions"("email");
CREATE INDEX IF NOT EXISTS "landing_page_submissions_createdAt_idx" ON "public"."landing_page_submissions"("createdAt");

-- Create submission_responses table
CREATE TABLE IF NOT EXISTS "public"."submission_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "respondedById" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "submission_responses_submissionId_fkey" 
    FOREIGN KEY ("submissionId") 
    REFERENCES "public"."landing_page_submissions"("id") 
    ON DELETE CASCADE
);

-- Create indexes for responses
CREATE INDEX IF NOT EXISTS "submission_responses_submissionId_idx" ON "public"."submission_responses"("submissionId");

-- Verify
SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%landing_page%';
```

---

## 📧 **Email Configuration (After Form Works)**

Add these to your environment variables:

```bash
# Edit your .env file
nano /path/to/backend/.env

# Add these lines:
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@yourdomain.com
```

**If using PM2 with ecosystem file:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'backend',
    script: './dist/index.js',
    env: {
      NODE_ENV: 'production',
      SMTP_HOST: 'mail.privateemail.com',
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
      SMTP_USER: 'your-email@yourdomain.com',
      SMTP_PASS: 'your-password'
    }
  }]
}
```

**Restart after adding:**
```bash
pm2 restart backend --update-env
```

---

## ✅ **Verification Steps**

### **1. Check Tables Exist:**
```bash
psql -U your-db-user -d your-db-name -c "\dt landing_page*"
```

### **2. Check Backend is Running:**
```bash
pm2 status
# or
ps aux | grep node
```

### **3. Test Form Submission:**
```bash
curl -X POST https://api.contrezz.com/api/landing-forms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "contact_us",
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message with more than 10 characters"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "data": {
    "id": "...",
    "status": "new",
    "submittedAt": "..."
  }
}
```

### **4. Check Logs:**
```bash
pm2 logs backend --lines 50
```

**Should see:**
```
✅ Form submitted successfully: [id]
📧 Sending confirmation email to test@example.com...
```

---

## 🔧 **Common DigitalOcean Issues:**

### **Issue 1: Permission Denied**
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/backend
chmod -R 755 /path/to/backend
```

### **Issue 2: PostgreSQL Not Running**
```bash
# Check status
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Enable on boot
sudo systemctl enable postgresql
```

### **Issue 3: Node/npm Not Found**
```bash
# Check Node version
node --version
npm --version

# If not installed, install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### **Issue 4: Prisma Not Found**
```bash
# Install Prisma globally
npm install -g prisma

# Or use npx
npx prisma --version
```

---

## 🚀 **Quick Command Summary**

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Navigate to backend
cd /path/to/backend

# 3. Pull latest code
git pull origin main

# 4. Install & generate
npm install
npx prisma generate

# 5. Run migration
npx prisma migrate deploy

# 6. Restart service
pm2 restart backend

# 7. Check logs
pm2 logs backend

# 8. Test form
curl -X POST https://api.contrezz.com/api/landing-forms/submit \
  -H "Content-Type: application/json" \
  -d '{"formType":"contact_us","name":"Test","email":"test@test.com","message":"Test message here"}'
```

---

## 📞 **Need More Help?**

1. **Share your setup:**
   - Are you using PM2, systemd, or Docker?
   - Where is your backend located? (`/var/www/`, `/home/`, etc.)
   - What's your database setup? (local PostgreSQL, managed database, etc.)

2. **Share the error:**
   - Run `pm2 logs backend` or check your logs
   - Copy the error message that appears when submitting the form

3. **Check the detailed guide:**
   - `docs/PRODUCTION_ERROR_TROUBLESHOOTING.md`

---

## ✅ **After Fix Checklist:**

- [ ] SSH'd into DigitalOcean server
- [ ] Navigated to backend directory
- [ ] Pulled latest code from GitHub
- [ ] Ran `npx prisma migrate deploy`
- [ ] Restarted backend service (PM2/systemd/Docker)
- [ ] Verified tables exist in database
- [ ] Tested form submission (should return 201)
- [ ] Checked logs (should see success message)
- [ ] Tested in browser (form should work!)

---

**The fix is straightforward - just need to run the migration on your DigitalOcean server!** 🚀

Let me know your specific setup (PM2/Docker/systemd) and I can give you exact commands!

