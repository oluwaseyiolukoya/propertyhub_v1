# How to Update Production Schema Safely 🔄

## 📋 Overview

This guide shows you how to safely update your production database schema to match your local development schema, including adding the team management tables and roles.

---

## ⚠️ IMPORTANT: Safety First

**Before making ANY changes to production:**

1. ✅ **Backup your database**
2. ✅ **Test migrations locally first**
3. ✅ **Use migrations, NOT `db push`**
4. ✅ **Review what will change**
5. ✅ **Have a rollback plan**

---

## 🎯 Method 1: Using Prisma Migrate (Recommended)

This is the **safest and recommended** way to update production.

### **Step 1: Create Migration Locally**

```bash
# On your local machine
cd backend

# Create a migration from your current schema
npx prisma migrate dev --name sync_production_schema

# This will:
# 1. Compare your schema.prisma with your local database
# 2. Generate SQL migration files
# 3. Apply them to your local database
```

### **Step 2: Review the Migration**

```bash
# Check what was generated
ls -la prisma/migrations/

# View the SQL that will be executed
cat prisma/migrations/XXXXXX_sync_production_schema/migration.sql
```

**Review carefully:**
- Does it create the tables you need?
- Does it preserve existing data?
- Are there any DROP statements? (dangerous!)

### **Step 3: Commit the Migration**

```bash
# Add migration files to git
git add prisma/migrations/
git add prisma/schema.prisma

# Commit
git commit -m "feat: add team management schema migration"

# Push to GitHub
git push origin main
```

### **Step 4: Deploy to Production**

Digital Ocean will automatically:
1. Pull the new code
2. Run the build (with Prisma generate)
3. **Automatically run migrations** if you have this in your build setup

**Verify your build command includes:**
```bash
# In .do/app.yaml or Digital Ocean settings
build_command: npm ci && npm run build

# And in package.json
"build": "prisma generate && npx swc src -d dist"
```

**Add a pre-deploy command for migrations:**
```yaml
# In .do/app.yaml
services:
  - name: backend
    # ... other config
    
    # Add this for automatic migrations
    run_command: npm run start
    
    # Optional: Add migration as part of deploy
    build_command: npm ci && npx prisma migrate deploy && npm run build
```

---

## 🎯 Method 2: Manual Migration in Production (If Needed)

If automatic migrations aren't set up, run them manually:

### **Step 1: Access Production Console**

1. Go to Digital Ocean Dashboard
2. Click your app → Console tab
3. Select backend component
4. Click "Launch Console"

### **Step 2: Run Migrations**

```bash
# Navigate to backend
cd /workspace/backend

# Check current migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# This will:
# - Apply all pending migrations
# - NOT create new migrations
# - Safe for production
```

**Expected Output:**
```bash
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database

5 migrations found in prisma/migrations

Applying migration `20241119000001_create_team_management_system`
Applying migration `20241119000002_add_invoice_attachments`
... etc

The following migrations have been applied:

migrations/
  └─ 20241119000001_create_team_management_system/
      └─ migration.sql
  └─ 20241119000002_add_invoice_attachments/
      └─ migration.sql

All migrations have been successfully applied.
```

---

## 🎯 Method 3: Direct SQL Execution (Advanced)

If you need to run specific SQL directly:

### **Step 1: Connect to Production Database**

```bash
# Get your DATABASE_URL from Digital Ocean environment variables
# It looks like: postgresql://user:pass@host:port/database

# In production console or local terminal with access
psql "postgresql://user:pass@host:port/database?sslmode=require"
```

### **Step 2: Run Specific Migrations**

```sql
-- Check if team_roles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'team_roles'
);

-- If false, run the migration
\i /workspace/backend/migrations/create_team_management_system.sql

-- Or copy-paste the SQL content
```

---

## 📊 What Needs to be Updated

Based on your local schema, production needs these tables:

### **1. Team Management Tables:**
- `team_roles` - Role definitions
- `team_members` - Team member records
- `invoice_approval_workflows` - Approval workflow configs
- `invoice_approvals` - Individual approval requests
- `approval_history` - Audit trail

### **2. Notification System Tables:**
- `notifications` - In-app notifications
- `notification_preferences` - User preferences
- `email_queue` - Outgoing email queue
- `notification_templates` - Email templates
- `notification_logs` - Notification audit trail

### **3. Storage Tables:**
- `storage_usage` - Storage tracking
- `storage_transactions` - File operation logs
- `invoice_attachments` - Invoice file attachments

### **4. Updated Existing Tables:**
- `users` - Added: bio, is_temp_password, temp_password_expires_at, must_change_password
- `customers` - Added: storage_used, storage_limit, storage_last_calculated, licenseNumber

---

## 🔍 Check What's Missing in Production

### **Step 1: List Tables in Production**

```bash
# In production console
cd /workspace/backend

# List all tables
npx prisma db pull --force --print

# Or use psql
psql $DATABASE_URL -c "\dt"
```

### **Step 2: Compare with Local**

```bash
# On your local machine
cd backend

# List local tables
npx prisma db pull --force --print

# Compare the two outputs
```

---

## 🚀 Complete Update Process

### **Full Step-by-Step:**

```bash
# ============================================
# ON YOUR LOCAL MACHINE
# ============================================

# 1. Ensure your local schema is up to date
cd backend
npx prisma generate

# 2. Create a migration from current schema
npx prisma migrate dev --name production_sync

# 3. Test the migration locally
npm run dev
# Test all features

# 4. Commit and push
git add prisma/migrations/
git commit -m "feat: sync production schema with team management"
git push origin main

# ============================================
# DIGITAL OCEAN WILL AUTO-DEPLOY
# ============================================

# Wait 5-7 minutes for deployment

# ============================================
# IN PRODUCTION CONSOLE (if needed)
# ============================================

# 5. Verify deployment
cd /workspace/backend

# 6. Check migration status
npx prisma migrate status

# 7. If migrations pending, apply them
npx prisma migrate deploy

# 8. Verify tables exist
npx prisma db pull --force --print | grep -E "model (team_|notification_|storage_)"

# 9. Verify system roles exist
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.team_roles.findMany({where:{is_system_role:true}}).then(r=>console.log('Roles:',r.length)).finally(()=>p.\$disconnect());"

# Expected: Roles: 5
```

---

## 🔧 Quick Fix: Insert System Roles

If tables exist but roles are missing:

```bash
# In production console
cd /workspace/backend

# Create a quick script
cat > insert-roles.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertRoles() {
  const roles = [
    {
      id: 'role-owner',
      name: 'Owner',
      description: 'Full system control and access to all features',
      is_system_role: true,
      permissions: { all: true },
      can_approve_invoices: true,
      approval_limit: null,
      requires_approval_from: [],
    },
    {
      id: 'role-finance-manager',
      name: 'Finance Manager',
      description: 'Financial oversight and invoice approval',
      is_system_role: true,
      permissions: { reports: 'view', expenses: 'manage', invoices: 'approve', projects: 'view' },
      can_approve_invoices: true,
      approval_limit: 50000,
      requires_approval_from: [],
    },
    {
      id: 'role-project-manager',
      name: 'Project Manager',
      description: 'Project operations and management',
      is_system_role: true,
      permissions: { reports: 'view', invoices: 'create', projects: 'manage' },
      can_approve_invoices: false,
      approval_limit: 1000000,
      requires_approval_from: [],
    },
    {
      id: 'role-accountant',
      name: 'Accountant',
      description: 'Financial records and reporting',
      is_system_role: true,
      permissions: { reports: 'view', invoices: 'view', payments: 'record' },
      can_approve_invoices: false,
      approval_limit: null,
      requires_approval_from: [],
    },
    {
      id: 'role-viewer',
      name: 'Viewer',
      description: 'Read-only access',
      is_system_role: true,
      permissions: { invoices: 'view', projects: 'view' },
      can_approve_invoices: false,
      approval_limit: null,
      requires_approval_from: [],
    },
  ];

  for (const role of roles) {
    await prisma.team_roles.upsert({
      where: { id: role.id },
      update: role,
      create: role,
    });
    console.log(`✅ ${role.name}`);
  }

  console.log('✅ All roles inserted/updated');
  await prisma.$disconnect();
}

insertRoles().catch(console.error);
EOF

# Run the script
node insert-roles.js

# Clean up
rm insert-roles.js
```

---

## ✅ Verification Checklist

After updating schema, verify:

### **Tables:**
```bash
# Check tables exist
npx prisma db pull --force --print | grep "model team_roles"
npx prisma db pull --force --print | grep "model team_members"
npx prisma db pull --force --print | grep "model notifications"
```

### **System Roles:**
```bash
# Check roles exist
psql $DATABASE_URL -c "SELECT id, name FROM team_roles WHERE is_system_role = true;"

# Expected: 5 rows
```

### **Application:**
```bash
# Test the API
curl https://your-app.ondigitalocean.app/api/team/roles \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return 5 system roles
```

---

## 🆘 Troubleshooting

### **Issue: Migration Fails**

```bash
# Check what's wrong
npx prisma migrate status

# Force reset (DANGEROUS - only in emergency)
npx prisma migrate resolve --rolled-back "migration_name"

# Then try again
npx prisma migrate deploy
```

### **Issue: Tables Already Exist**

```bash
# If tables exist but migrations say pending
npx prisma migrate resolve --applied "migration_name"

# This marks the migration as applied without running it
```

### **Issue: Schema Drift**

```bash
# Pull current production schema
npx prisma db pull --force

# This will update your schema.prisma to match production
# Review the changes
git diff prisma/schema.prisma

# If correct, commit
git add prisma/schema.prisma
git commit -m "fix: sync schema with production state"
```

---

## 📝 Best Practices

1. **Always use migrations** in production
2. **Never use `db push`** in production
3. **Test locally first**
4. **Backup before changes**
5. **Review SQL before applying**
6. **Monitor after deployment**
7. **Have rollback plan ready**

---

## 🎯 Summary

**Recommended approach:**

1. **Local:** Create migration with `prisma migrate dev`
2. **Git:** Commit and push migration files
3. **Deploy:** Let Digital Ocean auto-deploy
4. **Verify:** Check tables and data in production

**If migrations aren't auto-running:**

1. **Console:** Access production console
2. **Deploy:** Run `npx prisma migrate deploy`
3. **Verify:** Check tables exist
4. **Roles:** Insert system roles if needed

---

**Your production schema will be updated safely!** 🚀

