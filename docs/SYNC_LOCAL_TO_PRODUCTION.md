# Sync Local Schema to Production - Best Practice ✅

## 🎯 You're Right!

Having **exactly the same schema** in local and production is the **best practice**. This is called **schema parity** and prevents bugs, data issues, and deployment problems.

---

## 🔄 The Proper Way: Prisma Migrate Workflow

This is the **industry-standard** approach used by professional teams:

---

## 📋 Complete Workflow

### **Step 1: Create Migration from Local Schema**

```bash
# On your local machine
cd backend

# This creates a migration based on your current schema.prisma
npx prisma migrate dev --name sync_all_changes

# What this does:
# 1. Compares schema.prisma with your local database
# 2. Generates SQL migration files
# 3. Applies them to your local database
# 4. Generates Prisma Client
```

**Important:** This will create a new migration file in `prisma/migrations/` with ALL the differences between your schema and database.

---

### **Step 2: Review the Migration**

```bash
# View the generated SQL
cat prisma/migrations/$(ls -t prisma/migrations | head -1)/migration.sql

# Check what it will do:
# - CREATE TABLE statements for new tables
# - ALTER TABLE statements for new columns
# - INSERT statements (if you added them)
```

**Review carefully:**
- ✅ Creates missing tables
- ✅ Adds missing columns
- ✅ Updates data types
- ⚠️ Check for DROP statements (could lose data)

---

### **Step 3: Test Locally**

```bash
# Start your app locally
npm run dev

# Test all features:
# - Team management
# - Role selection
# - Invoice creation
# - Storage uploads
# etc.
```

**Make sure everything works before deploying!**

---

### **Step 4: Commit and Push**

```bash
# Add migration files
git add prisma/migrations/
git add prisma/schema.prisma

# Commit
git commit -m "feat: sync production schema with local development

- Add all missing tables and columns
- Insert system roles
- Update existing table schemas
- Ensure schema parity between local and production"

# Push to GitHub
git push origin main
```

---

### **Step 5: Deploy to Production**

Digital Ocean will automatically:
1. Pull the new code
2. Run `npm ci` (install dependencies)
3. Run `npm run build` (which includes `prisma generate`)
4. **Automatically apply migrations** (if configured)

---

### **Step 6: Verify in Production**

```bash
# In production console
cd /workspace/backend

# Check migration status
npx prisma migrate status

# Should show: "Database schema is up to date!"

# Verify tables exist
npx prisma db pull --force --print | grep "model team_"

# Test the API
curl https://your-app.ondigitalocean.app/api/team/roles
```

---

## 🔧 Ensure Automatic Migration Deployment

### **Option 1: Update package.json (Recommended)**

```json
{
  "scripts": {
    "build": "prisma generate && npx swc src -d dist --copy-files",
    "start": "node dist/index.js",
    "postinstall": "prisma generate",
    "deploy": "npm run db:migrate && npm run build",
    "db:migrate": "prisma migrate deploy"
  }
}
```

### **Option 2: Update .do/app.yaml**

```yaml
services:
  - name: backend
    build_command: npm ci && npx prisma migrate deploy && npm run build
    run_command: npm run start
```

This ensures migrations run **before** the build, so your schema is always up to date.

---

## ✅ Benefits of This Approach

### **1. Version Control**
- ✅ All schema changes are in Git
- ✅ Can review changes in pull requests
- ✅ Can rollback if needed

### **2. Reproducibility**
- ✅ Same schema everywhere (local, staging, production)
- ✅ New developers can set up identical database
- ✅ No manual steps required

### **3. Safety**
- ✅ Migrations are tested locally first
- ✅ No surprises in production
- ✅ Can review SQL before applying

### **4. Audit Trail**
- ✅ Every schema change is documented
- ✅ Know when and why changes were made
- ✅ Easy to debug issues

---

## 🎯 Complete Setup (Do This Once)

### **1. Update Your Build Process**

```bash
# Edit backend/package.json
{
  "scripts": {
    "build": "prisma generate && npx swc src -d dist --copy-files",
    "start": "node dist/index.js",
    "postinstall": "prisma generate",
    "deploy": "prisma migrate deploy && npm run build",
    "db:migrate": "prisma migrate deploy"
  }
}
```

### **2. Update Digital Ocean Configuration**

```yaml
# .do/app.yaml
services:
  - name: backend
    # Run migrations before build
    build_command: npm ci && npx prisma migrate deploy && npm run build
    run_command: npm run start
    
    envs:
      - key: DATABASE_URL
        scope: RUN_AND_BUILD_TIME  # Important!
        value: ${db.DATABASE_URL}
```

**Key:** `DATABASE_URL` must have `RUN_AND_BUILD_TIME` scope so migrations can access the database during build.

### **3. Commit These Changes**

```bash
git add backend/package.json .do/app.yaml
git commit -m "feat: automate database migrations in production"
git push origin main
```

---

## 🚀 From Now On: Simple Workflow

### **When You Make Schema Changes:**

```bash
# 1. Edit prisma/schema.prisma
# Add new models, fields, etc.

# 2. Create migration
npx prisma migrate dev --name your_change_description

# 3. Test locally
npm run dev

# 4. Commit and push
git add prisma/
git commit -m "feat: add new feature with schema changes"
git push origin main

# 5. Done! Digital Ocean automatically applies migrations
```

**That's it!** No manual steps in production.

---

## 🔍 Current State Check

Let's verify what's currently different:

```bash
# In production console
cd /workspace/backend

# Pull current production schema
npx prisma db pull --force

# This updates schema.prisma to match production
# Then you can compare with your local schema.prisma
```

---

## 📊 What You Should Do Right Now

### **Step 1: Create Comprehensive Migration**

```bash
# On your local machine
cd backend

# Create migration that includes EVERYTHING
npx prisma migrate dev --name complete_schema_sync

# This will:
# - Compare your schema.prisma with local DB
# - Generate migration for ALL differences
# - Apply to local DB
```

### **Step 2: Add Data Seeding to Migration**

Edit the generated migration file to include system roles:

```bash
# Find the latest migration
ls -t prisma/migrations/ | head -1

# Edit it
code prisma/migrations/XXXXXX_complete_schema_sync/migration.sql
```

Add at the end:

```sql
-- Insert system roles
INSERT INTO team_roles (id, name, description, is_system_role, permissions, can_approve_invoices, approval_limit, requires_approval_from, created_at, updated_at)
VALUES
('role-owner', 'Owner', 'Full system control', true, '{"all": true}'::json, true, NULL, ARRAY[]::text[], NOW(), NOW()),
('role-finance-manager', 'Finance Manager', 'Financial oversight', true, '{"reports": "view", "expenses": "manage", "invoices": "approve", "projects": "view"}'::json, true, 50000, ARRAY[]::text[], NOW(), NOW()),
('role-project-manager', 'Project Manager', 'Project operations', true, '{"reports": "view", "invoices": "create", "projects": "manage"}'::json, false, 1000000, ARRAY[]::text[], NOW(), NOW()),
('role-accountant', 'Accountant', 'Financial records', true, '{"reports": "view", "invoices": "view", "payments": "record"}'::json, false, NULL, ARRAY[]::text[], NOW(), NOW()),
('role-viewer', 'Viewer', 'Read-only access', true, '{"invoices": "view", "projects": "view"}'::json, false, NULL, ARRAY[]::text[], NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

### **Step 3: Test, Commit, Deploy**

```bash
# Test locally
npm run dev
# Verify everything works

# Commit
git add prisma/
git commit -m "feat: complete schema sync with system roles"
git push origin main

# Wait for deployment (5-7 minutes)
# Migrations will apply automatically!
```

---

## ✅ Verification Checklist

After deployment, verify:

```bash
# In production console
cd /workspace/backend

# 1. Check migration status
npx prisma migrate status
# Should show: "Database schema is up to date!"

# 2. Check system roles
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.team_roles.count({where:{is_system_role:true}}).then(c=>console.log('Roles:',c)).finally(()=>p.\$disconnect());"
# Should show: "Roles: 5"

# 3. Test API
curl https://your-app.ondigitalocean.app/api/team/roles
# Should return 5 roles
```

---

## 🎯 Summary

**Best Practice = Prisma Migrate Workflow:**

1. ✅ Edit `schema.prisma` locally
2. ✅ Run `prisma migrate dev` to create migration
3. ✅ Test locally
4. ✅ Commit migration files
5. ✅ Push to GitHub
6. ✅ Automatic deployment applies migrations
7. ✅ Production schema matches local exactly

**This ensures:**
- 🔒 Schema parity (local = production)
- 📝 All changes are versioned
- 🧪 Changes are tested before production
- 🤖 Fully automated deployment
- 🔄 Repeatable and reliable

---

## 🚀 Let's Do It Right

I'll help you set this up properly. Here's what we'll do:

1. Create a comprehensive migration with ALL changes
2. Include system role insertion in the migration
3. Update build process to auto-apply migrations
4. Deploy and verify

This way, you'll have **perfect schema parity** and **zero manual steps** going forward!

Ready to proceed? 🎯

