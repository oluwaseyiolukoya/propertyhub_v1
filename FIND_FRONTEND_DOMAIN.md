# How to Find Your Frontend Domain in DigitalOcean

The domain/URL for your frontend static site is **not** shown on the component settings page. Here's where to find it:

## Method 1: App Overview Page (Easiest)

1. **Go to your App's main page** (not the component page)

   - Click the app name at the top (e.g., "propertyhub-v1" or similar)
   - Or go to: https://cloud.digitalocean.com/apps
   - Click on your application name to open its dashboard

2. **Look at the Overview tab**
   - The **default domain URL is displayed prominently at the top of the page**, just below the app's name
   - It appears as a **clickable link** in the format: `https://<app-name>-<unique-id>.ondigitalocean.app`
   - Example: `https://propertyhub-v1-abc123.ondigitalocean.app`
   - This is your app's default domain that's automatically assigned

## Method 2: Settings → Domains

1. **In the app's main page**, click **"Settings"** in the left sidebar
2. **Scroll down to the "Domains" section**
3. You'll see:
   - **Default domain**: `https://<app-name>-<unique-id>.ondigitalocean.app` (automatically assigned, cannot be disabled)
   - **Custom domains** (if any): `contrezz.com`, `app.contrezz.com`, etc.
   - Each domain shows its status (Active, Configuring, etc.)

## Method 3: Check Default Ingress

The default URL follows this pattern:

- `https://[app-name]-[random-id].ondigitalocean.app`

For example:

- `https://propertyhub-v1-xxxxx.ondigitalocean.app`

## Quick Check: Which App Has Your Frontend?

Your frontend component is part of an app. To find which app:

1. **In the component page you're viewing:**

   - Look at the breadcrumb at the top
   - It should show: `Apps > [App Name] > Components > frontend`
   - Click on the app name in the breadcrumb

2. **Or check all apps:**
   ```bash
   doctl apps list
   ```
   Look for an app that has a static site component

## What You're Looking For

You need to find:

- **Default domain:** `https://xxxxxx.ondigitalocean.app` (this is your frontend URL)
- **Custom domain:** If `app.contrezz.com` is already configured, it will show here

## If No Domain is Configured

If you don't see `app.contrezz.com` in the Domains section:

1. **Click "Add Domain"** in Settings → Domains
2. **Enter:** `app.contrezz.com`
3. **Click "Add Domain"**
4. **Add DNS record in Namecheap:**
   - Type: CNAME
   - Host: `app`
   - Value: `[your-default-domain].ondigitalocean.app`
   - TTL: Automatic

## Next Steps

Once you find the domain:

1. **If default domain exists:** Use it to set up DNS for `app.contrezz.com`
2. **If custom domain exists:** It's already configured, just verify DNS
3. **If no domain:** Add it following the steps above

---

**Tip:** The domain is always shown on the **app's main Overview page**, not on individual component pages.
