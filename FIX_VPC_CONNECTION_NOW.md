# 🚨 URGENT: Fix VPC Connection Error

**Last Updated:** December 6, 2024

## Problem

Your app is trying to connect to:

```
private-contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061
```

This is the **VPC (private) network** URL, which won't work unless your app is in the same VPC as the database!

## ✅ Solution: Use Public Network

You need to use the **public network** URL (no `private-` prefix).

---

## 🎯 Steps to Fix (5 Minutes)

### Step 1: Get Public Network Connection Pool URL

1. Go to **DigitalOcean** → **Databases** → Your database
2. Find **Connection Details** section
3. **Toggle from "VPC Network" to "Public Network"** at the top
4. **Flags** dropdown → Select **"Connection pool"**
5. **Copy the connection string**
   - Should look like: `postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/defaultdb?sslmode=require`
   - Note: **No `private-` prefix!**
   - Port is **25061** (connection pool)

### Step 2: Build Correct URLs

Using the connection string you copied, build these two URLs:

#### DATABASE_URL (for app, uses pool):

```
postgresql://doadmin:YOUR_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/contrezz?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20
```

**Changes from default:**

- Database name: `defaultdb` → `contrezz`
- Added: `&pgbouncer=true`
- Added: `&connection_limit=5`
- Added: `&pool_timeout=20`

#### DIRECT_DATABASE_URL (for migrations, direct connection):

```
postgresql://doadmin:YOUR_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require
```

**Changes from default:**

- Port: `25061` → `25060` (direct connection)
- Database name: `defaultdb` → `contrezz`
- No pgbouncer parameters (direct connection doesn't use pool)

### Step 3: Update Environment Variables in DigitalOcean

1. **DigitalOcean** → **Apps** → Your app
2. **Settings** → **Backend** component
3. **Environment Variables**

4. **Update DATABASE_URL:**

   - Click **Edit** on existing `DATABASE_URL`
   - Replace with the new URL from Step 2 (port 25061, with pgbouncer params)
   - **Save**

5. **Update or Add DIRECT_DATABASE_URL:**

   - If it exists, click **Edit**
   - If not, click **Add Environment Variable**
   - Name: `DIRECT_DATABASE_URL`
   - Value: The direct URL from Step 2 (port 25060, no pgbouncer params)
   - **Save**

6. **Click "Save" at the bottom** of the page

7. **Deploy** (or wait for auto-deploy)

### Step 4: Verify After Deploy

Once deployed, check the logs:

1. **Apps** → Your app → **Runtime Logs**
2. Look for:
   - ✅ No more `Can't reach database server at private-...` errors
   - ✅ Successful database queries
   - ✅ App responds to requests

---

## 🔍 Quick Checklist

Before deploying, verify your URLs have:

**DATABASE_URL:**

- [ ] Hostname does NOT start with `private-`
- [ ] Port is `25061` (connection pool)
- [ ] Database name is `contrezz` (not `Contrezz-db-pool` or `defaultdb`)
- [ ] Has `?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20`

**DIRECT_DATABASE_URL:**

- [ ] Hostname does NOT start with `private-`
- [ ] Port is `25060` (direct connection)
- [ ] Database name is `contrezz`
- [ ] Has `?sslmode=require` (no pgbouncer params)

---

## 📊 What Each URL Does

| Variable                | Port  | Purpose             | Uses Pool? |
| ----------------------- | ----- | ------------------- | ---------- |
| **DATABASE_URL**        | 25061 | App runtime queries | ✅ Yes     |
| **DIRECT_DATABASE_URL** | 25060 | Migrations only     | ❌ No      |

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Using VPC URL

```
private-contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com
```

**Fix:** Remove `private-` prefix

### ❌ Mistake 2: Wrong database name

```
.../Contrezz-db-pool?sslmode=require
```

**Fix:** Use `contrezz` not `Contrezz-db-pool`

### ❌ Mistake 3: Missing pgbouncer parameters

```
.../contrezz?sslmode=require
```

**Fix:** Add `&pgbouncer=true&connection_limit=5&pool_timeout=20`

### ❌ Mistake 4: Wrong port for direct connection

```
DIRECT_DATABASE_URL=...@host:25061/contrezz
```

**Fix:** Use port `25060` for DIRECT_DATABASE_URL

---

## ✅ Expected Behavior After Fix

1. **App starts successfully** (no VPC connection errors)
2. **Database queries work** (login, data fetching)
3. **Connection pool manages connections** (no "remaining connection slots" errors)
4. **Migrations can run** (using DIRECT_DATABASE_URL on port 25060)

---

## 🆘 Still Not Working?

If you still see errors after following these steps:

1. **Check the logs for the exact error message**
2. **Verify environment variables are saved** (sometimes DigitalOcean needs you to click "Save" twice)
3. **Ensure deployment completed** (check build logs)
4. **Try restarting the app** (Settings → Force Redeploy)

---

## 📚 Why This Matters

**VPC Network:**

- Private network within DigitalOcean
- Requires app to be in same VPC as database
- More secure but requires VPC configuration

**Public Network:**

- Accessible over internet (with authentication)
- Works immediately without VPC setup
- Still secure (SSL + password protected)

**For now, use Public Network until you properly configure VPC!**

---

**Status:** Critical Fix Required  
**Time to Fix:** 5 minutes  
**Impact:** App cannot connect to database
