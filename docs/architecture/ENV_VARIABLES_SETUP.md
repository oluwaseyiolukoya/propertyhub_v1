# Environment Variables Setup for Public Admin

## 📋 Required Environment Variables

Add these to `public-backend/.env`:

### 1. PUBLIC_ADMIN_JWT_SECRET

**Purpose**: Secret key for signing and verifying JWT tokens for public admin authentication.

**Requirements**:

- Minimum 32 characters long
- Must be different from `JWT_SECRET` in main backend
- Should be a random, secure string
- Never commit to git

**Generate a secure secret**:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example value** (DO NOT use this in production - generate your own):

```
PUBLIC_ADMIN_JWT_SECRET=9add6d01495f35984fa7ba9775e2c69858791ed42f29b6bd204d16aa3c61635d
```

**Or generate a longer one (64 bytes = 128 hex characters)**:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. PUBLIC_ADMIN_JWT_EXPIRES_IN

**Purpose**: How long JWT tokens remain valid before expiring.

**Format**: Time string (e.g., "24h", "7d", "1h", "30m")

**Recommended values**:

- Development: `24h` (24 hours)
- Production: `24h` or `8h` (8 hours for better security)

**Example**:

```
PUBLIC_ADMIN_JWT_EXPIRES_IN=24h
```

**Common time formats**:

- `24h` - 24 hours
- `7d` - 7 days
- `1h` - 1 hour
- `30m` - 30 minutes
- `3600` - 3600 seconds

### 3. ALLOWED_ORIGINS

**Purpose**: CORS allowed origins for the public admin API. Controls which domains can make requests to the admin endpoints.

**Format**: Comma-separated list of URLs (no trailing slashes)

**Required origins**:

- Local development: `http://localhost:5173` (or whatever port your Vite dev server uses)
- Production admin UI: `https://admin.contrezz.com`

**Example**:

```
ALLOWED_ORIGINS=http://localhost:5173,https://admin.contrezz.com
```

**For local development with custom domain** (if using `admin.contrezz.local`):

```
ALLOWED_ORIGINS=http://localhost:5173,http://admin.contrezz.local:5173,https://admin.contrezz.com
```

## 📝 Complete .env Example

Here's a complete example for `public-backend/.env`:

```env
# Database
PUBLIC_DATABASE_URL=postgresql://username@localhost:5432/contrezz_public

# Public Admin JWT Configuration
PUBLIC_ADMIN_JWT_SECRET=your-generated-secret-key-minimum-32-characters-long
PUBLIC_ADMIN_JWT_EXPIRES_IN=24h

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,https://admin.contrezz.com

# Server Configuration
PORT=5001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# App URLs (if needed)
APP_URL=https://app.contrezz.com
APP_SIGNUP_URL=https://app.contrezz.com/signup
```

## 🔒 Security Best Practices

### 1. Generate Strong Secrets

**Never use**:

- ❌ `secret`
- ❌ `your-secret-key`
- ❌ `CHANGE_ME`
- ❌ `12345678901234567890123456789012` (predictable)
- ❌ Same secret as main backend

**Always use**:

- ✅ Randomly generated secrets (64+ bytes)
- ✅ Different secret for each environment
- ✅ Store in `.env` file (not committed to git)
- ✅ Use environment variables in production

### 2. Production Setup

In **DigitalOcean App Platform**:

1. Go to your `contrezz-public-api` app
2. Navigate to **Settings** → **App-Level Environment Variables**
3. Add each variable:
   - `PUBLIC_ADMIN_JWT_SECRET` → Set as **SECRET** (encrypted)
   - `PUBLIC_ADMIN_JWT_EXPIRES_IN` → `24h`
   - `ALLOWED_ORIGINS` → `https://admin.contrezz.com`

### 3. Local Development

For local development, create `public-backend/.env`:

```bash
cd public-backend
touch .env
# Add the variables above
```

**Important**: Make sure `.env` is in `.gitignore`!

## 🧪 Verify Configuration

After setting up, verify the configuration:

```bash
cd public-backend
npm run dev
```

Check the console output - it should show:

- ✅ Server starting on port 5001
- ✅ CORS configured with X origin(s)
- ❌ No errors about missing JWT_SECRET

## 🚨 Troubleshooting

### Error: "PUBLIC_ADMIN_JWT_SECRET is not set"

**Solution**: Add `PUBLIC_ADMIN_JWT_SECRET` to your `.env` file and restart the server.

### Error: "JWT_SECRET is too short"

**Solution**: Generate a longer secret (at least 32 characters):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### CORS Error: "Not allowed by CORS"

**Solution**: Add the origin to `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS=http://localhost:5173,https://admin.contrezz.com
```

Then restart the server.

### Token Expires Too Quickly

**Solution**: Increase `PUBLIC_ADMIN_JWT_EXPIRES_IN`:

```env
PUBLIC_ADMIN_JWT_EXPIRES_IN=7d  # 7 days instead of 24h
```

## 📚 Related Documentation

- `PHASE1_COMPLETE.md` - Phase 1 implementation guide
- `PUBLIC_CONTENT_ADMIN_ARCHITECTURE.md` - Full architecture
- `SETUP_ADMIN_SUBDOMAIN.md` - DNS configuration

---

**Next Step**: After setting environment variables, create the first admin user (see `PHASE1_COMPLETE.md`)
