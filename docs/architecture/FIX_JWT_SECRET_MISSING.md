# Fix PUBLIC_ADMIN_JWT_SECRET Missing

## Problem

Backend logs show:

```
Admin login error: Error: PUBLIC_ADMIN_JWT_SECRET not configured
```

This means the JWT secret environment variable is not set in production.

## Solution: Add JWT Secret to Environment Variables

### Step 1: Generate JWT Secret

**On your local machine:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Or use this command:**

```bash
openssl rand -hex 32
```

**Copy the output** - it will be a long random string (64 characters).

### Step 2: Add to DigitalOcean

1. **Go to DigitalOcean App Platform**

   - https://cloud.digitalocean.com/apps

2. **Select `contrezz-public-api` app**

3. **Go to Settings → App-Level Environment Variables**

4. **Click "Add Variable"**

5. **Add:**

   - **Key:** `PUBLIC_ADMIN_JWT_SECRET`
   - **Value:** (paste the secret you generated)
   - **Type:** `SECRET` (recommended) or `GENERAL`

6. **Click "Save"**

### Step 3: Add JWT Expiration (Optional but Recommended)

Also add:

- **Key:** `PUBLIC_ADMIN_JWT_EXPIRES_IN`
- **Value:** `24h` (or `7d` for 7 days)
- **Type:** `GENERAL`

### Step 4: Restart the App

After adding the environment variable:

1. **Go to DigitalOcean → `contrezz-public-api` app**
2. **Click "Actions" → "Restart"**
   - Or wait 1-2 minutes for auto-restart

### Step 5: Test Login

1. Wait 1-2 minutes for restart
2. Go to `https://admin.contrezz.com`
3. Try logging in again

---

## Why This Happens

The JWT secret is required to:

- Sign JWT tokens after successful login
- Verify JWT tokens on subsequent requests
- Secure the authentication system

Without it, login will fail even if email/password are correct.

---

## Quick Reference

**Generate Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to DigitalOcean:**

- Key: `PUBLIC_ADMIN_JWT_SECRET`
- Value: (generated secret)
- Type: `SECRET`

**Restart app after adding**

---

**Last Updated:** December 16, 2025  
**Status:** JWT secret configuration guide

