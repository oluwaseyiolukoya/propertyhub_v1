# Production Setup: admin.contrezz.com

Complete guide to set up the public admin subdomain in production.

## 🎯 Overview

This guide will help you configure `admin.contrezz.com` to serve the public content admin interface in production.

**What you'll set up:**

- DNS CNAME record pointing to your DigitalOcean frontend app
- Custom domain in DigitalOcean App Platform
- SSL certificate (automatic)
- Environment variables for production
- Backend CORS configuration

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ Access to Namecheap DNS (or your DNS provider)
- ✅ Access to DigitalOcean App Platform
- ✅ Frontend app deployed on DigitalOcean
- ✅ Public backend deployed and accessible
- ✅ Production database configured

---

## Step 1: Find Your Frontend App Default Domain

1. **Go to DigitalOcean App Platform:**

   - https://cloud.digitalocean.com/apps
   - Log in to your account

2. **Select your frontend app:**

   - Click on the app that serves your frontend (the one with the static site component)

3. **Find the default domain:**

   - **Go to Settings → Domains** (this is the most reliable method)
   - Click **Settings** tab in the left sidebar
   - Scroll down to the **"Domains"** section
   - You'll see:
     - **Default domain**: `https://<app-name>-<unique-id>.ondigitalocean.app` (always listed here)
     - **Custom domains** (if any): Listed below with their status
   - Copy the default domain (remove `https://` prefix - you only need the domain part for DNS)
   - Format: `<app-name>-<unique-id>.ondigitalocean.app`
   - Example: `propertyhub-v1-abc123.ondigitalocean.app`

   **Important:** The default domain may NOT be visible on the Overview page, especially when custom domains are configured. Always use Settings → Domains to find it.

4. **Copy the default domain** - You'll need this for DNS configuration

---

## Step 2: Add CNAME Record in Namecheap

1. **Log in to Namecheap:**

   - Go to https://www.namecheap.com
   - Sign in to your account

2. **Navigate to Domain List:**

   - Click **Domain List** from the left sidebar
   - Find and click **Manage** next to `contrezz.com`

3. **Go to Advanced DNS:**

   - Click the **Advanced DNS** tab

4. **Add CNAME Record:**

   - Click **Add New Record**
   - Select **CNAME Record** from the dropdown
   - Fill in:
     - **Host**: `admin`
     - **Value**: `your-frontend-app-xxxxx.ondigitalocean.app` (the default domain from Step 1)
     - **TTL**: `Automatic` (or `5 min` for faster testing)
   - Click the **✓** checkmark to save

5. **Verify the record:**
   - You should see a new row:
     ```
     Type: CNAME Record
     Host: admin
     Value: your-frontend-app-xxxxx.ondigitalocean.app
     TTL: Automatic
     ```

**Note:** DNS propagation can take 5-60 minutes. For testing, use a low TTL (5 minutes).

---

## Step 3: Add Custom Domain in DigitalOcean

1. **In your frontend app dashboard:**

   - Go to **Settings** in the left sidebar
   - Scroll down to the **Domains** section

2. **Add the custom domain:**

   - Click **"Add Domain"** button
   - Enter: `admin.contrezz.com`
   - Choose DNS management:
     - **External DNS Provider** (since you're using Namecheap)
   - Click **"Add Domain"** to proceed

3. **Wait for SSL certificate:**

   - DigitalOcean will automatically provision an SSL certificate
   - This takes **5-10 minutes**
   - Status will show as:
     - "Configuring" → "Pending" → "Active"
   - You'll see a green checkmark when ready

4. **Verify domain status:**
   - In the Domains section, you should see:
     ```
     admin.contrezz.com
     Status: Active
     SSL: Valid
     ```

---

## Step 4: Configure Frontend Environment Variables

### In DigitalOcean App Platform:

1. **Go to your frontend app:**

   - Settings → **Environment Variables**

2. **Add/Update these variables:**

   ```env
   # Public Admin API URL (Production)
   VITE_PUBLIC_ADMIN_API_URL=https://api.contrezz.com/api/admin
   ```

   **Note:** Replace `api.contrezz.com` with your actual public backend domain if different.

3. **Save and redeploy:**
   - Click **Save**
   - DigitalOcean will automatically redeploy your app
   - Wait for deployment to complete

---

## Step 5: Configure Backend CORS

The public backend needs to allow requests from `admin.contrezz.com`.

### Update `public-backend/src/index.ts`:

1. **Find the CORS configuration** (or add it if missing):

   ```typescript
   import cors from "cors";

   const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
     "http://localhost:5173",
     "https://admin.contrezz.com",
   ];

   app.use(
     cors({
       origin: (origin, callback) => {
         // Allow requests with no origin (mobile apps, Postman, etc.)
         if (!origin) return callback(null, true);

         if (allowedOrigins.includes(origin)) {
           callback(null, true);
         } else {
           callback(new Error("Not allowed by CORS"));
         }
       },
       credentials: true,
     })
   );
   ```

2. **Set environment variable in DigitalOcean:**

   In your **public backend app** → Settings → Environment Variables:

   ```env
   ALLOWED_ORIGINS=https://admin.contrezz.com,http://localhost:5173
   ```

   **Note:** Include localhost for development if needed.

3. **Redeploy the backend:**
   - Save environment variables
   - DigitalOcean will automatically redeploy

---

## Step 6: Verify DNS Propagation

Wait 5-10 minutes after adding the CNAME record, then verify:

```bash
# Check DNS resolution
dig admin.contrezz.com +short

# Should return something like:
# your-frontend-app-xxxxx.ondigitalocean.app
# or an IP address
```

**Alternative check:**

```bash
# Using nslookup
nslookup admin.contrezz.com

# Should show the CNAME target
```

**If DNS hasn't propagated:**

- Wait 10-15 more minutes
- Check TTL is not too high (use 5 min for testing)
- Clear your local DNS cache:

  ```bash
  # macOS
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

  # Linux
  sudo systemd-resolve --flush-caches

  # Windows
  ipconfig /flushdns
  ```

---

## Step 7: Test Access

1. **Visit the admin interface:**

   - Open: `https://admin.contrezz.com`
   - You should see the public admin login page

2. **Check SSL certificate:**

   - Look for the green lock icon in your browser
   - Click it to verify the certificate is valid
   - Should show: "Issued by: Let's Encrypt"

3. **Test login:**

   - Use your public admin credentials
   - Should redirect to the dashboard

4. **Verify API connection:**
   - Open browser DevTools → Network tab
   - Check that API calls go to: `https://api.contrezz.com/api/admin/...`
   - Should return `200 OK` responses

---

## Step 8: Verify Routing Logic

The frontend should automatically detect the `admin.contrezz.com` subdomain and show the public admin interface.

**Check `src/App.tsx` has this logic:**

```typescript
const isAdminDomain =
  window.location.hostname === "admin.contrezz.com" ||
  window.location.hostname === "admin.contrezz.local" ||
  (isLocalDev && currentPath.startsWith("/admin"));
```

If this is already in place, routing should work automatically.

---

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] CNAME record added in Namecheap
- [ ] Custom domain added in DigitalOcean
- [ ] SSL certificate shows as "Active" in DigitalOcean
- [ ] `admin.contrezz.com` resolves correctly (`dig admin.contrezz.com`)
- [ ] `https://admin.contrezz.com` loads without SSL errors
- [ ] Green lock icon shows in browser
- [ ] Frontend environment variables set (`VITE_PUBLIC_ADMIN_API_URL`)
- [ ] Backend CORS allows `admin.contrezz.com`
- [ ] Backend environment variables set (`ALLOWED_ORIGINS`)
- [ ] Public admin login page loads correctly
- [ ] Can log in with public admin credentials
- [ ] API calls work (check Network tab in DevTools)

---

## 🚨 Troubleshooting

### Issue: DNS Not Resolving

**Symptoms:**

- `admin.contrezz.com` doesn't resolve
- Browser shows "This site can't be reached"

**Solutions:**

1. Wait 10-15 minutes for DNS propagation
2. Verify CNAME record in Namecheap is correct
3. Check TTL is not too high (use 5 min for testing)
4. Clear DNS cache (see Step 6)
5. Verify the target domain is correct (should be your frontend app's default domain)

---

### Issue: SSL Certificate Not Provisioning

**Symptoms:**

- Domain resolves but shows SSL error
- "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"
- Certificate shows as "Pending" in DigitalOcean

**Solutions:**

1. Wait 5-10 minutes after adding domain
2. Verify DNS is resolving correctly first
3. Check domain is correctly added in DigitalOcean
4. Ensure DNS points to the correct app
5. Check DigitalOcean app logs for SSL errors
6. Try removing and re-adding the domain

---

### Issue: Frontend Not Loading Admin Interface

**Symptoms:**

- Domain loads but shows wrong content
- Shows main app instead of admin interface
- 404 errors

**Solutions:**

1. Verify routing logic in `src/App.tsx` detects `admin.contrezz.com`
2. Check environment variables are set correctly
3. Ensure frontend app is deployed with latest code
4. Check browser console for errors
5. Verify `VITE_PUBLIC_ADMIN_API_URL` is set correctly

---

### Issue: CORS Errors

**Symptoms:**

- Browser console shows: "CORS policy: No 'Access-Control-Allow-Origin' header"
- API calls fail with CORS errors

**Solutions:**

1. Verify `ALLOWED_ORIGINS` includes `https://admin.contrezz.com`
2. Check backend CORS configuration
3. Ensure backend is redeployed after CORS changes
4. Verify the origin in the error matches exactly (including `https://`)
5. Check backend logs for CORS errors

---

### Issue: API Calls Failing

**Symptoms:**

- Login fails
- API returns 404 or 500 errors
- Network tab shows failed requests

**Solutions:**

1. Verify `VITE_PUBLIC_ADMIN_API_URL` is correct
2. Check public backend is deployed and running
3. Verify backend routes are correct (`/api/admin/...`)
4. Check backend logs for errors
5. Test backend health endpoint: `https://api.contrezz.com/api/health`

---

## 📝 Environment Variables Summary

### Frontend (DigitalOcean App Platform):

```env
VITE_PUBLIC_ADMIN_API_URL=https://api.contrezz.com/api/admin
```

### Public Backend (DigitalOcean App Platform):

```env
# JWT Configuration
PUBLIC_ADMIN_JWT_SECRET=your-generated-secret-key-minimum-32-characters
PUBLIC_ADMIN_JWT_EXPIRES_IN=24h

# CORS Configuration
ALLOWED_ORIGINS=https://admin.contrezz.com,http://localhost:5173

# Database
PUBLIC_DATABASE_URL=postgresql://user:password@host:port/database
```

**Security Note:** Never commit these values to git. Set them in DigitalOcean's environment variables interface.

---

## 🔗 Related Documentation

- `SETUP_ADMIN_SUBDOMAIN.md` - Basic setup guide
- `ENV_VARIABLES_SETUP.md` - Environment variables details
- `PUBLIC_ADMIN_COMPLETE_SUMMARY.md` - Public admin overview
- `ACCESS_PUBLIC_ADMIN.md` - How to access admin interface

---

## 🎯 Next Steps

After setup is complete:

1. ✅ Test all admin features
2. ✅ Create additional admin users if needed
3. ✅ Set up monitoring/alerts
4. ✅ Document admin user creation process
5. ✅ Consider setting up backup admin access method

---

**Status**: Production setup guide ready  
**Last Updated**: December 14, 2025
