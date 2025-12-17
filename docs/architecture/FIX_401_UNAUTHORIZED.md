# Fix 401 Unauthorized Error

## Problem

Getting `401 (Unauthorized)` when trying to login. This means:

- ✅ CORS is fixed (no CORS errors)
- ❌ Authentication is failing (wrong password or hash mismatch)

## Possible Causes

1. **Password hash mismatch** - The hash in database doesn't match the password
2. **Wrong password** - Using different password than what was hashed
3. **Email mismatch** - Email doesn't match exactly (case-sensitive)
4. **Account inactive** - Admin account is deactivated

## Solution: Verify and Fix Password Hash

### Step 1: Check Current Hash in Database

**In PostgreSQL:**

```sql
SELECT email, password FROM public_admins WHERE email = 'admin@contrezz.com';
```

Copy the password hash.

### Step 2: Verify Hash Matches Password

**On your local machine:**

```bash
cd public-backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.compare('Korede@1988', 'PASTE_HASH_FROM_DB').then(result => console.log('Password matches:', result));"
```

Replace `PASTE_HASH_FROM_DB` with the hash from Step 1.

**If it returns `false`:**

- The hash doesn't match the password
- Need to update the hash in database

### Step 3: Update Password Hash (If Needed)

**Option A: Generate New Hash and Update**

1. **Generate new hash:**

   ```bash
   cd public-backend
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Korede@1988', 10).then(hash => console.log(hash));"
   ```

2. **Copy the hash**

3. **Update in database:**
   ```sql
   UPDATE public_admins
   SET password = '$2b$10$NEW_HASH_HERE'
   WHERE email = 'admin@contrezz.com';
   ```

**Option B: Delete and Recreate Admin**

1. **Delete existing admin:**

   ```sql
   DELETE FROM public_admins WHERE email = 'admin@contrezz.com';
   ```

2. **Recreate with correct hash:**
   ```sql
   INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
   VALUES (
     gen_random_uuid(),
     'admin@contrezz.com',
     'Admin User',
     '$2b$10$CofG4lgetxncuwtjj3ykYOerNqiPvwIeuj2XDtzKFgbbRCZb3QDJi',
     'admin',
     true,
     NOW(),
     NOW()
   );
   ```

### Step 4: Verify Account is Active

```sql
SELECT email, "isActive" FROM public_admins WHERE email = 'admin@contrezz.com';
```

Should show `isActive: true` (or `t`).

If `false`, activate it:

```sql
UPDATE public_admins SET "isActive" = true WHERE email = 'admin@contrezz.com';
```

### Step 5: Test Login

1. Go to `https://admin.contrezz.com`
2. Login with:
   - Email: `admin@contrezz.com`
   - Password: `Korede@1988`

---

## Quick Fix: Use Correct Hash

**The correct hash for `Korede@1988` is:**

```
$2b$10$CofG4lgetxncuwtjj3ykYOerNqiPvwIeuj2XDtzKFgbbRCZb3QDJi
```

**Update in database:**

```sql
UPDATE public_admins
SET password = '$2b$10$CofG4lgetxncuwtjj3ykYOerNqiPvwIeuj2XDtzKFgbbRCZb3QDJi'
WHERE email = 'admin@contrezz.com';
```

---

## Verify Everything

**Check admin details:**

```sql
SELECT email, name, role, "isActive", "createdAt"
FROM public_admins
WHERE email = 'admin@contrezz.com';
```

**Verify password hash:**

```bash
# On local machine
cd public-backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.compare('Korede@1988', 'HASH_FROM_DB').then(result => console.log('Matches:', result));"
```

---

## Common Issues

### Issue: Hash from different password

**Problem:** You used a hash generated for a different password.

**Solution:** Generate new hash for `Korede@1988` and update database.

### Issue: Email case mismatch

**Problem:** Email in database is `Admin@Contrezz.com` but you're typing `admin@contrezz.com`.

**Solution:** Use exact email from database, or update email to lowercase:

```sql
UPDATE public_admins SET email = LOWER(email);
```

### Issue: Account inactive

**Problem:** `isActive` is `false`.

**Solution:**

```sql
UPDATE public_admins SET "isActive" = true WHERE email = 'admin@contrezz.com';
```

---

**Last Updated:** December 16, 2025  
**Status:** 401 Unauthorized fix guide

