# Environment Variables Guide

Complete reference for all environment variables used in PropertyHub SaaS.

## Table of Contents
1. [Backend Variables](#backend-variables)
2. [Frontend Variables](#frontend-variables)
3. [How to Set Variables](#how-to-set-variables)
4. [Security Best Practices](#security-best-practices)

---

## Backend Variables

Set these in DigitalOcean App Platform → Backend Service → Settings → Environment Variables

### Required Variables

#### `DATABASE_URL`
- **Description:** PostgreSQL connection string
- **Format:** `postgresql://user:password@host:port/database?schema=public`
- **DigitalOcean:** Auto-injected when you attach a managed database
- **Local:** Set in `backend/.env`
- **Example:** `postgresql://user:pass@localhost:5432/propertyhub?schema=public`
- **Security:** Mark as SECRET in DigitalOcean

#### `NODE_ENV`
- **Description:** Application environment
- **Values:** `development` | `production` | `test`
- **Production:** `production`
- **Local:** `development`
- **Impact:** Affects logging, error handling, CORS

#### `PORT`
- **Description:** Port the backend server listens on
- **Value:** `5000`
- **Required:** Yes (DigitalOcean expects this)
- **Local:** Can be changed in `backend/.env`

#### `JWT_SECRET`
- **Description:** Secret key for signing JWT tokens
- **Generate:** `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **Length:** Minimum 32 characters, recommend 64+
- **Security:** MUST be marked as SECRET in DigitalOcean
- **Example:** `a1b2c3d4e5f6...` (64 hex characters)
- **⚠️ CRITICAL:** Never commit to Git, never share, change if compromised

#### `JWT_EXPIRES_IN`
- **Description:** JWT token expiration time
- **Format:** Time string (e.g., `7d`, `24h`, `30m`)
- **Default:** `7d` (7 days)
- **Recommendation:** `7d` for web, `30d` for mobile
- **Impact:** Users must re-login after this period

#### `FRONTEND_URL`
- **Description:** URL of your frontend application (for CORS)
- **Format:** Full URL with protocol, no trailing slash
- **Production:** `https://your-frontend-app.ondigitalocean.app`
- **Local:** `http://localhost:5173`
- **Impact:** CORS will block requests from other origins
- **⚠️ IMPORTANT:** Must match exactly (including protocol)

### File Upload Variables

#### `MAX_FILE_SIZE`
- **Description:** Maximum file upload size in bytes
- **Default:** `5242880` (5 MB)
- **Format:** Number (bytes)
- **Examples:**
  - 5 MB: `5242880`
  - 10 MB: `10485760`
  - 50 MB: `52428800`

#### `UPLOAD_DIR`
- **Description:** Directory for storing uploaded files
- **Default:** `./uploads`
- **Production:** Use DigitalOcean Spaces for persistent storage
- **Local:** `./uploads`
- **Note:** App Platform has ephemeral storage (files lost on restart)

### Payment Gateway Variables (Optional)

These are for **platform-level** subscription billing (charging property owners). Individual property owners set their own Paystack keys in the app UI.

#### `PAYSTACK_SECRET_KEY`
- **Description:** Paystack live secret key (for production)
- **Get From:** https://dashboard.paystack.com/#/settings/developers
- **Format:** `sk_live_xxxxx`
- **Security:** Mark as SECRET in DigitalOcean
- **Optional:** Only needed if charging property owners for subscriptions

#### `PAYSTACK_PUBLIC_KEY`
- **Description:** Paystack live public key
- **Format:** `pk_live_xxxxx`
- **Optional:** Only needed if charging property owners for subscriptions

#### `PAYSTACK_TEST_SECRET_KEY`
- **Description:** Paystack test secret key (for testing)
- **Format:** `sk_test_xxxxx`
- **Security:** Mark as SECRET in DigitalOcean
- **Use:** Testing payment flows without real charges

#### `PAYSTACK_TEST_PUBLIC_KEY`
- **Description:** Paystack test public key
- **Format:** `pk_test_xxxxx`
- **Use:** Testing payment flows

### Redis Variables (Optional)

#### `REDIS_URL`
- **Description:** Redis connection string (for Socket.io scaling)
- **Format:** `redis://default:password@host:port`
- **When Needed:** Only when scaling to multiple backend instances
- **Single Server:** Leave empty
- **Example:** `redis://default:pass@redis-cluster:6379`

### Email Variables (Optional - Future Use)

#### `SMTP_HOST`
- **Description:** SMTP server hostname
- **Example:** `smtp.gmail.com`
- **Status:** Not currently used (planned feature)

#### `SMTP_PORT`
- **Description:** SMTP server port
- **Common Values:** `587` (TLS), `465` (SSL), `25` (unencrypted)
- **Recommended:** `587`

#### `SMTP_USER`
- **Description:** SMTP username (usually email address)
- **Example:** `your-email@gmail.com`

#### `SMTP_PASS`
- **Description:** SMTP password or app-specific password
- **Security:** Mark as SECRET
- **Gmail:** Use App Password, not account password

### Monitoring Variables (Optional)

#### `SENTRY_DSN`
- **Description:** Sentry error tracking DSN
- **Get From:** https://sentry.io/
- **Format:** `https://xxxxx@sentry.io/xxxxx`
- **Optional:** For production error tracking

#### `LOG_LEVEL`
- **Description:** Logging verbosity
- **Values:** `error` | `warn` | `info` | `debug`
- **Production:** `info` or `warn`
- **Development:** `debug`

---

## Frontend Variables

Set these in DigitalOcean App Platform → Frontend Service → Settings → Environment Variables

### Required Variables

#### `VITE_API_URL`
- **Description:** Backend API URL
- **Format:** Full URL with protocol, no trailing slash
- **Production:** `https://your-backend-app.ondigitalocean.app`
- **Local:** `http://localhost:5000`
- **Scope:** BUILD_TIME (must be set before build)
- **⚠️ IMPORTANT:** Must match your backend URL exactly

### Optional Variables

#### `VITE_GA_TRACKING_ID`
- **Description:** Google Analytics tracking ID
- **Format:** `G-XXXXXXXXXX`
- **Optional:** For analytics tracking

#### `VITE_SENTRY_DSN`
- **Description:** Sentry error tracking DSN (frontend)
- **Format:** `https://xxxxx@sentry.io/xxxxx`
- **Optional:** For frontend error tracking

---

## How to Set Variables

### Local Development

#### Backend:
1. Copy `backend/env.example` to `backend/.env`
2. Update values:
   ```bash
   cd backend
   cp env.example .env
   nano .env  # or use your editor
   ```

#### Frontend:
1. Create `.env.local`:
   ```bash
   echo "VITE_API_URL=http://localhost:5000" > .env.local
   ```

### DigitalOcean Production

#### Backend:
1. Go to your App → Backend Service
2. Click **"Settings"** → **"Environment Variables"**
3. Click **"Edit"**
4. Add variables one by one:
   - Key: `NODE_ENV`
   - Value: `production`
   - Scope: RUN_TIME
   - Encrypt: No (unless sensitive)
5. For sensitive values (JWT_SECRET, passwords):
   - Check **"Encrypt"** checkbox
   - This marks them as SECRET
6. Click **"Save"**
7. Backend will automatically redeploy

#### Frontend:
1. Go to your App → Frontend Service
2. Click **"Settings"** → **"Environment Variables"**
3. Click **"Edit"**
4. Add:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.ondigitalocean.app`
   - Scope: BUILD_TIME
5. Click **"Save"**
6. Frontend will automatically rebuild and redeploy

### Using `.do/app.yaml`

You can define all variables in `.do/app.yaml`:

```yaml
services:
  - name: backend
    envs:
      - key: NODE_ENV
        scope: RUN_TIME
        value: production
      
      - key: JWT_SECRET
        scope: RUN_TIME
        value: CHANGE_ME
        type: SECRET

static_sites:
  - name: frontend
    envs:
      - key: VITE_API_URL
        scope: BUILD_TIME
        value: ${backend.PUBLIC_URL}
```

---

## Security Best Practices

### 1. Never Commit Secrets
```bash
# Always in .gitignore:
.env
.env.local
.env.production
.env.*.local
```

### 2. Mark Sensitive Variables as SECRET
In DigitalOcean, check "Encrypt" for:
- `DATABASE_URL`
- `JWT_SECRET`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_TEST_SECRET_KEY`
- `SMTP_PASS`
- Any passwords or API keys

### 3. Use Strong Secrets
```bash
# Generate strong JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate strong password:
openssl rand -base64 32
```

### 4. Rotate Secrets Regularly
- Change `JWT_SECRET` every 6-12 months
- Rotate API keys if compromised
- Update passwords quarterly

### 5. Separate Test and Production Keys
- Never use test keys in production
- Never use production keys in development
- Use different Paystack keys for test/live

### 6. Validate URLs
```bash
# Good:
FRONTEND_URL=https://app.example.com
VITE_API_URL=https://api.example.com

# Bad (trailing slash):
FRONTEND_URL=https://app.example.com/
VITE_API_URL=https://api.example.com/

# Bad (wrong protocol):
FRONTEND_URL=http://app.example.com  # Should be https in production
```

### 7. Use Environment-Specific Values
```bash
# Development
DATABASE_URL=postgresql://localhost:5432/propertyhub_dev
FRONTEND_URL=http://localhost:5173

# Production
DATABASE_URL=postgresql://prod-host:5432/propertyhub
FRONTEND_URL=https://app.example.com
```

### 8. Backup Environment Variables
```bash
# Export from DigitalOcean:
doctl apps spec get <app-id> > app-spec-backup.yaml

# Store securely (not in Git!)
# Use password manager or encrypted storage
```

---

## Variable Checklist

### Before Deployment:
- [ ] `JWT_SECRET` generated (64+ characters)
- [ ] `DATABASE_URL` ready
- [ ] `FRONTEND_URL` matches frontend domain
- [ ] `VITE_API_URL` matches backend domain
- [ ] All secrets marked as SECRET/encrypted
- [ ] No secrets in Git
- [ ] Test keys separate from production keys

### After Deployment:
- [ ] All variables set in DigitalOcean
- [ ] Backend can connect to database
- [ ] Frontend can reach backend
- [ ] CORS working (no errors in console)
- [ ] Login works (JWT signing/verification)
- [ ] File uploads work

---

## Troubleshooting

### "CORS policy: No 'Access-Control-Allow-Origin' header"
- Check `FRONTEND_URL` in backend
- Must match frontend URL exactly (no trailing slash)
- Redeploy backend after changing

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify database is running
- Check trusted sources in database settings

### "Invalid JWT token"
- Check `JWT_SECRET` is set
- Must be same across all backend instances
- Check token hasn't expired (`JWT_EXPIRES_IN`)

### "Environment variable not found"
- Verify variable is set in correct service (backend vs frontend)
- Check scope (RUN_TIME vs BUILD_TIME)
- Frontend variables must start with `VITE_`
- Redeploy after adding variables

### "Paystack: Invalid key"
- Check you're using correct key type (public vs secret)
- Verify test vs live keys match environment
- Check for extra spaces in key value

---

## Quick Reference

### Generate Secrets:
```bash
# JWT Secret (64 chars)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Random password (32 chars)
openssl rand -base64 32
```

### View Current Variables:
```bash
# DigitalOcean CLI
doctl apps spec get <app-id>
```

### Test Variables Locally:
```bash
# Backend
cd backend
npm run dev

# Frontend
npm run dev
```

---

**Last Updated:** October 31, 2025
**Version:** 1.0.0

