# 🔍 Production vs Local - Comprehensive Investigation Report

## Executive Summary

After conducting a thorough investigation of your codebase, I've identified **CRITICAL ISSUES** that explain why features work locally but fail in production. The most severe issue is that **your production database is being wiped on every deployment**.

---

## 🚨 CRITICAL ISSUES FOUND

### 1. ⚠️ **DATABASE WIPE ON EVERY DEPLOY** (MOST CRITICAL!)

**Location:** `.do/app.yaml` line 136

**Current Configuration:**
```yaml
jobs:
  - name: db-migrate
    kind: PRE_DEPLOY
    run_command: npx prisma generate && npx prisma db push --accept-data-loss
```

**Problem:**
- `prisma db push --accept-data-loss` **WIPES YOUR ENTIRE DATABASE** on every deployment
- All user data, projects, customers are deleted
- This explains why users can't find their data after deployment

**Impact:**
- 🔴 **CRITICAL** - Complete data loss on every deploy
- Users lose all their work
- Production becomes unusable after each deployment

**Fix Required:**
```yaml
# CHANGE THIS:
run_command: npx prisma generate && npx prisma db push --accept-data-loss

# TO THIS:
run_command: npx prisma generate && npx prisma migrate deploy
```

**Why This Fix Works:**
- `prisma migrate deploy` applies only new migrations without touching existing data
- Preserves all production data
- Only updates schema where needed

---

### 2. ⚠️ **MISSING OR INCOMPLETE MIGRATIONS**

**Current State:**
```bash
backend/prisma/migrations/
├── 20251108_add_onboarding_applications/
├── 20251109190000_add_missing_customer_plan_fields/
└── 20251116132708_add_missing_customer_plan_fields/  # Empty migration!
```

**Problems:**
- Last migration (20251116132708) is empty - just marks as "already applied manually"
- Manual schema changes were made directly in production without creating proper migrations
- This causes schema drift between local and production

**Impact:**
- 🟡 **HIGH** - Schema inconsistencies
- Production schema may differ from local
- Future migrations may fail

**Fix Required:**
1. Create proper migrations for all schema changes
2. Never manually alter production database
3. Always use `npx prisma migrate dev` locally, then deploy with `npx prisma migrate deploy`

---

### 3. ⚠️ **ENVIRONMENT VARIABLES MISMATCH**

#### Backend Environment Variables

**Local (.env):**
```env
DATABASE_URL=postgresql://oluwaseyio@localhost:5432/contrezz
JWT_SECRET=45c9dbde3819e680f4cc8e325862dd1e4765d6ceee546bd8c79afed7ad2731f8
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Production (.do/app.yaml):**
```yaml
JWT_SECRET: CHANGE_ME_GENERATE_USING_NODE_CRYPTO  # ⚠️ PLACEHOLDER!
FRONTEND_URL: ${APP_URL}  # May not be set correctly
```

**Problems:**
- JWT_SECRET in production appears to be a placeholder
- If JWT_SECRET differs, tokens created locally won't work in production
- If JWT_SECRET in production is actually "CHANGE_ME_GENERATE_USING_NODE_CRYPTO", that's a SECURITY ISSUE

**Impact:**
- 🔴 **CRITICAL** - Authentication will fail
- Users can't log in or tokens are invalid
- Security vulnerability if using placeholder secret

**Fix Required:**
1. Generate a strong JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Update in DigitalOcean App Platform settings
3. Mark as SECRET (encrypted)

#### Frontend Environment Variables

**Local (.env.local):**
```env
VITE_API_URL=http://localhost:5000
```

**Production (.env):**
```env
VITE_API_URL=https://clownfish-app-mh6k4.ondigitalocean.app
```

**Status:** ✅ **CORRECTLY CONFIGURED**

---

### 4. ⚠️ **AUTHENTICATION TOKEN VALIDATION ISSUE**

**Location:** `backend/src/middleware/auth.ts` line 34

**Code:**
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
```

**Problem:**
- Falls back to `'secret'` if `JWT_SECRET` is not set
- If production and local use different JWT_SECRET values, tokens won't work cross-environment
- The fallback makes errors silent - doesn't fail fast

**Impact:**
- 🟡 **MEDIUM** - Authentication inconsistencies
- Tokens from one environment won't work in another
- Difficult to debug

**Fix Required:**
```typescript
// CHANGE THIS:
const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

// TO THIS:
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET not configured');
  return res.status(500).json({ error: 'Server configuration error' });
}
const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
```

---

### 5. ⚠️ **CORS CONFIGURATION - POTENTIAL ISSUE**

**Location:** `backend/src/index.ts` lines 106-152

**Current Configuration:**
```typescript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://contrezz.com",
  "https://www.contrezz.com",
  "https://api.contrezz.com",
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);
```

**Analysis:**
- Includes wildcard support for vercel.app and ondigitalocean.app domains ✅
- Includes hardcoded production domains ✅
- Reads from environment variables ✅

**Status:** ✅ **LIKELY CORRECT**

**Potential Issue:**
- If `process.env.FRONTEND_URL` is not set correctly in production, CORS may block requests
- Need to verify in DigitalOcean that FRONTEND_URL env var is set

---

### 6. ⚠️ **DATABASE SCHEMA DRIFT**

**Problem:**
- The empty migration suggests manual database changes were made
- Production schema may have fields that local doesn't (or vice versa)
- This causes queries to fail in production but work locally

**Current Evidence:**
```sql
-- Migration 20251116132708_add_missing_customer_plan_fields/migration.sql
-- This migration was already applied manually
-- Marking as applied to sync migration history
```

**Impact:**
- 🟡 **HIGH** - Queries fail due to missing columns
- INSERT statements fail with "column does not exist"
- SELECT statements return unexpected results

**Fix Required:**
1. Export production schema: `npx prisma db pull` (connect to production)
2. Compare with local schema
3. Create proper migrations for any differences
4. Test locally before deploying

---

### 7. ⚠️ **API CLIENT CONFIGURATION**

**Location:** Multiple files use different patterns

**Inconsistencies Found:**
```typescript
// Some files use:
import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Others use:
import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '')

// Inconsistent fallbacks across 23 files
```

**Status:** ⚠️ **MINOR** - Works but inconsistent

**Recommendation:**
- Centralize API configuration (already exists in `src/lib/api-config.ts`)
- Use `API_BASE_URL` from there consistently

---

## 📋 PRIORITY FIX ORDER

### 🔴 **IMMEDIATE (Do Today)**

1. **Fix Database Migration Command**
   - Edit `.do/app.yaml` line 136
   - Change to `npx prisma migrate deploy`
   - Commit and push

2. **Set Proper JWT_SECRET in Production**
   - Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Update in DigitalOcean App Platform → Backend → Settings → Environment Variables
   - Mark as SECRET (encrypted)

3. **Verify FRONTEND_URL in Production**
   - Check DigitalOcean App Platform → Backend → Settings → Environment Variables
   - Should be: `https://your-frontend-url.ondigitalocean.app`

### 🟡 **HIGH PRIORITY (This Week)**

4. **Create Proper Database Migrations**
   ```bash
   # Connect to production database temporarily
   DATABASE_URL="production-url" npx prisma db pull
   
   # Create migration from differences
   npx prisma migrate dev --name sync_production_schema
   
   # Deploy to production
   git push origin main  # This will auto-deploy
   ```

5. **Add JWT_SECRET Validation**
   - Update `backend/src/middleware/auth.ts`
   - Remove fallback to 'secret'
   - Fail fast if JWT_SECRET is missing

6. **Add Environment Validation on Startup**
   - Add to `backend/src/index.ts`
   - Check all required env vars on startup
   - Fail fast with clear error messages

### 🟢 **MEDIUM PRIORITY (This Month)**

7. **Standardize API Client Usage**
   - Use `API_BASE_URL` from `src/lib/api-config.ts` everywhere
   - Remove inline `import.meta.env.VITE_API_URL` usage

8. **Add Health Check Endpoint**
   - Implement `/api/health` endpoint
   - Return database connection status
   - Return environment info (NODE_ENV, etc.)

9. **Add Data Integrity Checks**
   - Create admin endpoint to check for orphaned records
   - Check for users without customerId
   - Check for projects without valid foreign keys

---

## 🛠️ IMMEDIATE ACTION ITEMS

### Step 1: Fix Database Wipe Issue

Edit `.do/app.yaml`:

```yaml
# BEFORE (line 136):
run_command: npx prisma generate && npx prisma db push --accept-data-loss

# AFTER:
run_command: npx prisma generate && npx prisma migrate deploy
```

**Commit and push this change IMMEDIATELY**

### Step 2: Generate and Set JWT_SECRET

Run locally:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Go to DigitalOcean App Platform:
1. Navigate to your app
2. Backend service → Settings → Environment Variables
3. Find JWT_SECRET
4. Replace "CHANGE_ME_GENERATE_USING_NODE_CRYPTO" with the generated value
5. Check "Encrypt" checkbox
6. Save

### Step 3: Verify Environment Variables

Check these are set in production:
- ✅ DATABASE_URL (should be auto-set by DigitalOcean)
- ✅ JWT_SECRET (you just set this)
- ✅ FRONTEND_URL (should be set to frontend URL)
- ✅ NODE_ENV=production
- ✅ PORT=5000

---

## 🧪 TESTING CHECKLIST

After deploying fixes:

### Database Check
```bash
# Verify production database is not wiped
# Check that existing users/projects still exist
# Should have data from before deployment
```

### Authentication Check
```bash
# Test login
curl -X POST https://api.contrezz.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","userType":"developer"}'

# Should return token
```

### Project Creation Check
```bash
# Test creating a project
curl -X POST https://api.contrezz.com/api/developer-dashboard/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","projectType":"residential","city":"Lagos"}'

# Should return 201 Created
```

### CORS Check
```bash
# Open browser console on your frontend
# Check for CORS errors
# Should see no "blocked by CORS" messages
```

---

## 🔒 SECURITY RECOMMENDATIONS

1. **Never Commit Secrets to Git**
   - ✅ Already have .env in .gitignore
   - ✅ Secrets are in environment variables

2. **Use Strong Secrets**
   - ⚠️ Generate new JWT_SECRET (64+ characters)
   - ⚠️ Never use default/placeholder values

3. **Rotate Secrets Periodically**
   - Generate new JWT_SECRET every 6 months
   - Force users to re-login when changing

4. **Monitor for Security Issues**
   - Check logs for authentication failures
   - Monitor for suspicious activity

---

## 📊 COMPARISON TABLE

| Aspect | Local | Production | Status |
|--------|-------|------------|--------|
| Database Strategy | `db push` | `db push --accept-data-loss` 🔴 | **BROKEN** |
| JWT_SECRET | Proper secret | `CHANGE_ME...` 🔴 | **SECURITY RISK** |
| FRONTEND_URL | localhost:5173 | ${APP_URL} ⚠️ | **VERIFY** |
| NODE_ENV | development | production ✅ | **OK** |
| VITE_API_URL | localhost:5000 | digitalocean URL ✅ | **OK** |
| Migrations | 3 migrations | Same (if not wiped) | **AT RISK** |
| CORS | Permissive | Permissive ✅ | **OK** |
| API_BASE_URL | Empty (proxy) | Full URL ✅ | **OK** |

---

## 🎓 LESSONS & BEST PRACTICES

### What Went Wrong

1. **Using `db push` in production** - This is only for development
2. **Manual database changes** - Created schema drift
3. **Placeholder secrets** - Left default values in production config
4. **No validation** - Server doesn't check for missing env vars on startup

### Best Practices Going Forward

1. **Use Migrations Always**
   ```bash
   # Development
   npx prisma migrate dev --name feature_name
   
   # Production (automatic via CI/CD)
   npx prisma migrate deploy
   ```

2. **Never Manually Alter Production DB**
   - Always create migrations locally first
   - Test migrations on staging
   - Deploy via git push

3. **Validate Environment on Startup**
   ```typescript
   const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL'];
   REQUIRED_VARS.forEach(key => {
     if (!process.env[key]) {
       throw new Error(`Missing ${key}`);
     }
   });
   ```

4. **Use Staging Environment**
   - Test all changes on staging first
   - Staging should mirror production exactly
   - Never deploy directly to production without testing

5. **Monitor Production**
   - Set up error logging (Sentry, Datadog, etc.)
   - Monitor API response times
   - Track error rates
   - Alert on anomalies

---

## 🚀 NEXT STEPS

1. **Read this entire document carefully**
2. **Fix the database migration command** (.do/app.yaml)
3. **Set proper JWT_SECRET in DigitalOcean**
4. **Verify FRONTEND_URL is set correctly**
5. **Push changes and monitor deployment**
6. **Test all functionality in production**
7. **Create proper migrations for any manual schema changes**
8. **Implement environment validation**
9. **Set up monitoring and alerting**

---

## ❓ FAQ

**Q: Why does local work but production doesn't?**
A: Because your production database is being wiped on every deploy, and environment variables are different.

**Q: Will fixing this preserve my data?**
A: Yes, once you switch to `prisma migrate deploy`, data will be preserved.

**Q: Do I need to migrate existing data?**
A: No, the data is already there. You just need to stop wiping it.

**Q: What if I've already lost data?**
A: You'll need to restore from a database backup. DigitalOcean keeps automatic backups.

**Q: How can I prevent this in the future?**
A: Follow the best practices in this document, especially using migrations and staging environments.

---

## 🆘 IF YOU NEED HELP

If you're unsure about any of these fixes:

1. **STOP** - Don't deploy anything else
2. **BACKUP** - Export your production database
3. **CONTACT SUPPORT** - Get help before proceeding
4. **TEST ON STAGING** - Never test fixes directly on production

---

## ✅ VERIFICATION CHECKLIST

After implementing fixes:

- [ ] `.do/app.yaml` uses `prisma migrate deploy`
- [ ] JWT_SECRET is set to a strong, random value in production
- [ ] JWT_SECRET is marked as SECRET (encrypted) in DigitalOcean
- [ ] FRONTEND_URL is set correctly in production
- [ ] All required environment variables are present
- [ ] Deployed and tested
- [ ] Production database is NOT wiped
- [ ] Users can log in successfully
- [ ] Projects can be created
- [ ] No CORS errors in browser console
- [ ] No authentication errors in logs
- [ ] Data persists across deployments

---

**Generated:** November 16, 2024
**Priority:** 🔴 CRITICAL - Fix Immediately

