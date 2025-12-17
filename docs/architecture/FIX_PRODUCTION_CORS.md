# Fix CORS Error in Production

## Problem

Getting CORS error:

```
Access to fetch at 'https://api.contrezz.com/api/admin/auth/login' from origin 'https://admin.contrezz.com' has been blocked by CORS policy
```

This means `ALLOWED_ORIGINS` in production doesn't include `https://admin.contrezz.com`.

## Solution: Update Environment Variable in DigitalOcean

### Step 1: Go to DigitalOcean App Settings

1. **Go to DigitalOcean App Platform**

   - https://cloud.digitalocean.com/apps

2. **Select `contrezz-public-api` app**

3. **Go to Settings → App-Level Environment Variables**

4. **Find `ALLOWED_ORIGINS`**

### Step 2: Update ALLOWED_ORIGINS

**Current value (probably):**

```
https://contrezz.com,https://www.contrezz.com
```

**Update to:**

```
https://contrezz.com,https://www.contrezz.com,https://admin.contrezz.com
```

**Steps:**

1. Click on `ALLOWED_ORIGINS` to edit
2. Update the value to include `https://admin.contrezz.com`
3. Click **Save**

### Step 3: Restart the App

After updating the environment variable:

1. **Go to DigitalOcean → `contrezz-public-api` app**
2. **Click "Actions" → "Restart"**
   - Or the app will auto-restart when you save the environment variable

**Wait 1-2 minutes** for the app to restart.

### Step 4: Verify CORS is Fixed

**Test the login again:**

1. Go to `https://admin.contrezz.com`
2. Try logging in
3. Should work without CORS errors

**Or test with curl:**

```bash
curl -H "Origin: https://admin.contrezz.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://api.contrezz.com/api/admin/auth/login \
  -v
```

Should return:

```
Access-Control-Allow-Origin: https://admin.contrezz.com
```

---

## Alternative: Update via doctl (If Available)

If you have `doctl` installed locally:

```bash
# Get app ID
APP_ID=$(doctl apps list --format ID,Spec.Name --no-header | grep contrezz-public-api | awk '{print $1}')

# Update environment variable
doctl apps update $APP_ID --spec .do/app.yaml
```

But the web console method above is easier.

---

## Verify Current Value

**Check what's currently set:**

1. DigitalOcean → `contrezz-public-api` → Settings → Environment Variables
2. Look at `ALLOWED_ORIGINS` value
3. Should include: `https://admin.contrezz.com`

---

## Quick Checklist

- [ ] Go to DigitalOcean → `contrezz-public-api` → Settings → Environment Variables
- [ ] Find `ALLOWED_ORIGINS`
- [ ] Update to: `https://contrezz.com,https://www.contrezz.com,https://admin.contrezz.com`
- [ ] Save
- [ ] Restart app (or wait for auto-restart)
- [ ] Test login at `https://admin.contrezz.com`

---

## Why This Happens

- The `app.yaml` file is used for **new deployments**
- Existing deployments use **environment variables set in DigitalOcean console**
- Updating `app.yaml` doesn't automatically update running apps
- You need to manually update the environment variable in the console

---

**Last Updated:** December 16, 2025  
**Status:** Production CORS fix guide

