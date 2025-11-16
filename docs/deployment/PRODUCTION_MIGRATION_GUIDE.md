# Production Migration Guide - Fix 500 Error on Project Creation

## 🔴 Problem

Getting 500 error when creating projects in production because the `project_stages` tables don't exist in the production database.

**Error:**
```
Failed to load resource: the server responded with a status of 500 ()
/api/developer-dashboard/projects
```

---

## ✅ Solution

Run the project stages migration on the production database.

---

## 🚀 Quick Fix (Recommended)

### Option 1: Using Prisma Migrate (Safest)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# 1. Create a proper Prisma migration
npx prisma migrate dev --name add_project_stages_system --create-only

# This will create a new migration file in prisma/migrations/
# Copy the SQL from backend/migrations/add_project_stages_system_fixed.sql
# into the new migration.sql file

# 2. Deploy to production
# Set your production database URL
export DATABASE_URL="postgresql://contrezz_user:YOUR_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require"

# Deploy the migration
npx prisma migrate deploy
```

### Option 2: Direct SQL Execution (Faster)

```bash
# 1. Load your production database URL from .env
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
source .env  # or manually export PROD_DB_URL

# 2. Run the migration SQL directly
psql "$PROD_DB_URL" < migrations/add_project_stages_system_fixed.sql
```

### Option 3: Using DigitalOcean Console (No Local Setup Needed)

1. Go to https://cloud.digitalocean.com/databases
2. Click on **contrezz-db-prod**
3. Click **"Console"** tab
4. Copy and paste the contents of `backend/migrations/add_project_stages_system_fixed.sql`
5. Click **"Execute"**

---

## 📋 Step-by-Step Instructions (Option 2 - Recommended)

### Step 1: Set Up Environment Variable

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# Create .env if it doesn't exist
cp .env.example .env

# Edit .env and add your production database URL
nano .env
```

Add this line to `.env`:
```env
PROD_DB_URL="postgresql://contrezz_user:YOUR_ACTUAL_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require"
```

### Step 2: Load Environment Variables

```bash
# Load the .env file
export $(cat .env | grep PROD_DB_URL | xargs)

# Verify it's loaded
echo $PROD_DB_URL | sed 's/:.*@/:****@/'  # This hides the password
```

### Step 3: Run the Migration

```bash
# Run the migration
psql "$PROD_DB_URL" < migrations/add_project_stages_system_fixed.sql
```

**Expected Output:**
```
DROP TABLE
DROP TABLE
DROP TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
COMMENT
COMMENT
COMMENT
                          message                          
-----------------------------------------------------------
 Project Stages System tables created successfully!
(1 row)
```

### Step 4: Verify Tables Were Created

```bash
# Check if tables exist
psql "$PROD_DB_URL" -c "\dt project_*"
```

**Expected Output:**
```
                     List of relations
 Schema |             Name              | Type  |     Owner      
--------+-------------------------------+-------+----------------
 public | project_stages                | table | contrezz_user
 public | project_stage_template_items  | table | contrezz_user
 public | project_stage_templates       | table | contrezz_user
```

### Step 5: Test in Production

1. Go to your production app: https://app.contrezz.com
2. Try creating a new project
3. The 500 error should be gone! ✅

---

## 🔍 Troubleshooting

### Error: "psql: command not found"

Install PostgreSQL client:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### Error: "connection refused" or "timeout"

Your IP might not be whitelisted in DigitalOcean. Use **Option 3** (DigitalOcean Console) instead.

### Error: "relation already exists"

The tables might already exist. Check with:
```bash
psql "$PROD_DB_URL" -c "SELECT tablename FROM pg_tables WHERE tablename LIKE 'project_stage%';"
```

If tables exist but you're still getting errors, check if they have the correct schema:
```bash
psql "$PROD_DB_URL" -c "\d project_stages"
```

---

## 📝 What This Migration Does

1. **Drops old tables** (if they exist from failed attempts)
2. **Creates 3 new tables:**
   - `project_stage_templates` - Predefined stage templates (e.g., "Residential Construction")
   - `project_stage_template_items` - Individual stages within templates
   - `project_stages` - Project-specific stages for tracking progress
3. **Creates indexes** for better query performance
4. **Adds foreign key constraints** to maintain data integrity

---

## 🎯 Why This Happened

The `project_stages` feature was developed locally and the schema was updated in `backend/prisma/schema.prisma`, but:

1. ❌ No Prisma migration was created (`npx prisma migrate dev`)
2. ❌ The manual SQL migration wasn't run on production
3. ✅ It worked locally because we ran the SQL manually on the local database

**Best Practice Going Forward:**
Always create Prisma migrations for schema changes:
```bash
npx prisma migrate dev --name descriptive_name
npx prisma migrate deploy  # For production
```

---

## 🔒 Security Note

Remember to:
- ✅ Use `.env` files for database credentials
- ✅ Never commit `.env` files to git
- ✅ Use `YOUR_PASSWORD` placeholders in documentation
- ✅ Rotate credentials if they were exposed

---

## ✅ Verification Checklist

After running the migration:

- [ ] Tables created successfully (check with `\dt project_*`)
- [ ] Can create a new project in production without 500 error
- [ ] Project stages appear in the project dashboard
- [ ] Can mark stages as complete/incomplete
- [ ] Progress bar updates correctly

---

## 📞 Need Help?

If you encounter issues:

1. Check the production logs for detailed error messages
2. Verify your database connection string is correct
3. Ensure your IP is whitelisted in DigitalOcean (if using direct connection)
4. Try using the DigitalOcean Console (Option 3) as a fallback

---

**Date:** November 16, 2025  
**Migration File:** `backend/migrations/add_project_stages_system_fixed.sql`  
**Status:** ⏳ Pending - Needs to be run on production

