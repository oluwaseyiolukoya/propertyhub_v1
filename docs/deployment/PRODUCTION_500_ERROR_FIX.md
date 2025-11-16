# Production 500 Error Fix - Quick Summary

## 🔴 The Problem

**Error in Production:**
```
Failed to load resource: the server responded with a status of 500 ()
/api/developer-dashboard/projects
```

**Root Cause:**
The `project_stages` tables don't exist in the production database, but the code tries to use them when creating projects.

---

## ✅ The Solution (3 Simple Steps)

### Step 1: Set Up Your Environment

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# Create .env file if you haven't already
cp .env.example .env

# Edit .env and add your production database password
nano .env
```

Add this line to `.env`:
```env
PROD_DB_URL="postgresql://contrezz_user:YOUR_ACTUAL_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require"
```

### Step 2: Run the Migration Script

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend/scripts

# Run the automated migration script
./migrate-production.sh
```

The script will:
- ✅ Check your environment setup
- ✅ Show you what it will do
- ✅ Ask for confirmation
- ✅ Run the migration
- ✅ Verify the tables were created

### Step 3: Test in Production

1. Go to https://app.contrezz.com
2. Try creating a new project
3. ✅ No more 500 error!

---

## 🚨 Alternative: Manual Migration (If Script Fails)

If the automated script doesn't work, use the DigitalOcean Console:

1. Go to https://cloud.digitalocean.com/databases
2. Click on **contrezz-db-prod**
3. Click **"Console"** tab
4. Copy the contents of `backend/migrations/add_project_stages_system_fixed.sql`
5. Paste into the console
6. Click **"Execute"**

---

## 📋 What Gets Created

The migration creates 3 tables:

1. **`project_stage_templates`** - Templates for different project types
2. **`project_stage_template_items`** - Individual stages in templates
3. **`project_stages`** - Project-specific stages for tracking progress

---

## 🔍 Verify It Worked

After running the migration, check production:

```bash
# Check if tables exist
psql "$PROD_DB_URL" -c "\dt project_*"
```

You should see:
```
 project_stages
 project_stage_template_items
 project_stage_templates
```

---

## 📚 More Details

- **Full Guide:** See `PRODUCTION_MIGRATION_GUIDE.md`
- **Migration Script:** `backend/scripts/migrate-production.sh`
- **SQL File:** `backend/migrations/add_project_stages_system_fixed.sql`

---

## ✅ Success Checklist

- [ ] Created `.env` file with `PROD_DB_URL`
- [ ] Ran migration script (or manual migration)
- [ ] Verified tables exist in production
- [ ] Tested creating a project in production
- [ ] No more 500 errors!

---

**Date:** November 16, 2025  
**Status:** ⏳ Ready to run  
**Estimated Time:** 2-5 minutes

