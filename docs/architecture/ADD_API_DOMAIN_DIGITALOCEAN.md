# Add api.contrezz.com Domain in DigitalOcean

## Quick Answer

**YES, you MUST add `api.contrezz.com` in DigitalOcean!**

Even if your DNS is correctly pointing to the DigitalOcean app, you still need to add the custom domain in DigitalOcean's console for:
- SSL certificate provisioning
- Domain recognition
- Proper routing

---

## Step-by-Step: Add Domain

### Step 1: Go to DigitalOcean App

1. **Go to DigitalOcean App Platform**
   - https://cloud.digitalocean.com/apps

2. **Click on `contrezz-public-api` app**
   - (NOT `contrezz-backend-prod`)

### Step 2: Navigate to Domains

1. **Click "Settings" tab** (left sidebar)

2. **Click "Domains"** (under Settings)

### Step 3: Add Custom Domain

1. **Click "Add Domain" button** (top right)

2. **Enter domain:**
   ```
   api.contrezz.com
   ```

3. **Click "Add Domain"**

4. **DigitalOcean will:**
   - Validate the domain
   - Provision SSL certificate automatically
   - Show status as "Pending" initially

### Step 4: Wait for SSL Certificate

1. **Status will show "Pending"** (5-10 minutes)

2. **Refresh the page** to check status

3. **When ready, status will show:**
   - ✅ **"Active"** or **"Valid"** - Certificate is ready
   - ⚠️ **"Pending"** - Still provisioning (wait longer)
   - ❌ **"Failed"** - See troubleshooting below

---

## Verification

### Check Domain Status

In DigitalOcean → `contrezz-public-api` → Settings → Domains:

- ✅ `api.contrezz.com` should be listed
- ✅ Status should be "Active" or "Valid"
- ✅ SSL certificate should be provisioned

### Test SSL Certificate

```bash
# Test SSL connection
openssl s_client -connect api.contrezz.com:443 -servername api.contrezz.com

# Test HTTPS endpoint
curl -vI https://api.contrezz.com/health
```

**Expected:**
```
* SSL certificate verify ok
* SSL connection using TLSv1.3
```

---

## Why This Is Required

### Without Adding Domain in DigitalOcean:

- ❌ DNS points correctly, but DigitalOcean doesn't recognize the domain
- ❌ No SSL certificate is provisioned
- ❌ You get `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` errors
- ❌ HTTPS requests fail

### With Domain Added in DigitalOcean:

- ✅ DigitalOcean recognizes `api.contrezz.com` as valid for this app
- ✅ SSL certificate is automatically provisioned (Let's Encrypt)
- ✅ HTTPS works correctly
- ✅ Admin login works

---

## Troubleshooting

### Issue: Domain Status Shows "Failed"

**Possible Causes:**
1. DNS not pointing correctly yet
2. DNS propagation not complete
3. Domain already added to another app

**Solutions:**
1. **Check DNS:**
   ```bash
   dig api.contrezz.com +short
   ```
   Should return: `contrezz-public-api-xxxxx.ondigitalocean.app`

2. **Wait 10-15 minutes** for DNS propagation

3. **Remove and re-add domain:**
   - Remove `api.contrezz.com` from DigitalOcean
   - Wait 2 minutes
   - Re-add `api.contrezz.com`
   - Wait 5-10 minutes for SSL

### Issue: Domain Status Stays "Pending" for > 15 Minutes

**Solutions:**
1. **Check DNS is correct:**
   ```bash
   dig api.contrezz.com +short
   ```

2. **Verify domain is not added to another app:**
   - Check all apps in DigitalOcean
   - Remove from other apps if found

3. **Check DigitalOcean status:**
   - https://status.digitalocean.com/
   - Look for SSL/certificate issues

4. **Contact DigitalOcean support** if still failing

### Issue: "Domain Already Exists" Error

**Solution:**
1. **Find which app has the domain:**
   - Check all apps in DigitalOcean
   - Look in each app's Settings → Domains

2. **Remove from wrong app:**
   - If it's on `contrezz-backend-prod`, remove it
   - Domain should only be on `contrezz-public-api`

3. **Then add to correct app:**
   - Add to `contrezz-public-api` → Settings → Domains

---

## Complete Checklist

Before adding domain:
- [ ] DNS CNAME record points to public backend domain
- [ ] DNS has propagated (check with `dig api.contrezz.com +short`)
- [ ] You're logged into DigitalOcean

After adding domain:
- [ ] Domain appears in DigitalOcean → `contrezz-public-api` → Settings → Domains
- [ ] Status shows "Pending" (waiting for SSL)
- [ ] Wait 5-10 minutes
- [ ] Status changes to "Active" or "Valid"
- [ ] SSL certificate is provisioned
- [ ] `curl -vI https://api.contrezz.com/health` works
- [ ] Admin login at `https://admin.contrezz.com` works

---

## Quick Reference

**Add Domain:**
```
DigitalOcean → Apps → contrezz-public-api → Settings → Domains → Add Domain
```

**Domain to Add:**
```
api.contrezz.com
```

**Wait Time:**
```
5-10 minutes for SSL certificate provisioning
```

**Verify:**
```bash
curl -vI https://api.contrezz.com/health
```

---

**Last Updated:** December 15, 2025  
**Status:** Required step for SSL certificate

