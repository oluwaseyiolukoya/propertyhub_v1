# 🔧 Storage Access Issue - Developer Account

## ❌ **Problem**

You're logged in as a **property developer** but cannot access the storage test page.

---

## 🔍 **Diagnosis**

The storage system requires a `customerId` to work. Let's check if your developer account has one.

### **Step 1: Add Auth Check Route**

Add this to your router:

```typescript
import CheckAuth from "./components/CheckAuth";

<Route path="/check-auth" element={<CheckAuth />} />;
```

### **Step 2: Check Your Auth**

1. Navigate to: `http://localhost:5173/check-auth`
2. Look for "Customer ID" field
3. Check if it shows a UUID or "null"

---

## 🎯 **Solution Options**

### **Option 1: Your Developer Account HAS a customerId** ✅

If `/check-auth` shows you have a `customerId`:

**The storage should work!** Try:

1. Navigate to `/storage-test`
2. If you still get an error, check the browser console
3. Check backend logs for the actual error

---

### **Option 2: Your Developer Account DOESN'T have a customerId** ❌

If `/check-auth` shows `customerId: null`:

#### **Fix A: Update Your Developer Account in Database**

```sql
-- Find your user
SELECT id, email, role, "customerId" FROM users WHERE email = 'your-email@example.com';

-- If you see customerId is NULL, you need to link it to a customer
-- First, find or create a customer account
SELECT id, company, email FROM customers WHERE email = 'your-email@example.com';

-- If customer exists, link your user to it
UPDATE users
SET "customerId" = 'customer-uuid-here'
WHERE email = 'your-email@example.com';

-- If customer doesn't exist, create one first
INSERT INTO customers (id, company, owner, email, "planCategory", status)
VALUES (
  gen_random_uuid(),
  'Your Development Company',
  'Your Name',
  'your-email@example.com',
  'development',
  'active'
)
RETURNING id;

-- Then link your user to the new customer
UPDATE users
SET "customerId" = 'new-customer-uuid-from-above'
WHERE email = 'your-email@example.com';
```

#### **Fix B: Login Again**

After updating the database:

1. Logout from your app
2. Login again
3. Check `/check-auth` to verify `customerId` is now set
4. Try `/storage-test` again

---

### **Option 3: Create a Test Customer Account**

If you don't want to modify your developer account:

```sql
-- Create a test customer
INSERT INTO customers (id, company, owner, email, "planCategory", status, "planId")
VALUES (
  gen_random_uuid(),
  'Test Company',
  'Test User',
  'test-customer@example.com',
  'property_management',
  'active',
  (SELECT id FROM plans WHERE name = 'Starter' LIMIT 1)
)
RETURNING id;

-- Create a test user
INSERT INTO users (id, "customerId", name, email, password, role, "isActive", status)
VALUES (
  gen_random_uuid(),
  'customer-id-from-above',
  'Test Customer',
  'test-customer@example.com',
  '$2b$10$...',  -- You'll need to hash a password
  'property_manager',
  true,
  'active'
);
```

Then login with this test account.

---

## 🔍 **Why This Happens**

In your system:

- **Property Owners/Managers** = Customers with `planCategory = 'property_management'`
- **Property Developers** = Customers with `planCategory = 'development'`
- **Both types** should have a `customerId` in the `users` table

The storage system works for **both** types, but requires the `customerId` to:

1. Isolate files per customer
2. Track storage quota per customer
3. Organize files by customer

---

## ✅ **Quick Test**

After fixing, verify:

```bash
# Test storage quota endpoint
curl -X GET http://localhost:5000/api/storage/quota \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "used": 0,
    "limit": 5368709120,
    "usedFormatted": "0 Bytes",
    "limitFormatted": "5 GB"
  }
}
```

**If you get this, storage is working!** ✅

---

## 🎯 **Recommended Solution**

For your developer account:

1. **Check if customer exists:**

   ```sql
   SELECT * FROM customers WHERE email = 'your-email@example.com';
   ```

2. **If exists, link your user:**

   ```sql
   UPDATE users
   SET "customerId" = (SELECT id FROM customers WHERE email = 'your-email@example.com')
   WHERE email = 'your-email@example.com';
   ```

3. **Logout and login again**

4. **Test storage access**

---

## 📊 **Understanding the Architecture**

```
User (Developer)
    ↓
    customerId (links to →)
    ↓
Customer (Development Company)
    ↓
    storage_used, storage_limit
    ↓
Storage Files in Digital Ocean Spaces
    customers/{customerId}/...
```

**Every user who needs storage must have a `customerId`!**

---

## 🚀 **After Fixing**

Once your developer account has a `customerId`:

1. ✅ Navigate to `/storage-test`
2. ✅ See your storage quota (5 GB default)
3. ✅ Upload test files
4. ✅ View storage statistics
5. ✅ Delete files

**Storage works for both property managers AND developers!** 🎉

---

## 🆘 **Still Not Working?**

Check:

1. Browser console for errors
2. Backend logs: `tail -f /tmp/backend.log`
3. Network tab in DevTools
4. Token has `customerId` field: `/check-auth`
5. Database has `customerId` set: `SELECT * FROM users WHERE email = 'your@email.com'`

---

**The storage system is designed to work for ALL customer types!** 🚀
