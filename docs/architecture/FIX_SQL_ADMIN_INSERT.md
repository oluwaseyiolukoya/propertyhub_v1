# Fix SQL Admin Insert Error

## Problem

You're getting a syntax error because you're typing `sql` before the INSERT statement. In PostgreSQL, you just run the SQL directly.

## Solution

### Step 1: Exit SQL Mode (if needed)

If you see `defaultdb=>` or `defaultdb->`, you're already in PostgreSQL. Just run the INSERT directly.

### Step 2: Hash Your Password First

**IMPORTANT:** You need to hash the password BEFORE inserting it. The password `'Korede@1988'` needs to be hashed.

**Option A: Use Node.js (in DigitalOcean Console)**

```bash
# In DigitalOcean console, run:
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Korede@1988', 10).then(hash => console.log(hash));"
```

**Option B: Use the create-admin script (Easier)**

Instead of manual SQL, use the script:

```bash
cd /workspace/public-backend
EMAIL=admin@contrezz.com NAME="Admin User" PASSWORD=Korede@1988 npm run create-admin
```

### Step 3: Run the INSERT Statement

**Remove the `sql` line** - just run the INSERT directly:

```sql
INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@contrezz.com',
  'Admin User',
  '$2b$10$YOUR_HASHED_PASSWORD_HERE',
  'admin',
  true,
  NOW(),
  NOW()
);
```

**Replace `$2b$10$YOUR_HASHED_PASSWORD_HERE`** with the actual hashed password from Step 2.

---

## Recommended: Use the Script Instead

**Easiest method - no manual SQL needed:**

```bash
# In DigitalOcean console
cd /workspace/public-backend
npm run create-admin
```

Then follow the prompts:
- Email: `admin@contrezz.com`
- Name: `Admin User`
- Password: `Korede@1988`
- Confirm: `Korede@1988`

This will automatically:
- Hash the password
- Validate inputs
- Create the admin
- Show confirmation

---

## If You Must Use SQL

### Step 1: Get Hashed Password

Run this in the DigitalOcean console (NOT in psql):

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Korede@1988', 10).then(hash => console.log(hash));"
```

Copy the output (it will look like: `$2b$10$...`)

### Step 2: Run INSERT in PostgreSQL

In your PostgreSQL session (where you see `defaultdb=>`), run:

```sql
INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@contrezz.com',
  'Admin User',
  '$2b$10$PASTE_YOUR_HASHED_PASSWORD_HERE',
  'admin',
  true,
  NOW(),
  NOW()
);
```

**Important:**
- Don't type `sql` before the INSERT
- Replace `$2b$10$PASTE_YOUR_HASHED_PASSWORD_HERE` with the actual hash from Step 1
- Make sure the hash is in single quotes: `'$2b$10$...'`

---

## Common Errors

### Error: "syntax error at or near 'sql'"

**Cause:** You typed `sql` before the INSERT statement.

**Fix:** Remove `sql` - just run the INSERT directly.

### Error: "password is not hashed"

**Cause:** You're using plain text password instead of hash.

**Fix:** Hash the password first using the Node.js command above.

### Error: "relation 'public_admins' does not exist"

**Cause:** You're in the wrong database or migrations haven't run.

**Fix:**
1. Verify you're in the correct database
2. Check migrations: `npx prisma migrate status`
3. Run migrations if needed: `npx prisma migrate deploy`

---

## Quick Reference

**Recommended Method (Easiest):**
```bash
cd /workspace/public-backend
npm run create-admin
```

**Manual SQL Method:**
1. Hash password: `node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Korede@1988', 10).then(hash => console.log(hash));"`
2. Copy hash
3. Run INSERT in PostgreSQL (without `sql` prefix)

---

**Last Updated:** December 15, 2025

