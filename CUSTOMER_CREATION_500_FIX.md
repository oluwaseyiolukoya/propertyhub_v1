# Customer Creation 500 Error - Root Cause & Fix

## 🔴 Problem

**Error:** `POST api.contrezz.com/api/customers → 500 (Internal Server Error)`

**Symptom:** Unable to create customers in production after deploying the SMTP fix.

## 🎯 Root Cause Identified

The **Prisma schema was missing required fields** that the customer creation code was trying to write to:

### Missing Fields in `customers` model:
- `planCategory` (String?)
- `projectLimit` (Int?)
- `projectsCount` (Int)

### Missing Fields in `plans` model:
- `category` (String)
- `projectLimit` (Int?)
- `propertyLimit` should be nullable (Int?)

### What Happened:

1. ✅ Migration file was created: `20251109190000_add_missing_customer_plan_fields/migration.sql`
2. ✅ Migration was run on the database (columns exist)
3. ❌ **Prisma schema.prisma was NEVER updated** with these fields
4. ❌ Prisma Client was generated from the OLD schema (without these fields)
5. ❌ Code tries to write to fields that Prisma Client doesn't know about
6. ❌ **Result: 500 error**

### The Code Trying to Write These Fields:

```typescript
// backend/src/routes/customers.ts line 309-340
const customer = await prisma.customers.create({
  data: {
    // ... other fields
    planCategory: planCategory,        // ❌ Field not in schema!
    projectLimit: finalProjectLimit,   // ❌ Field not in schema!
    projectsCount: plan?.category === "development" ? properties || 0 : 0, // ❌ Field not in schema!
    // ...
  }
});
```

## ✅ The Fix

### 1. Updated `customers` Model in schema.prisma

**Added:**
```prisma
model customers {
  // ... existing fields
  planCategory    String?  // 'property_management' | 'development'
  projectLimit    Int?     // For developer plans
  projectsCount   Int      @default(0)
  // ... rest of fields
}
```

### 2. Updated `plans` Model in schema.prisma

**Added/Modified:**
```prisma
model plans {
  // ... existing fields
  category        String   @default("property_management") // 'property_management' | 'development'
  propertyLimit   Int?     // Made nullable for development plans
  projectLimit    Int?     // For development plans
  // ... rest of fields
}
```

## 📋 Deployment Steps

### Step 1: Regenerate Prisma Client

```bash
cd backend
npx prisma generate
```

This will generate a new Prisma Client with the updated schema fields.

### Step 2: Verify Migration Already Exists

The migration file already exists and was run:
```
backend/prisma/migrations/20251109190000_add_missing_customer_plan_fields/migration.sql
```

The database columns already exist, so **no new migration is needed**.

### Step 3: Restart Backend

```bash
# If using PM2
pm2 restart backend

# If using systemd
sudo systemctl restart backend

# If running manually
# Kill the old process and start fresh
```

### Step 4: Test Customer Creation

1. Go to Admin Dashboard
2. Click "Add Customer"
3. Fill in customer details
4. Select a plan
5. Click "Send Invitation"
6. **Expected:** ✅ Customer created successfully (201 response)

## 🔍 Why This Happened

This is a **schema drift** issue:

1. Migration SQL was created manually
2. Migration was applied to database
3. **But schema.prisma was not updated to match**
4. Prisma Client was generated from outdated schema
5. Runtime code expects fields that Prisma Client doesn't know about

## 🛡️ Prevention

To prevent this in the future:

### Option 1: Use Prisma Migrate (Recommended)

```bash
# 1. Update schema.prisma first
# 2. Then create migration
npx prisma migrate dev --name add_customer_fields

# This ensures schema and migration stay in sync
```

### Option 2: If Creating Manual Migrations

```bash
# 1. Create migration SQL file
# 2. Update schema.prisma to match
# 3. Run migration
npx prisma migrate deploy

# 4. Generate Prisma Client
npx prisma generate
```

**Always ensure schema.prisma matches the database schema!**

## 📊 Verification Checklist

After deploying the fix:

- [ ] Prisma schema updated with new fields
- [ ] Prisma Client regenerated (`npx prisma generate`)
- [ ] Backend restarted
- [ ] Can create Property Owner customers
- [ ] Can create Property Manager customers
- [ ] Can create Property Developer customers
- [ ] Plans are visible and selectable
- [ ] No 500 errors in console
- [ ] Customer appears in admin dashboard

## 🧪 Test Cases

### Test 1: Create Property Owner
- Customer Type: Property Owner
- Plan: Any property management plan
- Expected: ✅ Customer created with propertyLimit set

### Test 2: Create Property Developer
- Customer Type: Property Developer
- Plan: Any development plan
- Expected: ✅ Customer created with projectLimit set

### Test 3: Create with Email Invitation
- Check "Send Invitation Email"
- Expected: ✅ Customer created (email sent or failed gracefully)

## 📝 Files Changed

1. `backend/prisma/schema.prisma` - Added missing fields to customers and plans models
2. `CUSTOMER_CREATION_500_FIX.md` - This documentation

## 🚀 Production Deployment Commands

```bash
# On your local machine
git add backend/prisma/schema.prisma CUSTOMER_CREATION_500_FIX.md
git commit -m "fix: add missing fields to Prisma schema for customer creation"
git push origin main

# On production server
ssh your-production-server
cd /path/to/your/app
git pull origin main
cd backend
npx prisma generate
cd ..
pm2 restart backend

# Verify
pm2 logs backend --lines 50
```

## ✅ Expected Logs After Fix

```
📧 Initializing email transporter with config: { ... }
Creating user with role: developer for customer type: property_developer
Plan category: development
Property limit: 0
Project limit: 3
✅ Customer created successfully
```

## 🎉 Result

After this fix:
- ✅ Customer creation works for all customer types
- ✅ Plans are properly categorized
- ✅ Property limits set for property owners/managers
- ✅ Project limits set for developers
- ✅ No more 500 errors

