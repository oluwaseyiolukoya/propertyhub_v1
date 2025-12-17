# Production Admin User Setup

## Answer to Your Questions

### 1. Do I need to add `api.contrezz.com` in DigitalOcean?

**Yes!** You need to add the custom domain `api.contrezz.com` in the `contrezz-public-api` app in DigitalOcean. This is required for:

- SSL certificate provisioning
- Custom domain routing
- Proper API access

**Steps:**
1. Go to DigitalOcean → `contrezz-public-api` app
2. Settings → Domains
3. Click "Add Domain"
4. Enter: `api.contrezz.com`
5. Wait 5-10 minutes for SSL certificate

**After adding:**
- DigitalOcean will automatically provision an SSL certificate
- The domain will be accessible via HTTPS
- DNS must already point to the app (via Namecheap CNAME)

---

### 2. Will Local Admin User Work in Production?

**No!** Local and production use **separate databases**, so you need to create the admin user separately in production.

**Why:**
- Local development uses: `PUBLIC_DATABASE_URL` (local PostgreSQL)
- Production uses: `PUBLIC_DATABASE_URL` (DigitalOcean managed database)
- These are completely separate databases
- Users created locally are NOT synced to production

---

## Creating Admin User in Production

### Method 1: Using DigitalOcean Console (Recommended)

**Step 1: Connect to Production Database**

You can run the create-admin script against the production database by setting the production `PUBLIC_DATABASE_URL`.

**Option A: Using DigitalOcean Console (One-Click Terminal)**

1. Go to DigitalOcean → `contrezz-public-api` app
2. Click on the **Console** tab (or use the terminal icon)
3. This opens a terminal connected to your app environment

**Option B: Using Local Machine with Production Database URL**

1. Get production database connection string from DigitalOcean:
   
   **Method 1: DigitalOcean Web Console (Easiest)**
   - Go to DigitalOcean → Databases → `contrezz-public-db`
   - Click **"Connection Details"** or **"Connection Pools"** tab
   - Copy the **Connection String** (starts with `postgresql://`)
   - It will look like: `postgresql://doadmin:password@host:port/database?sslmode=require`
   
   **Method 2: From App Environment Variables**
   - Go to DigitalOcean → `contrezz-public-api` app
   - Settings → Environment Variables
   - Find `PUBLIC_DATABASE_URL` (it's a SECRET, so click to reveal)
   - Copy the connection string
   
   **Method 3: Using doctl (Local Machine Only)**
   ```bash
   # Install doctl on your local machine first
   # macOS: brew install doctl
   # Then authenticate: doctl auth init
   doctl databases connection contrezz-public-db --format ConnectionString
   ```

2. Run the script with production database:
   ```bash
   cd public-backend
   PUBLIC_DATABASE_URL="postgresql://user:password@host:port/database" npm run create-admin
   ```
   
   **Note:** Replace the connection string with the actual one from DigitalOcean

**Step 2: Run Create Admin Script**

```bash
cd public-backend
npm run create-admin
```

Follow the prompts:
- Email: `admin@contrezz.com` (or your admin email)
- Name: `Admin User` (or your name)
- Password: (choose a strong password)
- Confirm Password: (re-enter)

---

### Method 2: Using Prisma Studio (Production Database)

**Step 1: Get Production Database Connection String**

**From DigitalOcean Web Console:**
1. Go to DigitalOcean → Databases → `contrezz-public-db`
2. Click **"Connection Details"** tab
3. Copy the **Connection String** (starts with `postgresql://`)

**Or from App Environment Variables:**
1. Go to DigitalOcean → `contrezz-public-api` app
2. Settings → Environment Variables
3. Find `PUBLIC_DATABASE_URL` (click to reveal if it's a SECRET)

**Step 2: Set Environment Variable**

```bash
export PUBLIC_DATABASE_URL="postgresql://user:password@host:port/database"
```

**Step 2: Open Prisma Studio**

```bash
cd public-backend
npm run prisma:studio
```

**Step 3: Create Admin Manually**

1. Navigate to `public_admins` table
2. Click "Add record"
3. Fill in:
   - `email`: Your admin email
   - `name`: Admin name
   - `password`: **Hash first** (see below)
   - `role`: `admin`
   - `isActive`: `true`
4. Save

**Step 4: Hash Password**

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 10).then(hash => console.log(hash));"
```

Copy the hashed password and paste it in Prisma Studio.

---

### Method 3: Direct SQL (Advanced)

**Step 1: Get Production Database Connection String**

**From DigitalOcean Web Console:**
1. Go to DigitalOcean → Databases → `contrezz-public-db`
2. Click **"Connection Details"** tab
3. Copy the connection details:
   - Host
   - Port
   - Database name
   - Username
   - Password (click to reveal)

**Or get full connection string:**
- Go to DigitalOcean → Databases → `contrezz-public-db`
- Click **"Connection Details"** → Copy **Connection String**

**Step 2: Connect to Database**

Using `psql` (if installed locally):
```bash
psql "postgresql://user:password@host:port/database?sslmode=require"
```

Or use DigitalOcean's built-in database console:
- Go to DigitalOcean → Databases → `contrezz-public-db`
- Click **"Console"** tab (if available)

**Step 2: Exit psql and Hash Password**

You need to exit the PostgreSQL console first, then hash the password:

```bash
# Exit psql
\q

# Now hash the password (you're back in the app container shell)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 10).then(hash => console.log(hash));"
```

**Copy the hashed password** (it will be a long string starting with `$2a$` or `$2b$`)

**Step 3: Go Back to psql and Insert Admin**

```bash
# Connect to database again
psql $PUBLIC_DATABASE_URL
```

Then run the INSERT with the **hashed password**:

```sql
INSERT INTO public_admins (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@contrezz.com',
  'Admin User',
  '$2a$10$YOUR_HASHED_PASSWORD_FROM_STEP_2',  -- Paste the hashed password here
  'admin',
  true,
  NOW(),
  NOW()
);
```

**Important:** Never use the plain password in SQL! Always use the hashed version.

---

## Recommended Production Setup

### Step 1: Add Domain in DigitalOcean

1. DigitalOcean → `contrezz-public-api` → Settings → Domains
2. Add: `api.contrezz.com`
3. Wait for SSL certificate (5-10 minutes)

### Step 2: Create First Admin

**Easiest Method: Use DigitalOcean Console**

1. DigitalOcean → `contrezz-public-api` app
2. Go to **Console** tab (or use terminal)
3. The `PUBLIC_DATABASE_URL` environment variable is already set
4. Run:
   ```bash
   cd /workspace/public-backend
   npm run create-admin
   ```
5. Follow prompts to create admin

**Alternative: Use Local Machine**

1. Get production database connection string:
   - Go to DigitalOcean → Databases → `contrezz-public-db`
   - Click **"Connection Details"** tab
   - Copy the **Connection String**
   - Or get from: DigitalOcean → `contrezz-public-api` → Settings → Environment Variables → `PUBLIC_DATABASE_URL`
   
2. Set environment variable:
   ```bash
   export PUBLIC_DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   ```
   
3. Run script:
   ```bash
   cd public-backend
   npm run create-admin
   ```

### Step 3: Test Login

1. Go to `https://admin.contrezz.com`
2. Enter credentials:
   - Email: The email you used
   - Password: The password you set
3. Should successfully log in

---

## Security Best Practices

### For Production Admin:

1. **Strong Password:**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Unique password (not used elsewhere)

2. **Secure Email:**
   - Use a professional email address
   - Ensure email account is secure (2FA enabled)

3. **First Admin:**
   - Should have `role: "admin"` for full access
   - Can create additional admins through the interface

4. **Additional Admins:**
   - Create through admin interface after logging in
   - Assign appropriate roles (`admin`, `editor`, `viewer`)

---

## Verification Checklist

After creating production admin:

- [ ] `api.contrezz.com` is added in DigitalOcean → `contrezz-public-api` → Settings → Domains
- [ ] SSL certificate is active/valid for `api.contrezz.com`
- [ ] Admin user created in production database
- [ ] Can log in at `https://admin.contrezz.com`
- [ ] Can access all admin sections
- [ ] Can create additional admins (if needed)

---

## Troubleshooting

### Issue: Can't Connect to Production Database

**Solution:**
1. Verify `PUBLIC_DATABASE_URL` is correct
2. Check database is running in DigitalOcean
3. Verify network connectivity
4. Check firewall rules (if applicable)

### Issue: Script Fails in DigitalOcean Console

**Solution:**
1. Ensure you're in the correct directory: `/workspace/public-backend`
2. Check if `node_modules` exists (may need to run `npm install`)
3. Verify `PUBLIC_DATABASE_URL` is set in environment variables
4. Check app logs for errors

### Issue: Admin Created But Can't Log In

**Solution:**
1. Verify password was hashed correctly
2. Check `isActive` is set to `true`
3. Verify email matches exactly (case-sensitive)
4. Check backend logs for authentication errors
5. Verify JWT secret is set correctly in production

---

## Quick Reference

**Add Domain:**
```
DigitalOcean → contrezz-public-api → Settings → Domains → Add api.contrezz.com
```

**Create Admin (DigitalOcean Console):**
```bash
cd /workspace/public-backend
npm run create-admin
```

**Create Admin (Local with Production DB):**
```bash
export PUBLIC_DATABASE_URL="postgresql://..."
cd public-backend
npm run create-admin
```

**Test Login:**
```
https://admin.contrezz.com
```

---

## Summary

✅ **Yes**, add `api.contrezz.com` in DigitalOcean → `contrezz-public-api` → Settings → Domains

❌ **No**, local admin users do NOT work in production (separate databases)

✅ **Create admin separately in production** using one of the methods above

---

**Last Updated:** December 15, 2025  
**Status:** Production admin setup guide

