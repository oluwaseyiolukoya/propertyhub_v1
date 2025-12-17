# Quick Guide: Create Admin in Production Database

## You're in psql - Here's What to Do

### Step 1: Exit psql

```sql
\q
```

This exits the PostgreSQL console and returns you to the app container shell.

---

### Step 2: Hash Your Password

Now you're back in the shell. Hash your password:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Korede@1988', 10).then(hash => console.log(hash));"
```

**Output will look like:**
```
$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV
```

**Copy this entire hash** (it's a long string starting with `$2a$` or `$2b$`)

---

### Step 3: Connect Back to Database

```bash
psql $PUBLIC_DATABASE_URL
```

Or if that doesn't work, use the connection string directly:

```bash
psql "postgresql://user:password@host:port/database"
```

---

### Step 4: Insert Admin with Hashed Password

```sql
INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@contrezz.com',
  'Admin User',
  '$2a$10$PASTE_YOUR_HASHED_PASSWORD_HERE',  -- Paste the hash from Step 2
  'admin',
  true,
  NOW(),
  NOW()
);
```

**Replace `$2a$10$PASTE_YOUR_HASHED_PASSWORD_HERE` with the actual hash you got in Step 2.**

---

### Step 5: Verify Admin Was Created

```sql
SELECT id, email, name, role, "isActive", "createdAt" FROM public_admins;
```

You should see your new admin user.

---

### Step 6: Exit psql

```sql
\q
```

---

## Complete Example

```bash
# Step 1: Exit psql (if you're in it)
\q

# Step 2: Hash password
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Korede@1988', 10).then(hash => console.log(hash));"
# Output: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

# Step 3: Connect to database
psql $PUBLIC_DATABASE_URL

# Step 4: Insert admin (use the hash from Step 2)
INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@contrezz.com',
  'Admin User',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin',
  true,
  NOW(),
  NOW()
);

# Step 5: Verify
SELECT email, name, role FROM public_admins;

# Step 6: Exit
\q
```

---

## Alternative: Use the Script Instead

If you prefer, you can use the create-admin script directly:

```bash
# Make sure you're in the right directory
cd /workspace/public-backend

# Run the script
npm run create-admin
```

Follow the prompts - it will handle password hashing automatically.

---

## Troubleshooting

### Error: "node: command not found"

**Solution:** The Node.js environment might not be available. Try:

```bash
# Check if node is available
which node

# If not, you might need to use the script method instead
cd /workspace/public-backend
npm run create-admin
```

### Error: "bcryptjs module not found"

**Solution:** Install dependencies first:

```bash
cd /workspace/public-backend
npm install
```

Then try hashing again.

### Error: "relation 'public_admins' does not exist"

**Solution:** Run migrations first:

```bash
cd /workspace/public-backend
npm run migrate:deploy
```

---

## Security Note

⚠️ **Never commit passwords to git!**

The password `Korede@1988` shown in examples is for demonstration only. Use a strong, unique password in production.

---

**Last Updated:** December 15, 2025

