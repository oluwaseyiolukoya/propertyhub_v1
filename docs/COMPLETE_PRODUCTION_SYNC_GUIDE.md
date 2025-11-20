# Complete Production Database Sync Guide 🔄

## 🎯 The Real Problem

You're right - it's not just about missing roles. If roles are missing, **many other things are likely missing too**:

- ❌ Tables from recent migrations
- ❌ Columns added to existing tables
- ❌ System data (roles, templates)
- ❌ Database triggers
- ❌ Indexes
- ❌ Constraints

**This is a systemic schema sync issue.**

---

## ✅ Complete Solution: 3-Step Process

### **Step 1: Run Comprehensive Audit** 🔍

This checks EVERYTHING:

```bash
cd /workspace/backend
node scripts/audit-and-sync-production.js
```

**What it checks:**
- ✓ All 31 expected tables
- ✓ Critical columns in key tables
- ✓ 5 system roles
- ✓ 5 notification templates
- ✓ Database triggers
- ✓ Migration history

**Output will show:**
```
📊 AUDIT SUMMARY
===========================================

✓ Tables: OK
✗ System Roles: ERROR
✗ Notification Templates: ERROR
✓ Database Triggers: OK
✓ Migration History: OK

❌ DATABASE IS OUT OF SYNC - ACTION REQUIRED

📋 RECOMMENDED FIXES:

# Missing system roles - run script:
node scripts/insert-system-roles-safe.js

# Missing notification templates - run migration:
psql $DATABASE_URL -f migrations/add_team_invitation_template.sql
```

---

### **Step 2: Run Automated Fix Script** 🔧

This fixes EVERYTHING automatically:

```bash
cd /workspace/backend
bash scripts/fix-all-production-issues.sh
```

**What it does:**
1. ✅ Checks Prisma CLI
2. ✅ Shows migration status
3. ✅ Runs all pending migrations
4. ✅ Regenerates Prisma Client
5. ✅ Runs audit to find issues
6. ✅ Inserts system roles if missing
7. ✅ Re-audits to verify fixes
8. ✅ Final verification

**Expected output:**
```
🚀 Starting comprehensive production database sync...
==================================================

Step 1: Checking Prisma CLI...
✓ Prisma CLI available

Step 2: Checking migration status...
Database schema is up to date!

Step 3: Running pending migrations...
✓ Migrations applied

Step 4: Regenerating Prisma Client...
✓ Prisma Client regenerated

Step 5: Running database audit...
✓ Tables: OK
✓ Columns: OK
✓ System Roles: OK
✓ Notification Templates: OK
✓ Database Triggers: OK
✓ Migration History: OK

✅ DATABASE IS FULLY IN SYNC - ALL GOOD!

Step 7: Final verification...
System roles: 5
  - Owner
  - Finance Manager
  - Project Manager
  - Accountant
  - Viewer

Templates: 5

team_members: 0 invoice_attachments: 0 storage_usage: 0

==================================================
✅ Production database sync complete!
```

---

### **Step 3: Verify in UI** ✅

1. **Test Role Dropdown:**
   - Go to Settings → Team
   - Click "Invite Team Member"
   - Role dropdown shows 5 options ✅

2. **Test Project Creation:**
   - Create a new project
   - Should work without errors ✅

3. **Test File Upload:**
   - Upload an invoice attachment
   - Check storage quota updates ✅

4. **Test Notifications:**
   - Send test notification
   - Check email delivery ✅

---

## 📊 What Gets Checked & Fixed

### **Tables (31 total):**
```
✓ activity_logs
✓ admins
✓ onboarding_applications
✓ customer_users
✓ customers
✓ users
✓ plans
✓ subscriptions
✓ invoices
✓ payments
✓ developer_projects
✓ project_budgets
✓ budget_line_items
✓ project_expenses
✓ project_invoices
✓ purchase_orders
✓ vendors
✓ project_milestones
✓ project_forecasts
✓ storage_usage                    ← Team Management
✓ storage_transactions              ← Team Management
✓ invoice_attachments               ← Storage Feature
✓ team_roles                        ← Team Management
✓ team_members                      ← Team Management
✓ invoice_approval_workflows        ← Approval System
✓ invoice_approvals                 ← Approval System
✓ approval_history                  ← Approval System
✓ notifications                     ← Notification System
✓ notification_preferences          ← Notification System
✓ email_queue                       ← Notification System
✓ notification_templates            ← Notification System
✓ notification_logs                 ← Notification System
```

### **Critical Columns:**
```
users:
  ✓ bio
  ✓ is_temp_password
  ✓ temp_password_expires_at
  ✓ must_change_password

customers:
  ✓ storage_used
  ✓ storage_limit
  ✓ storage_last_calculated
  ✓ licenseNumber

team_roles:
  ✓ can_create_invoices
  ✓ can_manage_projects
  ✓ can_view_reports
```

### **System Data:**
```
System Roles (5):
  ✓ Owner
  ✓ Finance Manager
  ✓ Project Manager
  ✓ Accountant
  ✓ Viewer

Notification Templates (5):
  ✓ invoice_approved
  ✓ invoice_rejected
  ✓ invoice_pending_approval
  ✓ team_invitation
  ✓ payment_received
```

### **Database Objects:**
```
Triggers:
  ✓ update_updated_at (on multiple tables)
  ✓ create_default_notification_preferences (on users)
  ✓ update_storage_on_attachment_insert
  ✓ update_storage_on_attachment_delete

Indexes:
  ✓ All foreign key indexes
  ✓ Performance indexes on frequently queried columns
```

---

## 🚀 Quick Start (Copy & Paste)

### **In Production Console:**

```bash
# Navigate to backend
cd /workspace/backend

# Pull latest code (if not already deployed)
git pull origin main

# Run the comprehensive fix script
bash scripts/fix-all-production-issues.sh

# That's it! Script handles everything automatically.
```

---

## 🔍 Manual Verification (Optional)

If you want to manually verify specific things:

### **Check Migration Status:**
```bash
npx prisma migrate status
```

### **Check System Roles:**
```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.team_roles.findMany({where:{is_system_role:true},select:{id:true,name:true}}).then(r=>{console.log('System Roles:');r.forEach(x=>console.log('  -',x.name,'(',x.id,')'))}).finally(()=>p.\$disconnect());"
```

### **Check All Tables:**
```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$queryRaw\`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name\`.then(r=>{console.log('Tables:',r.length);r.forEach(x=>console.log('  -',x.table_name))}).finally(()=>p.\$disconnect());"
```

### **Check Notification Templates:**
```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.notification_templates.findMany({select:{type:true,subject:true}}).then(r=>{console.log('Templates:');r.forEach(x=>console.log('  -',x.type,':',x.subject))}).finally(()=>p.\$disconnect());"
```

---

## ⚠️ Why NOT to Use `db push`

You asked about `npx prisma db push --accept-data-loss`:

### **❌ NEVER USE IN PRODUCTION:**
```bash
npx prisma db push --accept-data-loss  # DANGEROUS!
```

### **Why it's dangerous:**

1. **Data Loss Risk:**
   - Can drop tables
   - Can drop columns
   - Can lose all data in affected tables
   - `--accept-data-loss` literally means "I'm okay losing data"

2. **No Migration History:**
   - Bypasses Prisma's migration system
   - No record of what changed
   - Can't rollback
   - Can't reproduce on other environments

3. **Schema Drift:**
   - Production schema diverges from migrations
   - Future migrations might fail
   - Hard to debug issues
   - Team members can't sync their local DBs

4. **Breaks Best Practices:**
   - Not version controlled
   - Not reviewable
   - Not testable
   - Not reproducible

### **✅ USE INSTEAD:**
```bash
# Safe, version-controlled, reproducible
npx prisma migrate deploy
```

**Benefits:**
- ✅ Only applies approved migrations
- ✅ Never loses data
- ✅ Maintains migration history
- ✅ Can rollback if needed
- ✅ Reproducible across environments

---

## 📋 Complete Checklist

After running the fix script, verify:

- [ ] **Audit shows all green**
  ```
  ✅ DATABASE IS FULLY IN SYNC - ALL GOOD!
  ```

- [ ] **System roles exist (5)**
  ```
  System roles: 5
  ```

- [ ] **Notification templates exist (5+)**
  ```
  Templates: 5
  ```

- [ ] **Role dropdown works in UI**
  - Settings → Team → Invite → Role dropdown shows 5 options

- [ ] **Project creation works**
  - No "Argument missing" errors

- [ ] **File uploads work**
  - Storage quota updates correctly

- [ ] **Notifications work**
  - Test notification sends email

---

## 🆘 If Issues Persist

### **1. Check Build Logs:**
Digital Ocean Dashboard → Your App → Activity → Latest Deployment

Look for:
```
✓ Prisma migrate deploy
  Applying migration `create_team_management_system`
  ✓ Migration applied successfully
```

### **2. Check Runtime Logs:**
Digital Ocean Dashboard → Your App → Runtime Logs

Look for Prisma errors or migration messages.

### **3. Manual Migration:**
```bash
cd /workspace/backend

# Force apply specific migration
psql $DATABASE_URL -f migrations/create_team_management_system.sql

# Verify
npx prisma migrate status
```

### **4. Nuclear Option (Last Resort):**
```bash
# Only if nothing else works and you have backups!
cd /workspace/backend

# Reset Prisma Client
rm -rf node_modules/.prisma node_modules/@prisma/client
npm install
npx prisma generate

# Re-run migrations
npx prisma migrate deploy

# Re-run fix script
bash scripts/fix-all-production-issues.sh
```

---

## 🎯 Summary

**Problem:** Production database is out of sync with local schema

**Root Cause:** Migrations not running automatically on deployment

**Solution:**
1. Run audit script to identify ALL missing elements
2. Run automated fix script to apply ALL fixes
3. Verify in UI that everything works

**Prevention:**
- `.do/app.yaml` now runs migrations automatically
- Every deployment will keep production in sync
- No more manual intervention needed

**Timeline:** 5-10 minutes to run all scripts and verify

---

## ✅ Next Steps

1. **Run the audit:**
   ```bash
   cd /workspace/backend
   node scripts/audit-and-sync-production.js
   ```

2. **Run the fix:**
   ```bash
   bash scripts/fix-all-production-issues.sh
   ```

3. **Verify in UI:**
   - Test all features
   - Confirm everything works

4. **Celebrate!** 🎉
   - Your production database is now fully in sync
   - All features work as expected
   - No more missing data issues

---

**Ready to fix everything? Let's do it!** 🚀

