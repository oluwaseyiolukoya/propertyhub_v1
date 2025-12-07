# 🔍 Verify Database Connection Setup

**Last Updated:** December 6, 2024

## ✅ Confirmed

You have a database named `contrezz` in DigitalOcean.

---

## 🎯 Step-by-Step Verification

### Step 1: Double-Check Environment Variables in DigitalOcean

1. **DigitalOcean** → **Apps** → Your app → **Settings**
2. **Backend** component → **Environment Variables**
3. **Verify these EXACT values:**

**DATABASE_URL** should be:
```
postgresql://doadmin:YOUR_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/contrezz?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20
```

**DIRECT_DATABASE_URL** should be:
```
postgresql://doadmin:YOUR_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require
```

**Check for common mistakes:**
- [ ] No `private-` prefix in hostname
- [ ] Port 25061 for DATABASE_URL
- [ ] Port 25060 for DIRECT_DATABASE_URL
- [ ] Database name is `contrezz` (not `defaultdb`, not `Contrezz-db-pool`)
- [ ] Has `pgbouncer=true&connection_limit=5&pool_timeout=20` in DATABASE_URL

4. **If you made ANY changes:**
   - Click **"Save"** at the bottom
   - The app will auto-redeploy

---

### Step 2: Force Redeploy (If No Changes Made)

If the environment variables are already correct but you're still getting errors:

1. **DigitalOcean** → **Apps** → Your app
2. **Settings** tab
3. Click **"Force Redeploy"** button
4. Wait for deployment to complete

---

### Step 3: Check Connection Pool Settings

1. **DigitalOcean** → **Databases** → Your database
2. Click on **"Connection Pools"** tab
3. Find your pool (probably named `Contrezz-db-pool`)
4. **Verify these settings:**
   - **Database:** Should be `contrezz` (not `defaultdb`)
   - **Mode:** Should be `Transaction` or `Session`
   - **Pool Size:** Should be 20-50

5. **If Database is NOT set to `contrezz`:**
   - Click the **three dots** (⋮) next to the pool
   - Click **"Edit"**
   - Change **Database** to `contrezz`
   - **Save**

---

### Step 4: Verify Deployment Logs

After deploying, check the logs:

1. **DigitalOcean** → **Apps** → Your app
2. **Runtime Logs** tab
3. Look for:
   - ✅ `Datasource "db": PostgreSQL database "contrezz"` (correct!)
   - ❌ `FATAL: no such database: contrezz` (still wrong)

---

## 🎯 If Still Getting "no such database" Error

This means the connection pool might be routing to the wrong database.

### Fix: Update Connection Pool Database

1. **Databases** → Your database → **Connection Pools** tab
2. Find `Contrezz-db-pool`
3. Click **three dots** (⋮) → **Edit**
4. **Database field:** Change to `contrezz`
5. **Save**
6. **Go back to your app** → **Force Redeploy**

---

## ✅ Expected Success Indicators

Once everything is working, you should see:

1. **In logs:**
   ```
   Datasource "db": PostgreSQL database "contrezz", schema "public" at "contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061"
   ```

2. **No errors like:**
   - ❌ `Can't reach database server`
   - ❌ `FATAL: no such database`
   - ❌ `remaining connection slots`

3. **App responds normally:**
   - Login works
   - Data loads
   - No 500 errors

---

## 🆘 Still Not Working?

If you still get "no such database: contrezz" after:
1. ✅ Verifying environment variables
2. ✅ Setting connection pool database to `contrezz`
3. ✅ Force redeploying

**Then the issue might be:**
- Connection pool cached old settings (wait 5 minutes and try again)
- Multiple connection pools exist (check all of them)
- App is using wrong environment variable

**Next steps:**
1. Tell me the error message from the latest logs
2. Screenshot or copy the connection pool settings
3. Verify which DATABASE_URL the app is actually using
