# 🔧 Connection Pool Issue - Immediate Fix

**Last Updated:** December 6, 2024

## 🎯 Problem Identified

**Direct connection (port 25060):** ✅ Works perfectly  
**Connection pool (port 25061):** ❌ Fails with "no such database: contrezz"

Even though the DigitalOcean UI shows the pool is configured for database `contrezz`, the pool is **NOT actually routing to it**.

---

## ✅ IMMEDIATE FIX: Use Direct Connection (5 Minutes)

### Step 1: Update DATABASE_URL

1. **DigitalOcean** → **Apps** → Your app → **Settings**
2. **Backend** component → **Environment Variables**
3. **Edit DATABASE_URL**

**Change FROM (broken pool):**

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/contrezz?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20
```

**Change TO (working direct connection):**

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require&connection_limit=5&pool_timeout=20
```

**Changes:**

- Port: `25061` → `25060`
- Removed: `&pgbouncer=true` (not needed for direct connection)
- Keep: `&connection_limit=5&pool_timeout=20` (Prisma will manage connections)

### Step 2: DIRECT_DATABASE_URL Stays Same

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require
```

(Already using port 25060, no changes needed)

### Step 3: Save and Rebuild

1. Click **"Save"** at bottom of page
2. **Settings** tab → **"Force Rebuild and Redeploy"**
3. Wait for deployment to complete
4. **Check Runtime Logs**

### Step 4: Verify Success

You should see in logs:

```
✅ Datasource "db": PostgreSQL database "contrezz", schema "public" at "contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060"
✅ No more "FATAL: no such database" errors
✅ App responds normally
```

---

## ⚠️ Important Notes About Direct Connection

**Pros:**

- ✅ Works immediately
- ✅ Still has connection management (via Prisma)
- ✅ Reliable and stable

**Cons:**

- ⚠️ Uses database's direct connection slots (max 25)
- ⚠️ Less efficient than proper connection pool
- ⚠️ Need to monitor connection usage

**For now:** This is fine for production! DigitalOcean databases can handle 25 direct connections, and with Prisma's `connection_limit=5`, you'll only use 5 per app instance.

---

## 🔧 LONG-TERM FIX: Recreate Connection Pool (Do Later)

Once your app is stable with direct connection, fix the pool:

### Step 1: Delete Broken Pool

1. **DigitalOcean** → **Databases** → Your database
2. **Connection Pools** tab
3. Find `Contrezz-db-pool`
4. Click **three dots** (⋮) → **Delete**
5. Confirm deletion

### Step 2: Create New Pool

1. **Connection Pools** tab → **"Create a Connection Pool"**
2. **Configuration:**
   - **Pool name:** `contrezz-pool` (lowercase, descriptive)
   - **Database:** `contrezz` (select from dropdown - DO NOT type it!)
   - **User:** `doadmin` (select from dropdown)
   - **Pool Mode:** `Transaction` (recommended)
   - **Pool Size:** `25` (good default)
3. Click **"Create Pool"**

### Step 3: Wait and Verify

1. **Wait 1-2 minutes** for pool to initialize
2. **Note the port** - should still be 25061
3. **Test in Console:**

```bash
# Test new pool
psql "postgresql://doadmin:YOUR_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/contrezz?sslmode=require" -c "SELECT current_database();"
```

**Expected result:**

```
 current_database
------------------
 contrezz
(1 row)
```

**If you get "no such database" again:** The pool is still broken, stick with direct connection

**If it works:** Proceed to Step 4

### Step 4: Switch Back to Pool

1. **Apps** → Your app → **Settings** → **Environment Variables**
2. **Edit DATABASE_URL**

**Update to use pool:**

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/contrezz?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20
```

**Changes:**

- Port: `25060` → `25061`
- Added back: `&pgbouncer=true`

3. **Save** → **Force Rebuild and Redeploy**
4. **Monitor logs** for any errors

---

## 🎯 Why Did This Happen?

**Possible causes:**

1. **Pool was created before database** - Pool cached old database list
2. **Database name typo** - Pool might be looking for `Contrezz` not `contrezz`
3. **DigitalOcean bug** - UI shows correct config but pool isn't updated
4. **Case sensitivity** - Pool is case-sensitive, might have been created with wrong case

**Solution:** Delete and recreate ensures pool is fresh and properly configured

---

## 📊 Connection Limits

### Current Setup (Direct Connection)

| Resource                    | Limit | Your Usage          | Status |
| --------------------------- | ----- | ------------------- | ------ |
| Database Direct Connections | 25    | 5 per app instance  | ✅ OK  |
| Prisma Connection Limit     | 5     | Set in DATABASE_URL | ✅ OK  |
| Total Available             | 20    | Free for migrations | ✅ OK  |

**With 1 app instance using 5 connections, you have 20 connections available for:**

- Running migrations
- Database administration
- Other services

### Future Setup (Connection Pool)

| Resource                | Limit     | Your Usage   | Status     |
| ----------------------- | --------- | ------------ | ---------- |
| Pool Connections to DB  | 25        | Pool manages | ✅ OK      |
| Pool Size               | 25        | Configurable | ✅ OK      |
| App Connections to Pool | Unlimited | Via pool     | ✅ Better! |

**With connection pool:**

- App doesn't use direct connections
- Pool manages 25 connections efficiently
- Can handle many more app instances
- Better for scaling

---

## ✅ Success Checklist

**Immediate Fix (Do Now):**

- [ ] Updated DATABASE_URL to port 25060
- [ ] Removed `&pgbouncer=true` from DATABASE_URL
- [ ] Saved environment variables
- [ ] Force rebuilt and redeployed
- [ ] App is working (no "no such database" errors)
- [ ] Can login and access data

**Long-Term Fix (Do When Stable):**

- [ ] Deleted broken `Contrezz-db-pool`
- [ ] Created new `contrezz-pool` with correct settings
- [ ] Tested new pool works via psql
- [ ] Updated DATABASE_URL to port 25061
- [ ] Added back `&pgbouncer=true`
- [ ] Redeployed and verified
- [ ] Monitoring shows pool is working

---

## 🆘 If Direct Connection Doesn't Work

If you still get errors after switching to direct connection (port 25060):

**Check:**

1. Did you save the environment variable?
2. Did you force rebuild (not just redeploy)?
3. Is the password correct?
4. Run in Console: `echo $DATABASE_URL` to verify it's updated

**Still broken?** Share the latest error message from Runtime Logs.

---

## 📚 Reference

**Current Working Configuration:**

```bash
DATABASE_URL=postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require&connection_limit=5&pool_timeout=20

DIRECT_DATABASE_URL=postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require
```

**Future Configuration (with working pool):**

```bash
DATABASE_URL=postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/contrezz?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20

DIRECT_DATABASE_URL=postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require
```

---

**Status:** Ready to implement  
**Time to Fix:** 5 minutes  
**Impact:** Will resolve all "no such database" errors
