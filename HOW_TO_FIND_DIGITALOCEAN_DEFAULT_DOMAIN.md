# How to Find Your DigitalOcean App Default Domain

## Quick Answer

The default domain is found in **Settings → Domains** section. It may NOT always be visible on the Overview page, especially when custom domains are configured.

## Detailed Steps

### Method 1: Settings → Domains (Most Reliable) ✅

1. **Go to DigitalOcean Apps:**

   - https://cloud.digitalocean.com/apps
   - Log in to your account

2. **Select Your Application:**

   - Click on the name of your application

3. **Go to Settings:**

   - Click **Settings** tab in the left sidebar

4. **Scroll to Domains Section:**
   - Scroll down to the **"Domains"** section
   - You'll see:
     - **Default domain**: `https://<app-name>-<unique-id>.ondigitalocean.app` (always listed here)
     - **Custom domains** (if any): Listed below with their status
   - Copy the default domain (remove `https://` prefix for DNS - you only need the domain part)
   - Format: `<app-name>-<unique-id>.ondigitalocean.app`
   - Example: `propertyhub-v1-abc123.ondigitalocean.app`

**This is the most reliable method** - the default domain is always visible here, even when custom domains are configured.

### Method 2: Overview Page (May Not Always Show)

1. **Go to your app's Overview page:**

   - Click **Overview** tab in the left sidebar

2. **Look for the default domain:**
   - Sometimes displayed at the top of the page, just below the app name
   - It appears as a **clickable link**
   - Format: `https://<app-name>-<unique-id>.ondigitalocean.app`
   - Example: `https://propertyhub-v1-abc123.ondigitalocean.app`

**Note:** This method is NOT reliable - the default domain may not be visible on the Overview page, especially when custom domains are configured. **Always use Method 1 (Settings → Domains) instead.**

## Important Notes

- **Default domain is always available** - It cannot be disabled
- **Format is consistent**: `https://<app-name>-<unique-id>.ondigitalocean.app`
- **Automatically generated** during deployment
- **Use for DNS**: When adding custom domains, you'll point them to this default domain

## Example

If your app is named "propertyhub-v1", your default domain might be:

```
https://propertyhub-v1-abc123.ondigitalocean.app
```

## For Your Use Case

To fix `app.contrezz.com` SSL error:

1. Find your default domain using Method 1 or 2 above
2. Update DNS in Namecheap: `app` CNAME → `your-default-domain.ondigitalocean.app`
3. Add domain in DigitalOcean: Settings → Domains → Add `app.contrezz.com`
4. Wait for SSL certificate (5-10 minutes)

---

**Source:** DigitalOcean App Platform Documentation
**Last Updated:** December 14, 2025
