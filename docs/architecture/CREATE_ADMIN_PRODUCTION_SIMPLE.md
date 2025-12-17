# Create Admin User in Production - Simple Method

## Problem

You're in the DigitalOcean console and:

- `doctl` is not installed
- `tsx` is not found (devDependencies not installed)
- Need to create admin user quickly

## Solution: Use SQL Directly (Easiest)

### Step 1: Hash Password Locally (On Your Machine)

**On your local machine**, run:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Korede@1988', 10).then(hash => console.log(hash));"
```

**Copy the output** - it will look like:

```
$2b$10$lgVZh9qtDNsyvYtRUeKvueOmHQkogOfnPOKM0N410j8DCbFXib2Ze
```

### Step 2: Connect to Production Database

**In DigitalOcean Console:**

1. Go to DigitalOcean → Databases
2. Click on `contrezz-public-db`
3. Click **"Connection Details"** or **"Console"**
4. Or use the connection string provided

**Or use psql from DigitalOcean Console:**

If you have database connection details, you can connect directly.

### Step 3: Run SQL Insert (Correct Syntax)

**In the PostgreSQL prompt**, run this SQL (replace the hashed password with the one from Step 1):

```sql
INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@contrezz.com',
  'Admin User',
  '$2b$10$lgVZh9qtDNsyvYtRUeKvueOmHQkogOfnPOKM0N410j8DCbFXib2Ze',
  'admin',
  true,
  NOW(),
  NOW()
);
```

**Important Notes:**

- Don't type "sql" before the INSERT statement
- Just paste the INSERT statement directly
- Replace the password hash with the one you generated in Step 1
- Make sure you're in the correct database (not `defaultdb`, but the actual database name)

### Step 4: Verify

```sql
SELECT id, email, name, role, "isActive" FROM public_admins WHERE email = 'admin@contrezz.com';
```

Should return your admin user.

---

## Alternative: Fix the npm Script Issue

If you want to use the script instead:

### Step 1: Install Dependencies

**In DigitalOcean Console:**

```bash
cd /workspace/public-backend
npm install
```

This will install all dependencies including `tsx`.

### Step 2: Run Create Admin Script

```bash
npm run create-admin
```

Follow the prompts.

---

## Quick Reference

**Hash Password (Local Machine):**

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 10).then(hash => console.log(hash));"
```

**SQL Insert (Production Database):**

```sql
INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@contrezz.com',
  'Admin User',
  'PASTE_HASHED_PASSWORD_HERE',
  'admin',
  true,
  NOW(),
  NOW()
);
```

**Verify:**

```sql
SELECT * FROM public_admins WHERE email = 'admin@contrezz.com';
```

---

## Common Errors Fixed

### Error: "syntax error at or near 'sql'"

**Problem:** You typed "sql" before the INSERT statement.

**Solution:** Don't type "sql". Just paste the INSERT statement directly in the PostgreSQL prompt.

### Error: "tsx: not found"

**Problem:** `tsx` is in devDependencies and not installed in production.

**Solution:**

- Option 1: Run `npm install` first (installs all dependencies)
- Option 2: Use SQL method directly (recommended)

### Error: "doctl: command not found"

**Problem:** `doctl` CLI is not installed in DigitalOcean console.

**Solution:** Use the DigitalOcean web console to access database, or use SQL directly.

---

## Step-by-Step: Complete Process

### On Your Local Machine:

1. **Hash the password:**

   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Korede@1988', 10).then(hash => console.log(hash));"
   ```

   **Output:** Copy the hash (starts with `$2b$10$...`)

### In DigitalOcean Database Console:

2. **Connect to database:**

   - DigitalOcean → Databases → `contrezz-public-db`
   - Click "Console" or use connection details

3. **Make sure you're in the right database:**

   ```sql
   \c contrezz_public
   ```

   (Or whatever your database name is - check the connection string)

4. **Insert admin:**

   ```sql
   INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
   VALUES (
     gen_random_uuid(),
     'admin@contrezz.com',
     'Admin User',
     'PASTE_YOUR_HASH_HERE',
     'admin',
     true,
     NOW(),
     NOW()
   );
   ```

5. **Verify:**
   ```sql
   SELECT email, name, role, "isActive" FROM public_admins;
   ```

### Test Login:

6. **Go to:** `https://admin.contrezz.com`
7. **Login with:**
   - Email: `admin@contrezz.com`
   - Password: `Korede@1988`

---

## Database Name Check

If you're in `defaultdb` but need to be in the actual database:

```sql
-- List databases
\l

-- Connect to correct database
\c contrezz_public
-- or
\c contrezz_public_db
-- (check your connection string for exact name)
```

---

**Last Updated:** December 15, 2025  
**Status:** Simple production admin creation guide

