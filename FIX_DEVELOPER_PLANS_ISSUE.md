# Fix Developer Plans Not Showing - Complete Guide

## 🔴 Problem

**Issue:** When creating a Developer customer from admin dashboard, no plans are visible in the plan dropdown.

**Root Cause:** The production database has plans with `category = NULL` because:
1. ✅ Prisma schema was updated with `category` field
2. ✅ Migration added the `category` column
3. ❌ **Existing plans still have `category = NULL`** (not updated)
4. ❌ Frontend filters plans by category, so NULL categories don't match

## 🎯 The Solution

We need to update existing plans in production to set their `category` field.

---

## 🚀 Quick Fix (Recommended)

### Option 1: Run the Fix Script (Fastest)

I've created a script that will automatically categorize your plans.

**On your local machine:**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor

# Add and commit the script
git add backend/scripts/fix-production-plan-categories.js FIX_DEVELOPER_PLANS_ISSUE.md
git commit -m "feat: add script to fix plan categories in production"
git push origin main
```

**After DigitalOcean deploys (wait 5-10 minutes), run the script:**

You have two ways to run this:

#### Method A: Using DigitalOcean Console

1. Go to https://cloud.digitalocean.com/apps
2. Click your app
3. Go to "Console" tab
4. Run:
```bash
cd /workspace
node backend/scripts/fix-production-plan-categories.js
```

#### Method B: Using doctl (if installed)

```bash
# Get your app ID
doctl apps list

# Run the script
doctl apps exec <app-id> --command "node backend/scripts/fix-production-plan-categories.js"
```

### Option 2: Manual Database Update (Alternative)

If you can't run the script, update plans manually via Prisma Studio or SQL.

**Connect to production database:**

```bash
# Get your DATABASE_URL from DigitalOcean
# Go to: https://cloud.digitalocean.com/apps → Your App → Settings → Environment Variables

# Run Prisma Studio
DATABASE_URL="your-production-database-url" npx prisma studio
```

**Then update each plan:**

1. Open `plans` table
2. For each **Developer** plan:
   - Set `category` = `development`
   - Set `projectLimit` = `5` (or appropriate value)
   - Set `propertyLimit` = `null`

3. For each **Property** plan:
   - Set `category` = `property_management`
   - Set `propertyLimit` = `5` (or appropriate value)

---

## 📋 How the Script Works

The script automatically:

1. **Identifies Development Plans** by name keywords:
   - "developer", "development", "dev", "project"
   
2. **Identifies Property Plans** by name keywords:
   - "property", "owner", "manager", "management", "basic", "standard", "premium", "enterprise"

3. **Updates Development Plans:**
   - `category` → `'development'`
   - `projectLimit` → `5` (if not set)
   - `propertyLimit` → `null`

4. **Updates Property Plans:**
   - `category` → `'property_management'`
   - `propertyLimit` → `5` (if not set)

5. **Shows Before/After Summary**

---

## ✅ Verification

After running the fix script:

### Test 1: Check Plan Categories

**Using Prisma Studio:**
```bash
DATABASE_URL="your-production-url" npx prisma studio
```

Open `plans` table and verify:
- Development plans have `category = 'development'`
- Property plans have `category = 'property_management'`

### Test 2: Test Customer Creation

1. Go to https://contrezz.com/admin
2. Click "Add Customer"
3. Select **Customer Type: Property Developer**
4. Check the **Plan** dropdown

**Expected Result:** ✅ You should see developer plans (Starter Dev, Pro Dev, etc.)

### Test 3: Check API Response

```bash
# Get plans from API
curl https://api.contrezz.com/api/plans \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected:** Plans should have `"category": "development"` or `"category": "property_management"`

---

## 🔍 Why This Happened

### The Timeline:

1. **Initial Setup:** Plans were created without `category` field (field didn't exist)
2. **Schema Update:** We added `category` field to Prisma schema
3. **Migration:** Database column was added with default value
4. **Problem:** Existing plans kept their NULL values (default only applies to NEW records)
5. **Result:** Frontend filtering fails because `plan.category === 'development'` doesn't match NULL

### The Fix:

Update existing records to have proper category values.

---

## 📝 Frontend Filtering Logic

The frontend filters plans like this:

```typescript
// src/components/AddCustomerPage.tsx line 211-226
const filteredPlans = subscriptionPlans.filter(plan => {
  if (!newCustomer.customerType) return true;

  // If plan has no category, show for all (backward compatibility)
  if (!plan.category || plan.category === null) {
    return true; // ← This is why you might see ALL plans
  }

  if (newCustomer.customerType === 'developer') {
    return plan.category === 'development'; // ← Only shows development plans
  } else {
    return plan.category === 'property_management'; // ← Only shows property plans
  }
});
```

**The Issue:** If `plan.category` is NULL, it shows for ALL customer types, which might be confusing.

**The Fix:** Set proper categories so filtering works correctly.

---

## 🆘 Troubleshooting

### Issue 1: Script Can't Connect to Database

**Error:** `Can't reach database server`

**Solution:** 
- Make sure you're running the script in the DigitalOcean environment (not locally)
- The app has access to the database via the `DATABASE_URL` environment variable

### Issue 2: Still No Plans Showing

**Possible causes:**

1. **Script hasn't run yet**
   - Check: Run the script and verify output

2. **Plans are inactive**
   - Check: `isActive` field in plans table
   - Fix: Set `isActive = true` for plans you want to show

3. **No development plans exist**
   - Check: Do you have any plans with "developer" or "development" in the name?
   - Fix: Create development plans or manually set category

4. **Frontend cache**
   - Fix: Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### Issue 3: Wrong Plans Categorized

**Problem:** The script categorized plans incorrectly based on name

**Solution:** Manually update via Prisma Studio:
```bash
DATABASE_URL="your-url" npx prisma studio
```

---

## 📚 Related Files

- `backend/scripts/fix-production-plan-categories.js` - The fix script
- `backend/prisma/schema.prisma` - Schema with category field
- `src/components/AddCustomerPage.tsx` - Frontend filtering logic (line 211-226)
- `backend/src/routes/plans.ts` - Plans API endpoint

---

## 🎉 Expected Outcome

After running the fix:

1. ✅ Developer customers see only development plans
2. ✅ Property owners/managers see only property management plans
3. ✅ Plans are properly categorized in database
4. ✅ Filtering works correctly
5. ✅ No more confusion about which plan to select

---

## 📞 Need Help?

If the script doesn't work or you need manual assistance:

1. Check the script output for errors
2. Verify database connection
3. Check plan names match the keywords
4. Manually update via Prisma Studio as fallback

---

## ✨ Summary

**Problem:** Plans have `category = NULL` in production
**Solution:** Run the fix script to set proper categories
**Result:** Developer plans show up for developer customers

**Quick Command:**
```bash
# After deploying to DigitalOcean
node backend/scripts/fix-production-plan-categories.js
```

That's it! 🚀

