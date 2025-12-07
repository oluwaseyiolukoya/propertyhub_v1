# 🔍 Debug Database Connection String

**Last Updated:** December 6, 2024

## Problem

Still getting: `FATAL: no such database: contrezz`

Even though:

- ✅ Database `contrezz` exists
- ✅ Connection pool is configured correctly
- ✅ Using public network (no `private-` prefix)

---

## 🎯 Debug Steps

### Step 1: Verify What DATABASE_URL the App Is Using

1. **DigitalOcean** → **Apps** → Your app
2. **Console** tab
3. Run this command:

```bash
echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/USER:PASSWORD@/'
```

This will show your DATABASE_URL with password hidden.

**Look for:**

- Hostname (should NOT have `private-` prefix)
- Port (should be `25061`)
- Database name (should be `contrezz` at the end)

**Example of what you should see:**

```
postgresql://USER:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/contrezz?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20
```

---

### Step 2: Test Direct Connection to Database

In the console, try connecting directly:

```bash
echo "SELECT current_database();" | psql "$DATABASE_URL"
```

**Expected output:**

```
 current_database
------------------
 contrezz
(1 row)
```

**If you get an error:** The DATABASE_URL is definitely wrong.

---

### Step 3: Check if Environment Variable Was Saved

1. **DigitalOcean** → **Apps** → Your app
2. **Settings** tab → **Backend** component
3. **Environment Variables**
4. Click on **DATABASE_URL** to expand it
5. **What does it show?** (you can blur the password)

Common issues:

- Old value still showing (not saved)
- Has `private-` prefix still
- Wrong port number
- Wrong database name

---

### Step 4: Force Complete Rebuild

If environment variables look correct but still not working:

1. **Settings** tab
2. Scroll down to **"App-Level Configuration"**
3. Click **"Edit Plan"**
4. Keep everything the same
5. Click **"Back"** then **"Force Rebuild and Redeploy"**

This ensures environment variables are completely refreshed.

---

## 🎯 Common Issues and Fixes

### Issue 1: Case Sensitivity

PostgreSQL database names are case-sensitive!

If your database is actually named `Contrezz` (capital C), use:

```
.../Contrezz?sslmode=require&pgbouncer=true...
```

If it's `contrezz` (lowercase), use:

```
.../contrezz?sslmode=require&pgbouncer=true...
```

**Verify in DigitalOcean:** Databases → Users & Databases tab → look at exact database name spelling

---

### Issue 2: Connection Pool User

The connection pool shows "Username: N/A", which means it uses whatever user is in the connection string.

**Make sure:**

- You're using `doadmin` as the username
- You have the correct password for `doadmin`
- The password doesn't have special characters that need URL encoding

---

### Issue 3: Multiple DATABASE_URL Variables

Sometimes apps have multiple DATABASE_URL variables defined at different levels.

**Check:**

1. Component-level environment variables (Backend component)
2. App-level environment variables
3. Make sure there's only ONE DATABASE_URL

---

### Issue 4: Cached Prisma Client

The Prisma client might be cached with the old connection string.

**Fix:**

```bash
# In DigitalOcean Console
cd /workspace/backend
npx prisma generate
```

Then redeploy.

---

## ✅ Quick Verification Checklist

Run these commands in the DigitalOcean Console to verify everything:

```bash
# 1. Check DATABASE_URL (password hidden)
echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/USER:PASSWORD@/'

# 2. Extract just the database name
echo $DATABASE_URL | grep -oP '/[^/?]+\?' | tr -d '/?'

# 3. Test connection
psql "$DATABASE_URL" -c "SELECT current_database();"

# 4. Check if contrezz database exists
psql "$DATABASE_URL" -c "\l" 2>&1 | grep contrezz || echo "Database not found"
```

---

## 🆘 If Still Not Working

**Send me the output of:**

```bash
echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/USER:PASSWORD@/'
```

And tell me:

1. What's the exact spelling of your database name in DigitalOcean? (capital letters matter!)
2. Did you click "Save" after updating environment variables?
3. Did the app redeploy after saving?

---

## 🎯 Most Likely Solutions

### Solution A: Database Name Case Mismatch

If your database is `Contrezz` (capital C), update DATABASE_URL to:

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/Contrezz?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20
```

### Solution B: Environment Variable Not Saved

1. **Re-enter the DATABASE_URL** in App Settings
2. **Click "Save" at the bottom of the page**
3. **Wait for auto-deploy to complete**
4. **Check logs again**

### Solution C: Force Complete Rebuild

1. **Settings** → **Force Rebuild and Redeploy**
2. Wait for complete build + deploy
3. This ensures environment variables are freshly loaded
