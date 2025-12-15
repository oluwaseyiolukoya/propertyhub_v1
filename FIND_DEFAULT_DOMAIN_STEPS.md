# Find Your Default Domain - Step by Step

Based on your screenshot, the default domain isn't visible on the Overview page. Here's how to find it:

## Method 1: Settings → Domains (Recommended)

1. **Click "Settings" tab** (top navigation, next to "Overview")

2. **Scroll down** to find the **"Domains"** section

   - This is at the APP level (not component level)
   - You should see:
     - **Default domain**: `https://contrezz-backend-prod-xxxxx.ondigitalocean.app`
     - **Custom domains**: `contrezz.com` (already configured)

3. **Copy the default domain** - it will look like:
   ```
   https://contrezz-backend-prod-xxxxx.ondigitalocean.app
   ```

## Method 2: Use doctl Command

If you have `doctl` installed:

```bash
doctl apps list --format ID,Spec.Name,DefaultIngress --no-header | grep "contrezz-backend-prod"
```

This will show the default domain directly.

## Method 3: Check Component Details

Sometimes the default domain is shown in component details:

1. Click on the **"frontend"** component (Static Site)
2. Look for any domain/URL information
3. Or check the component's settings

## What You're Looking For

The default domain format is:

```
https://contrezz-backend-prod-<random-id>.ondigitalocean.app
```

## Once You Find It

1. **Update DNS in Namecheap:**

   - Edit `app` CNAME record
   - Change to: `app` → `contrezz-backend-prod-xxxxx.ondigitalocean.app`

2. **Add domain in DigitalOcean:**
   - Settings → Domains → Add `app.contrezz.com`

---

**Try Method 1 first** - it's the most reliable way to find it in the DigitalOcean UI.
