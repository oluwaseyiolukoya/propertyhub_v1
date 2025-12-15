# How to Find Default Domain from Your Screenshot

Based on your screenshot, you're currently viewing the **component-level settings** for the "frontend" static site. The default domain is shown at the **app-level**, not component-level.

## What I See in Your Screenshot

- App: `contrezz-backend-prod`
- Component: `frontend` (Static Site) - Settings tab
- Custom domain shown: `https://contrezz.com` (at the top)
- Environment variables are visible

## Where to Find the Default Domain

### Option 1: Go to App Overview (Easiest)

1. **Click "Overview" tab** (at the top, next to "Settings")
   - Or click the app name "contrezz-backend-prod" at the top
2. **Look at the top of the Overview page**
   - Just below the app name
   - You'll see a clickable link like: `https://contrezz-backend-prod-xxxxx.ondigitalocean.app`
   - This is your default domain

### Option 2: App-Level Settings → Domains

1. **Make sure you're at the APP level, not component level:**

   - Click "Settings" tab (if not already there)
   - Make sure you're NOT in a component's settings
   - You should see tabs like: Overview, Insights, Activity, Runtime Logs, Console, Settings

2. **Scroll down in Settings:**
   - Look for a **"Domains"** section
   - This is at the APP level, not component level
   - You'll see:
     - Default domain: `https://contrezz-backend-prod-xxxxx.ondigitalocean.app`
     - Custom domains: `contrezz.com` (already there)

## Quick Navigation

From your current view:

1. Click **"Overview"** tab (top navigation)
2. Look at the top of the page for the default domain link
3. OR click the app name "contrezz-backend-prod" to go to app overview

## What You Need

The default domain will look like:

```
https://contrezz-backend-prod-xxxxx.ondigitalocean.app
```

Use this domain to:

- Point `app.contrezz.com` DNS to it
- Add `app.contrezz.com` as a custom domain in the Domains section

---

**Note:** The `https://contrezz.com` shown at the top of your screenshot is a custom domain, not the default domain. You need the `*.ondigitalocean.app` domain.
