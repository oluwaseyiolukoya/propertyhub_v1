# Fix api.contrezz.com DNS - Pointing to Wrong Backend

## Problem

`api.contrezz.com` is currently pointing to the **wrong backend**:

```bash
$ dig api.contrezz.com +short
contrezz-backend-prod-nnju5.ondigitalocean.app.  # ❌ WRONG - This is the app backend
```

**Current (Wrong) Configuration:**

- `api.contrezz.com` → `contrezz-backend-prod-nnju5.ondigitalocean.app` (App Backend) ❌

**Correct Configuration:**

- `api.contrezz.com` → `contrezz-public-api-xxxxx.ondigitalocean.app` (Public Backend) ✅
- `api.app.contrezz.com` → `contrezz-backend-prod-nnju5.ondigitalocean.app` (App Backend) ✅

---

## Why This Causes SSL Errors

1. **Wrong Backend**: `api.contrezz.com` points to app backend, not public backend
2. **No SSL Certificate**: App backend doesn't have SSL certificate for `api.contrezz.com`
3. **Wrong API Endpoints**: Admin login tries to reach public backend endpoints on app backend
4. **CORS Issues**: App backend doesn't have CORS configured for `admin.contrezz.com`

---

## Step-by-Step Fix

### Step 1: Find Public Backend Domain

1. **Go to DigitalOcean App Platform**

   - https://cloud.digitalocean.com/apps

2. **Select `contrezz-public-api` app** (NOT `contrezz-backend-prod`)

3. **Go to Settings → Domains**

4. **Find the default domain** (should look like):

   ```
   contrezz-public-api-xxxxx.ondigitalocean.app
   ```

   (The `xxxxx` will be a unique identifier)

5. **Copy this domain** - you'll need it for DNS

**Alternative Method:**

- Go to DigitalOcean → Apps → `contrezz-public-api`
- Look at the **Overview** page
- The default domain should be displayed there

---

### Step 2: Update DNS in Namecheap

1. **Go to Namecheap**

   - https://www.namecheap.com/myaccount/login/

2. **Domain List → Manage → Advanced DNS**

3. **Find the CNAME record for `api`**

4. **Update the record:**

   - **Type:** CNAME
   - **Host:** `api`
   - **Value:** `contrezz-public-api-xxxxx.ondigitalocean.app` (from Step 1)
   - **TTL:** Automatic (or 5 min for faster propagation)

5. **Click checkmark to save**

---

### Step 3: Verify DNS Update

**Wait 2-5 minutes**, then check:

```bash
dig api.contrezz.com +short
```

**Expected Result:**

```
contrezz-public-api-xxxxx.ondigitalocean.app.
```

**NOT:**

```
contrezz-backend-prod-nnju5.ondigitalocean.app.  # ❌ Wrong
```

---

### Step 4: Add Domain in DigitalOcean (REQUIRED)

**⚠️ IMPORTANT: You MUST add `api.contrezz.com` in DigitalOcean for it to work!**

1. **Go to DigitalOcean → `contrezz-public-api` app**

2. **Settings → Domains**

3. **Check if `api.contrezz.com` is listed:**
   - ✅ **If listed**: SSL certificate should auto-provision (wait 5-10 minutes)
   - ❌ **If NOT listed**: 
     - Click **"Add Domain"** button
     - Enter: `api.contrezz.com`
     - Click **"Add Domain"**
     - DigitalOcean will automatically provision SSL certificate
     - Wait 5-10 minutes for certificate to be active

**Why this is required:**
- DNS alone is not enough - DigitalOcean needs to know this domain belongs to this app
- Without adding it here, DigitalOcean won't provision SSL certificate
- Without SSL, you'll get `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` errors

---

### Step 5: Verify SSL Certificate

**After DNS propagates (5-10 minutes):**

```bash
# Test SSL certificate
openssl s_client -connect api.contrezz.com:443 -servername api.contrezz.com

# Test HTTPS endpoint
curl -vI https://api.contrezz.com/health
```

**Should show:**

```
* SSL certificate verify ok
* SSL connection using TLSv1.3
```

---

### Step 6: Test Admin Login

1. **Wait 10-15 minutes** for DNS and SSL to fully propagate

2. **Go to `https://admin.contrezz.com`**

3. **Open DevTools → Console**

4. **Try logging in**

5. **Should see:**
   - ✅ No SSL errors
   - ✅ No CORS errors
   - ✅ Login works

---

## Current DNS Configuration Summary

### Correct Configuration (After Fix)

| Domain                 | Points To                                        | Backend Type   | Purpose               |
| ---------------------- | ------------------------------------------------ | -------------- | --------------------- |
| `api.contrezz.com`     | `contrezz-public-api-xxxxx.ondigitalocean.app`   | Public Backend | Public API, Admin API |
| `api.app.contrezz.com` | `contrezz-backend-prod-nnju5.ondigitalocean.app` | App Backend    | Application API       |

### Wrong Configuration (Current)

| Domain             | Currently Points To                                 | Should Point To                                   |
| ------------------ | --------------------------------------------------- | ------------------------------------------------- |
| `api.contrezz.com` | `contrezz-backend-prod-nnju5.ondigitalocean.app` ❌ | `contrezz-public-api-xxxxx.ondigitalocean.app` ✅ |

---

## Verification Checklist

After fixing DNS:

- [ ] `dig api.contrezz.com +short` returns public backend domain
- [ ] `api.contrezz.com` is added in DigitalOcean → `contrezz-public-api` → Settings → Domains
- [ ] SSL certificate status shows "Active" or "Valid"
- [ ] `curl -vI https://api.contrezz.com/health` returns 200 OK
- [ ] `curl -vI https://api.contrezz.com/health` shows valid SSL certificate
- [ ] Admin login at `https://admin.contrezz.com` works without SSL errors

---

## Troubleshooting

### Issue: DNS Still Shows Old Domain After Update

**Solution:**

1. Wait 5-10 minutes (DNS propagation can take time)
2. Clear DNS cache:

   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches

   # Windows
   ipconfig /flushdns
   ```

3. Check from different network (mobile data)
4. Use different DNS server: `dig @8.8.8.8 api.contrezz.com +short`

### Issue: SSL Certificate Still Failing After DNS Fix

**Solution:**

1. Verify DNS is correct: `dig api.contrezz.com +short`
2. Check domain is added in DigitalOcean → `contrezz-public-api` → Settings → Domains
3. Remove and re-add domain in DigitalOcean (forces certificate regeneration)
4. Wait 10-15 minutes for certificate provisioning

### Issue: Can't Find Public Backend Domain

**Solution:**

1. Go to DigitalOcean → Apps
2. Look for app named `contrezz-public-api` (NOT `contrezz-backend-prod`)
3. If you can't find it, check:
   - App might have different name
   - App might not be deployed yet
   - Check all apps in your DigitalOcean account

---

## Quick Reference

**Find Public Backend Domain:**

```
DigitalOcean → Apps → contrezz-public-api → Settings → Domains
```

**Update DNS:**

```
Namecheap → Domain List → Manage → Advanced DNS → Update CNAME for "api"
```

**Verify Fix:**

```bash
dig api.contrezz.com +short
# Should return: contrezz-public-api-xxxxx.ondigitalocean.app
```

---

**Last Updated:** December 15, 2025  
**Status:** DNS misconfiguration fix guide
