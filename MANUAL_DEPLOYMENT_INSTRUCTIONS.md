# Manual Deployment Instructions - Prisma Schema Fix

## 🔴 Issue Fixed

**Problem:** Customer creation fails with 500 error in production  
**Root Cause:** Prisma schema missing fields that code tries to write to  
**Status:** ✅ Fixed locally, needs deployment

---

## 📦 What Was Fixed

### Files Changed:
1. **backend/prisma/schema.prisma** - Added missing fields
2. **CUSTOMER_CREATION_500_FIX.md** - Documentation

### Fields Added to `customers` model:
- `planCategory` (String?) - Customer's plan category
- `projectLimit` (Int?) - Project limit for developers
- `projectsCount` (Int) - Count of projects

### Fields Added/Modified in `plans` model:
- `category` (String) - Plan category (property_management/development)
- `projectLimit` (Int?) - Project limit for development plans
- `propertyLimit` (Int?) - Made nullable

---

## 🚀 Deployment Steps

### Step 1: Commit and Push Changes

Run these commands in your terminal:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Stage the files
git add backend/prisma/schema.prisma CUSTOMER_CREATION_500_FIX.md MANUAL_DEPLOYMENT_INSTRUCTIONS.md deploy-schema-fix.sh

# Commit
git commit -m "fix: add missing fields to Prisma schema for customer creation"

# Push to main
git push origin main
```

### Step 2: Deploy to Production

SSH to your production server and run:

```bash
# Navigate to your app directory
cd /path/to/your/app

# Pull latest changes
git pull origin main

# Navigate to backend
cd backend

# Regenerate Prisma Client with new schema
npx prisma generate

# Go back to root
cd ..

# Restart backend
pm2 restart backend

# Check logs
pm2 logs backend --lines 50
```

---

## ✅ Verification

After deployment, test customer creation:

1. Go to Admin Dashboard
2. Click "Add Customer"
3. Fill in details:
   - Company name
   - Owner name
   - Email
   - Select a plan
4. Click "Send Invitation"

**Expected Result:** ✅ Customer created successfully (201 response)

---

## 🔍 What to Look For in Logs

### Success Indicators:
```
✔ Generated Prisma Client
📧 Initializing email transporter
Plan category: development (or property_management)
Property limit: 5 (or 0 for developers)
Project limit: 3 (or 0 for property owners)
✅ Customer created successfully
```

### If You See Errors:
```
❌ Prisma Client validation error
❌ Unknown field: planCategory
```

**Solution:** Make sure you ran `npx prisma generate` after pulling changes

---

## 📋 Quick Reference

### Local Commands (Already Done):
- ✅ Updated schema.prisma
- ✅ Regenerated Prisma Client locally
- ⏳ Need to commit and push

### Production Commands (To Do):
```bash
git pull origin main
cd backend && npx prisma generate && cd ..
pm2 restart backend
```

---

## 🆘 Troubleshooting

### Issue 1: "Unknown field" Error
**Cause:** Prisma Client not regenerated  
**Fix:** `cd backend && npx prisma generate`

### Issue 2: Still Getting 500 Error
**Cause:** Backend not restarted  
**Fix:** `pm2 restart backend`

### Issue 3: Migration Error
**Cause:** Database doesn't have columns  
**Fix:** The migration already exists and was applied. Just regenerate client.

---

## 📚 Related Documentation

- `CUSTOMER_CREATION_500_FIX.md` - Detailed explanation of the fix
- `PRODUCTION_SMTP_FIX_SUMMARY.md` - Previous SMTP fix
- `backend/prisma/migrations/20251109190000_add_missing_customer_plan_fields/migration.sql` - Migration file

---

## ✨ Summary

**What happened:**
- Migration was created and applied to database ✅
- But schema.prisma was never updated ❌
- Prisma Client generated from old schema ❌
- Code tried to use fields that don't exist in Prisma Client ❌

**What we fixed:**
- Updated schema.prisma to match database ✅
- Regenerated Prisma Client ✅
- Now code and schema are in sync ✅

**Next step:**
- Deploy to production 🚀

