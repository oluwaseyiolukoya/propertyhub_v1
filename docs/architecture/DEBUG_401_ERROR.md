# Debug 401 Unauthorized Error

## Problem

Still getting 401 error after updating password hash. Need to debug further.

## Debug Steps

### Step 1: Verify Database Data

**In PostgreSQL, check exact values:**

```sql
SELECT 
  email, 
  name, 
  role, 
  "isActive",
  LEFT(password, 20) as password_start
FROM public_admins 
WHERE email = 'admin@contrezz.com';
```

**Check:**
- Email is exactly `admin@contrezz.com` (lowercase)
- `isActive` is `true` (or `t`)
- Password hash starts with `$2b$10$`

### Step 2: Check Backend Logs

**In DigitalOcean Console:**

```bash
# View recent logs
cd /workspace/public-backend
# Or check DigitalOcean → App → Runtime Logs
```

Look for:
- Authentication errors
- Password comparison failures
- Email lookup failures

### Step 3: Test Password Hash Directly

**In DigitalOcean Console (NOT in psql):**

```bash
cd /workspace/public-backend
node -e "
const bcrypt = require('bcryptjs');
const hash = '$2b$10$HkDZSw.RcLJAkyCVBf0fU.nI9PvsE7yyPgrlfG3Ay/.WvJZ0XLUzW';
bcrypt.compare('Korede@1988', hash).then(result => {
  console.log('Password matches:', result);
  if (!result) {
    console.log('Hash does not match password!');
  }
});
"
```

Should return `Password matches: true`

### Step 4: Check Email Case Sensitivity

**In PostgreSQL:**

```sql
-- Check exact email (case-sensitive)
SELECT email FROM public_admins WHERE LOWER(email) = 'admin@contrezz.com';
```

If email has different case, update it:
```sql
UPDATE public_admins SET email = LOWER(email) WHERE email = 'admin@contrezz.com';
```

### Step 5: Verify Account is Active

```sql
SELECT email, "isActive" FROM public_admins WHERE email = 'admin@contrezz.com';
```

If `isActive` is `false`, activate it:
```sql
UPDATE public_admins SET "isActive" = true WHERE email = 'admin@contrezz.com';
```

### Step 6: Check JWT Secret (Shouldn't cause 401, but verify)

**In DigitalOcean → App → Settings → Environment Variables:**

Verify `PUBLIC_ADMIN_JWT_SECRET` is set.

If not set, add it:
- Key: `PUBLIC_ADMIN_JWT_SECRET`
- Value: (generate a secure random string, minimum 32 characters)

### Step 7: Restart Backend

After any database changes, restart the backend:

**In DigitalOcean:**
1. Go to App → `contrezz-public-api`
2. Click "Actions" → "Restart"
3. Wait 1-2 minutes

### Step 8: Test API Directly

**Using curl (from your local machine or DigitalOcean console):**

```bash
curl -X POST https://api.contrezz.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@contrezz.com","password":"Korede@1988"}' \
  -v
```

This will show the exact error response from the backend.

---

## Common Issues

### Issue: Email Case Mismatch

**Problem:** Database has `Admin@Contrezz.com` but you're sending `admin@contrezz.com`

**Solution:**
```sql
UPDATE public_admins SET email = LOWER(email);
```

### Issue: Password Hash Not Updated

**Problem:** UPDATE didn't actually change the password

**Solution:** Verify the hash:
```sql
SELECT password FROM public_admins WHERE email = 'admin@contrezz.com';
```

Should match: `$2b$10$HkDZSw.RcLJAkyCVBf0fU.nI9PvsE7yyPgrlfG3Ay/.WvJZ0XLUzW`

### Issue: Account Inactive

**Problem:** `isActive` is `false`

**Solution:**
```sql
UPDATE public_admins SET "isActive" = true WHERE email = 'admin@contrezz.com';
```

### Issue: Backend Cache

**Problem:** Backend might be caching old data

**Solution:** Restart the backend app in DigitalOcean

---

## Complete Verification Query

**Run this in PostgreSQL to check everything:**

```sql
SELECT 
  id,
  email,
  name,
  role,
  "isActive",
  "createdAt",
  CASE 
    WHEN password LIKE '$2b$10$HkDZSw%' THEN 'Hash matches expected'
    ELSE 'Hash does NOT match'
  END as hash_status
FROM public_admins 
WHERE LOWER(email) = 'admin@contrezz.com';
```

---

## Next Steps

1. Run the verification query above
2. Check backend logs for detailed error messages
3. Test API directly with curl
4. Restart backend if needed
5. Verify all environment variables are set

---

**Last Updated:** December 16, 2025  
**Status:** Debug guide for 401 errors

