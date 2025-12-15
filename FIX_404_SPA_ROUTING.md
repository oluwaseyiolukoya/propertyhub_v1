# Fix 404 Error for SPA Routes (app.contrezz.com/login)

## Problem

When accessing `https://app.contrezz.com/login`, you get a 404 error because:

- Static sites don't have server-side routing
- DigitalOcean needs to be configured to serve `index.html` for all routes
- This allows React's client-side routing to work

## Solution: Configure Catch-All Route

### Method 1: DigitalOcean Console (Recommended)

1. **Go to your app:**

   - https://cloud.digitalocean.com/apps
   - Click on `contrezz-backend-prod`

2. **Edit frontend component:**

   - Click **Settings** tab
   - Find **"frontend"** component (Static Site)
   - Click on it to edit

3. **Configure Custom Pages:**

   - Scroll to **"Custom Pages"** section
   - Click **"Edit"** button
   - Click **"Add Custom Page"** or **"Add"**
   - Configure:
     - **Type:** `Catchall` (or "Catch-all")
     - **Page Name:** `index.html`
   - Click **"Save"**

4. **Redeploy:**
   - DigitalOcean will automatically redeploy
   - Takes 3-5 minutes

### Method 2: Check if Already Configured

1. **Check current configuration:**
   - Settings → frontend component → Custom Pages
   - See if catch-all is already configured
   - If not, add it using Method 1

## What This Does

The catch-all route tells DigitalOcean:

- For any route that doesn't match a file (like `/login`)
- Serve `index.html` instead
- React then handles the routing client-side

## Expected Result

After configuration:

- ✅ `https://app.contrezz.com/` → Works
- ✅ `https://app.contrezz.com/login` → Works (serves index.html, React routes)
- ✅ `https://app.contrezz.com/dashboard` → Works
- ✅ All routes work correctly

## Verify It's Working

After redeployment (3-5 minutes):

1. **Test in browser:**

   - Visit: `https://app.contrezz.com/login`
   - Should see login page (not 404)

2. **Test other routes:**
   - `https://app.contrezz.com/dashboard`
   - `https://contrezz.com/careers`
   - All should work

## Alternative: Check DigitalOcean Documentation

If the Custom Pages option isn't available:

- DigitalOcean App Platform should handle SPA routing automatically
- The issue might be deployment-related
- Check if the latest code is deployed

## Troubleshooting

### If Still Getting 404:

1. **Verify deployment:**

   - Check Activity tab for latest deployment
   - Ensure it's "LIVE"

2. **Check build output:**

   - Verify `dist/index.html` exists
   - Check if routes are configured correctly

3. **Hard refresh:**

   - Clear browser cache
   - Use incognito mode

4. **Check DigitalOcean support:**
   - Contact support if catch-all option not available
   - They can configure it on their end

---

**Quick Fix:** Configure Custom Pages → Catchall → index.html in DigitalOcean console

---

**Last Updated:** December 14, 2025
