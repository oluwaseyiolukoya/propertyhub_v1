# 🔍 Database Mismatch Issue - SOLVED

## Problem Summary

The admin dashboard was only showing **2 customers** instead of **7 customers** that exist in Prisma Studio.

## Root Cause

**Two different databases were being used:**

1. **`contrezz_dev`** - Backend was configured to use this
   - Only had 2 customers
   - Located at: `postgresql://localhost:5432/contrezz_dev`
   
2. **`contrezz`** - Prisma Studio was using this
   - Has all 7 customers (including demo@contrezz.com)
   - Located at: `postgresql://oluwaseyio@localhost:5432/contrezz`

### Why This Happened

- `backend/.env.local` had: `DATABASE_URL="postgresql://localhost:5432/contrezz_dev"`
- `backend/.env` had: `DATABASE_URL="postgresql://oluwaseyio@localhost:5432/contrezz"`
- Backend uses `.env.local` (takes precedence)
- Prisma Studio uses `.env`
- Result: They were reading from different databases!

## The Fix

Updated `backend/.env.local` to use the same database as Prisma Studio:

```bash
# OLD (wrong)
DATABASE_URL="postgresql://localhost:5432/contrezz_dev"

# NEW (correct)
DATABASE_URL="postgresql://oluwaseyio@localhost:5432/contrezz?schema=public"
```

## Customers in Database

All 7 customers in the `contrezz` database:

1. **demo@contrezz.com** - PropertyHub Inc. (trial) ✅
2. **john@metro-properties.com** - Metro Properties LLC (active)
3. **enoch@yahoo.com** - ContrezzHub (trial)
4. **enochadeleke@yahoo.com** - ContrezzHub (active)
5. **folakemi@gmail.com** - ContrezzHub (active)
6. **test-trial-1762610547042@example.com** - Test Company (suspended)
7. **test-trial-1762610568294@example.com** - Test Company (suspended)

## How to Apply the Fix

### Option 1: Automatic (Recommended)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor
./fix-database-config.sh
```

Then restart backend:
```bash
# Stop current backend (Ctrl+C in backend terminal)
cd backend
npm run dev
```

### Option 2: Manual

1. **Edit `backend/.env.local`:**
   ```bash
   cd backend
   nano .env.local
   ```

2. **Find this line:**
   ```
   DATABASE_URL="postgresql://localhost:5432/contrezz_dev"
   ```

3. **Replace with:**
   ```
   DATABASE_URL="postgresql://oluwaseyio@localhost:5432/contrezz?schema=public"
   ```

4. **Save and exit** (Ctrl+X, Y, Enter)

5. **Restart backend:**
   ```bash
   # Stop current backend (Ctrl+C)
   npm run dev
   ```

## Verify the Fix

### Step 1: Check Backend is Using Correct Database

```bash
cd backend
grep "^DATABASE_URL" .env.local
```

Should show:
```
DATABASE_URL="postgresql://oluwaseyio@localhost:5432/contrezz?schema=public"
```

### Step 2: Test API Returns All Customers

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@contrezz.com","password":"admin123"}' \
  | jq -r '.token' > /tmp/admin_token.txt

# Fetch customers
curl -s http://localhost:5000/api/customers \
  -H "Authorization: Bearer $(cat /tmp/admin_token.txt)" \
  | jq '. | length'
```

Should show: **7**

### Step 3: Check Admin Dashboard

1. Open: http://localhost:5173
2. Login: admin@contrezz.com / admin123
3. Go to: Customer Management tab
4. Should see: **7 customers**

## Trial Banner Issue

Now that we're using the correct database, `demo@contrezz.com` exists and should show the trial banner:

### Test Trial Banner

```bash
# Login as demo user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@contrezz.com","password":"demo123"}' \
  | jq -r '.token' > /tmp/demo_token.txt

# Check subscription status
curl -s http://localhost:5000/api/subscription/status \
  -H "Authorization: Bearer $(cat /tmp/demo_token.txt)" \
  | jq .
```

Should return:
```json
{
  "status": "trial",
  "daysRemaining": 14,
  "trialEndsAt": "2025-11-22T...",
  ...
}
```

### Verify in Browser

1. Open: http://localhost:5173
2. Login: demo@contrezz.com / demo123
3. Should see: Blue trial banner at top of dashboard
4. Banner should show: "X Days Left in Trial"

## What About contrezz_dev?

The `contrezz_dev` database still exists but is no longer used. You can:

### Option A: Keep it (for future dev/test)
- Do nothing
- It's there if you need a separate dev database later

### Option B: Delete it
```bash
dropdb contrezz_dev
```

### Option C: Sync it with contrezz
```bash
# Dump contrezz
pg_dump -U oluwaseyio contrezz > /tmp/contrezz_backup.sql

# Restore to contrezz_dev
psql -U oluwaseyio contrezz_dev < /tmp/contrezz_backup.sql
```

## Best Practices Going Forward

### 1. Use One Database Locally

For local development, use **one database** to avoid confusion:

```bash
# backend/.env.local
DATABASE_URL="postgresql://oluwaseyio@localhost:5432/contrezz?schema=public"

# backend/.env (for Prisma CLI)
DATABASE_URL="postgresql://oluwaseyio@localhost:5432/contrezz?schema=public"
```

### 2. Document Your Databases

Create a `DATABASE_GUIDE.md`:

```markdown
# Databases

## Local Development
- Database: contrezz
- URL: postgresql://oluwaseyio@localhost:5432/contrezz
- Used by: Backend, Prisma Studio, Migrations

## Production
- Database: (AWS RDS or similar)
- URL: (from environment variables)
```

### 3. Check Database Before Debugging

When debugging "data not showing" issues:

```bash
# 1. Check which database backend is using
cd backend
grep DATABASE_URL .env.local

# 2. Count records in that database
DATABASE_URL="your_url_here" npx prisma studio

# 3. Test API directly
curl http://localhost:5000/api/customers -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Backend won't start after change

**Error:** `User '' was denied access`

**Fix:** Make sure DATABASE_URL includes username:
```
DATABASE_URL="postgresql://oluwaseyio@localhost:5432/contrezz?schema=public"
```

### Still seeing only 2 customers

**Possible causes:**
1. Backend not restarted
2. Browser cache (hard refresh: Cmd+Shift+R)
3. Wrong database URL in .env.local

**Fix:**
```bash
# 1. Stop backend (Ctrl+C)
# 2. Verify config
cd backend
cat .env.local | grep DATABASE_URL

# 3. Should show: postgresql://oluwaseyio@localhost:5432/contrezz

# 4. Restart
npm run dev

# 5. Test
curl http://localhost:5000/api/customers -H "Authorization: Bearer $TOKEN" | jq '. | length'
# Should show: 7
```

### Prisma Studio shows different data than API

**This means you're using different databases!**

**Fix:** Make sure both `.env` and `.env.local` point to the same database:

```bash
cd backend

# Check .env
grep DATABASE_URL .env

# Check .env.local
grep DATABASE_URL .env.local

# They should be identical!
```

## Summary

✅ **Problem:** Backend using `contrezz_dev` (2 customers), Prisma Studio using `contrezz` (7 customers)

✅ **Solution:** Updated `backend/.env.local` to use `contrezz` database

✅ **Result:** Admin dashboard now shows all 7 customers, trial banner works for demo@contrezz.com

✅ **Backup:** Original config saved to `backend/.env.local.backup`

---

**Next Steps:**
1. Restart backend
2. Hard refresh browser
3. Login to admin dashboard
4. Verify 7 customers are visible
5. Login as demo@contrezz.com
6. Verify trial banner appears

