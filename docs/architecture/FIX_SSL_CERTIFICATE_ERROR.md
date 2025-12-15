# Fix SSL Certificate Error on api.contrezz.com

## Error

```
POST https://api.contrezz.com/api/admin/auth/login 
net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH
```

This error indicates the SSL/TLS certificate for `api.contrezz.com` is invalid, expired, or misconfigured.

---

## Root Causes

1. **SSL Certificate Not Provisioned**: Domain added but certificate not yet issued
2. **Certificate Expired**: SSL certificate has expired
3. **DNS Mismatch**: DNS points to wrong server or certificate doesn't match domain
4. **Certificate Chain Incomplete**: Missing intermediate certificates
5. **TLS Version Mismatch**: Server/client TLS version incompatibility

---

## Step-by-Step Fix

### Step 1: Verify DNS Configuration

**Check current DNS:**
```bash
dig api.contrezz.com +short
```

**Expected Result:**
Should return the DigitalOcean app's default domain, something like:
```
contrezz-public-api-xxxxx.ondigitalocean.app
```

**If DNS is wrong:**
1. Go to Namecheap (or your DNS provider)
2. Find CNAME record for `api`
3. Update to point to: `contrezz-public-api-xxxxx.ondigitalocean.app`
   (Get exact domain from DigitalOcean → App → Settings → Domains)

---

### Step 2: Check DigitalOcean SSL Status

1. **Go to DigitalOcean App Platform**
   - https://cloud.digitalocean.com/apps

2. **Select `contrezz-public-api` app**

3. **Go to Settings → Domains**

4. **Check `api.contrezz.com` status:**
   - ✅ **Active/Valid**: Certificate is working
   - ⚠️ **Pending**: Certificate is being provisioned (wait 5-10 minutes)
   - ❌ **Failed/Invalid**: Certificate needs to be regenerated

---

### Step 3: Fix SSL Certificate

#### Option A: Certificate is Pending

**If status shows "Pending":**
- Wait 5-10 minutes for automatic provisioning
- Refresh the page to check status
- SSL certificates are provisioned automatically by DigitalOcean

#### Option B: Certificate Failed or Invalid

**If status shows "Failed" or "Invalid":**

1. **Remove the domain:**
   - In DigitalOcean → App → Settings → Domains
   - Find `api.contrezz.com`
   - Click **Remove** or **Delete**
   - Confirm removal

2. **Wait 2-3 minutes** (let DNS propagate)

3. **Re-add the domain:**
   - Click **Add Domain**
   - Enter: `api.contrezz.com`
   - Click **Add**
   - DigitalOcean will automatically provision SSL certificate

4. **Wait 5-10 minutes** for certificate provisioning

5. **Verify certificate:**
   ```bash
   curl -vI https://api.contrezz.com/health
   ```
   
   Should show:
   ```
   * SSL certificate verify ok
   * SSL connection using TLSv1.3
   ```

#### Option C: Force Certificate Renewal

**If certificate exists but still failing:**

1. **Remove domain** (as in Option B)
2. **Wait 5 minutes**
3. **Re-add domain** (as in Option B)
4. **Wait for new certificate**

---

### Step 4: Verify SSL Certificate

**Test SSL connection:**
```bash
# Test SSL handshake
openssl s_client -connect api.contrezz.com:443 -servername api.contrezz.com

# Test HTTPS endpoint
curl -vI https://api.contrezz.com/health

# Test with specific TLS version
curl --tlsv1.2 -vI https://api.contrezz.com/health
curl --tlsv1.3 -vI https://api.contrezz.com/health
```

**Expected Output:**
```
* SSL certificate verify ok
* SSL connection using TLSv1.3
* Server certificate:
*  subject: CN=api.contrezz.com
*  issuer: C=US; O=Let's Encrypt; CN=R3
```

**If you see errors:**
- `SSL certificate problem`: Certificate not valid
- `SSL connect error`: Server not accepting connections
- `SSL routines`: TLS version mismatch

---

### Step 5: Check Backend Configuration

**Verify backend is running:**
```bash
# Check health endpoint (bypass SSL for testing)
curl -k https://api.contrezz.com/health

# Check if backend is responding
curl -v https://api.contrezz.com/health
```

**If backend is not responding:**
1. Check DigitalOcean → App → Runtime Logs
2. Verify app is deployed and running
3. Check for deployment errors

---

### Step 6: Test Admin Login After Fix

1. **Wait for SSL certificate to be active** (5-10 minutes after adding domain)

2. **Test in browser:**
   - Go to `https://admin.contrezz.com`
   - Open DevTools → Console
   - Try logging in
   - Should see no SSL errors

3. **Test API directly:**
   ```bash
   curl -X POST https://api.contrezz.com/api/admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}' \
     -v
   ```

---

## Troubleshooting

### Issue: Certificate Still Pending After 15 Minutes

**Solution:**
1. Check DNS is correct: `dig api.contrezz.com +short`
2. Verify domain is added in DigitalOcean
3. Check DigitalOcean status page for issues
4. Try removing and re-adding domain

### Issue: Certificate Shows Valid But Still Getting Errors

**Possible Causes:**
1. **Browser cache**: Clear browser cache and cookies
2. **CDN/Proxy**: If using Cloudflare or similar, check SSL settings
3. **DNS propagation**: Wait up to 48 hours for full propagation
4. **TLS version**: Server might not support browser's TLS version

**Solutions:**
```bash
# Clear browser cache
# Chrome: Ctrl+Shift+Delete → Clear cached images and files

# Test from different network
# Use mobile data or different WiFi

# Check TLS version support
openssl s_client -connect api.contrezz.com:443 -tls1_2
openssl s_client -connect api.contrezz.com:443 -tls1_3
```

### Issue: DNS Points to Wrong Server

**Check DNS:**
```bash
dig api.contrezz.com +short
```

**If wrong:**
1. Go to Namecheap → DNS Management
2. Find CNAME record for `api`
3. Update to correct DigitalOcean app domain
4. Wait 5-10 minutes for DNS propagation

**Get correct domain from DigitalOcean:**
1. DigitalOcean → App → Settings → Domains
2. Look for default domain (e.g., `contrezz-public-api-xxxxx.ondigitalocean.app`)
3. Use this as CNAME target

### Issue: Certificate Chain Incomplete

**If certificate exists but chain is incomplete:**

DigitalOcean should handle this automatically, but if issues persist:

1. **Check certificate chain:**
   ```bash
   openssl s_client -connect api.contrezz.com:443 -showcerts
   ```

2. **Verify intermediate certificates are included**

3. **If missing, contact DigitalOcean support**

---

## Quick Checklist

- [ ] DNS points to correct DigitalOcean app domain
- [ ] Domain is added in DigitalOcean → App → Settings → Domains
- [ ] SSL certificate status is "Active" or "Valid"
- [ ] Waited 5-10 minutes after adding domain
- [ ] Tested SSL connection: `curl -vI https://api.contrezz.com/health`
- [ ] Backend is running (check DigitalOcean logs)
- [ ] Cleared browser cache
- [ ] Tested from different network/browser

---

## Verification Commands

```bash
# 1. Check DNS
dig api.contrezz.com +short

# 2. Test SSL certificate
openssl s_client -connect api.contrezz.com:443 -servername api.contrezz.com

# 3. Test HTTPS endpoint
curl -vI https://api.contrezz.com/health

# 4. Test admin login endpoint
curl -X POST https://api.contrezz.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v

# 5. Check certificate expiration
echo | openssl s_client -connect api.contrezz.com:443 -servername api.contrezz.com 2>/dev/null | openssl x509 -noout -dates
```

---

## Expected Timeline

- **DNS Update**: 5-10 minutes (usually instant)
- **SSL Certificate Provisioning**: 5-10 minutes
- **Full Propagation**: Up to 48 hours (usually < 1 hour)

**Most issues resolve within 15-30 minutes after fixing DNS and re-adding domain.**

---

## Still Not Working?

If SSL certificate is still failing after following all steps:

1. **Check DigitalOcean Status**: https://status.digitalocean.com/
2. **Check App Logs**: DigitalOcean → App → Runtime Logs
3. **Contact DigitalOcean Support**: They can manually provision certificates
4. **Alternative**: Use Let's Encrypt manually (not recommended, DigitalOcean should handle it)

---

**Last Updated:** December 15, 2025  
**Status:** SSL certificate fix guide
