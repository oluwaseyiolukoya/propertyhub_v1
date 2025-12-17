# Create Admin User in DigitalOcean Console

Quick guide for creating the first admin user directly in the DigitalOcean app console.

---

## ✅ Recommended Method: DigitalOcean Console

This is the **easiest** method since the database connection is already configured.

---

## Step-by-Step

### Step 1: Open DigitalOcean Console

1. Go to **DigitalOcean App Platform**
   - https://cloud.digitalocean.com/apps

2. Click on **`contrezz-public-api`** app

3. Click on the **Console** tab (or look for terminal/console icon)

4. This opens a terminal connected to your app environment

---

### Step 2: Navigate to Public Backend Directory

```bash
cd /workspace/public-backend
```

**Note:** The exact path might vary. If `/workspace/public-backend` doesn't exist, try:
- `cd public-backend`
- `cd /app/public-backend`
- `ls` to see what directories are available

---

### Step 3: Verify Environment

Check that `PUBLIC_DATABASE_URL` is set:

```bash
echo $PUBLIC_DATABASE_URL
```

Should show the database connection string. If empty, you may need to set it manually (see troubleshooting).

---

### Step 4: Install Dependencies (if needed)

If `node_modules` doesn't exist:

```bash
npm install
```

---

### Step 5: Run Create Admin Script

```bash
npm run create-admin
```

**Or directly:**

```bash
npx tsx scripts/create-first-admin.ts
```

---

### Step 6: Follow Prompts

The script will ask for:

1. **Email**: `admin@contrezz.com` (or your admin email)
2. **Name**: `Admin User` (or your name)
3. **Password**: Enter a strong password (min 8 characters)
4. **Confirm Password**: Re-enter the password

**Example:**
```
Enter admin email: admin@contrezz.com
Enter admin name: Admin User
Enter admin password: ********
Confirm password: ********
```

---

### Step 7: Verify Success

You should see:

```
✅ Admin user created successfully!

📋 Admin Details:
   ID: abc123...
   Email: admin@contrezz.com
   Name: Admin User
   Role: admin
   Active: true
   Created: 2025-12-15T...

🔑 You can now log in to the admin interface with:
   Email: admin@contrezz.com
   Password: [the password you entered]

🌐 Access the admin interface at:
   Local: http://localhost:5173/admin/login
   Production: https://admin.contrezz.com
```

---

## Alternative: Using Environment Variables

If you want to skip the prompts, you can provide values via environment variables:

```bash
EMAIL=admin@contrezz.com NAME="Admin User" PASSWORD=yourpassword npm run create-admin
```

**Note:** This skips password confirmation, so make sure the password is correct.

---

## Troubleshooting

### Issue: `cd /workspace/public-backend` - No such file or directory

**Solution:**
1. Check current directory: `pwd`
2. List files: `ls -la`
3. Find the public-backend directory: `find . -name "public-backend" -type d`
4. Navigate to it: `cd [path-to-public-backend]`

### Issue: `npm: command not found`

**Solution:**
1. Check if Node.js is installed: `node --version`
2. If not installed, the console might not have Node.js
3. Try using the app's built-in Node.js or contact DigitalOcean support

### Issue: `PUBLIC_DATABASE_URL` is empty

**Solution:**
1. Go to DigitalOcean → `contrezz-public-api` → Settings → Environment Variables
2. Find `PUBLIC_DATABASE_URL`
3. If missing, add it:
   - Go to DigitalOcean → Databases → `contrezz-public-db`
   - Click **"Connection Details"** tab
   - Copy the **Connection String**
   - Add it as `PUBLIC_DATABASE_URL` in app environment variables

### Issue: Script fails with database connection error

**Solution:**
1. Verify `PUBLIC_DATABASE_URL` is correct
2. Check database is running: Go to DigitalOcean → Databases → `contrezz-public-db`
3. Verify network connectivity (database should be in same region as app)
4. Check if database requires SSL: Add `?sslmode=require` to connection string

### Issue: `tsx: command not found`

**Solution:**
1. Install dependencies: `npm install`
2. Or use: `npx tsx scripts/create-first-admin.ts`

### Issue: Script says "Admin with this email already exists"

**Solution:**
- The admin already exists
- Either use a different email
- Or delete the existing admin first (via Prisma Studio or database)

---

## Quick Command Reference

```bash
# Navigate to public backend
cd /workspace/public-backend

# Check environment
echo $PUBLIC_DATABASE_URL

# Install dependencies (if needed)
npm install

# Create admin (interactive)
npm run create-admin

# Create admin (with env vars)
EMAIL=admin@contrezz.com NAME="Admin User" PASSWORD=yourpassword npm run create-admin
```

---

## After Creating Admin

1. ✅ Test login at `https://admin.contrezz.com`
2. ✅ Verify you can access all admin sections
3. ✅ Create additional admins through the interface (if needed)
4. ✅ Test landing page management
5. ✅ Test career management

---

## Security Reminder

- Use a **strong password** (12+ characters, mixed case, numbers, symbols)
- Don't share admin credentials
- Enable 2FA on your email account
- Create additional admins with appropriate roles

---

**Last Updated:** December 15, 2025  
**Status:** Quick reference for DigitalOcean console

