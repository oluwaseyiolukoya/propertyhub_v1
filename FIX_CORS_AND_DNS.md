# Fix CORS and DNS Issues

## Issue 1: CORS Still Not Working

The CORS configuration is correct, but you need to **restart the backend** for changes to take effect.

### Steps to Fix CORS:

1. **Stop the public backend:**

   ```bash
   # In the terminal running public-backend
   # Press Ctrl+C
   ```

2. **Restart it:**

   ```bash
   cd public-backend
   npm run dev
   ```

3. **Verify CORS headers are returned:**

   ```bash
   curl -X OPTIONS http://localhost:5001/api/careers/filters \
     -H "Origin: http://localhost:5174" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: cache-control,pragma" \
     -v 2>&1 | grep "Access-Control"
   ```

   You should see:

   - `Access-Control-Allow-Origin: http://localhost:5174`
   - `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type,Authorization,Cache-Control,Pragma,Accept,Origin,X-Requested-With`

4. **Hard refresh browser:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

---

## Issue 2: app.contrezz.com Not Accessible

`app.contrezz.com` doesn't have a DNS record. You need to add it.

### Option A: If Frontend is on DigitalOcean App Platform

1. **Get your frontend app URL:**

   ```bash
   doctl apps list
   # Find your frontend app
   # Copy the default domain: xxxxxx.ondigitalocean.app
   ```

2. **Add DNS Record in Namecheap:**

   - Go to: https://www.namecheap.com/myaccount/login/
   - Domain List → Manage → Advanced DNS
   - Add CNAME record:
     - **Type:** CNAME
     - **Host:** `app`
     - **Value:** `xxxxxx.ondigitalocean.app` (your frontend app domain)
     - **TTL:** 300 (or Automatic)
   - Click checkmark to save

3. **Add Domain in DigitalOcean:**
   - Go to: https://cloud.digitalocean.com/apps
   - Click your frontend app
   - Settings → Domains
   - Click "Add Domain"
   - Enter: `app.contrezz.com`
   - Click "Add Domain"
   - Wait 5-10 minutes for SSL certificate

### Option B: If Frontend is on Vercel/Netlify

1. **Add DNS Record:**

   - Type: CNAME
   - Host: `app`
   - Value: `cname.vercel-dns.com` (Vercel) or `cname.netlify.com` (Netlify)
   - TTL: 300

2. **Configure in Vercel/Netlify:**
   - Add `app.contrezz.com` as a custom domain
   - Wait for DNS verification

### Option C: If Frontend is Self-Hosted

1. **Get your server IP:**

   ```bash
   doctl compute droplet list
   # Copy the IP address
   ```

2. **Add DNS Record:**
   - Type: A
   - Host: `app`
   - Value: `YOUR_SERVER_IP`
   - TTL: 300

---

## Quick Verification

After setting up DNS:

```bash
# Check DNS resolution
dig app.contrezz.com +short

# Should return an IP or CNAME target
```

Wait 5-30 minutes for DNS propagation, then test:

- `https://app.contrezz.com` should load your frontend

---

## Summary

1. **CORS:** Restart public backend → Hard refresh browser
2. **DNS:** Add `app` CNAME/A record in Namecheap → Add domain in DigitalOcean → Wait for SSL

---

**Last Updated:** December 14, 2025
