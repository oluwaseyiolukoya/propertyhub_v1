# Restore DNS Records for app and api Hosts

Quick reference to restore the DNS records you accidentally removed.

## 🎯 Required DNS Records

You need to add back these DNS records in Namecheap:

### 1. `app` Host (for app.contrezz.com)

**Type:** CNAME  
**Host:** `app`  
**Value:** `[YOUR_FRONTEND_APP_DEFAULT_DOMAIN].ondigitalocean.app`  
**TTL:** Automatic (or 300)

**How to find the value:**

1. Go to DigitalOcean App Platform: https://cloud.digitalocean.com/apps
2. Click on your **frontend app** (the one with the static site component)
3. Look at the **Overview** page - the default domain is shown at the top
4. It will look like: `propertyhub-v1-abc123.ondigitalocean.app` or similar
5. Copy that entire domain (including `.ondigitalocean.app`)

**Example:**

```
Type: CNAME
Host: app
Value: propertyhub-v1-abc123.ondigitalocean.app
TTL: Automatic
```

---

### 2. `api` Host (for api.contrezz.com - Public API)

**Type:** CNAME  
**Host:** `api`  
**Value:** `[YOUR_PUBLIC_BACKEND_APP_DEFAULT_DOMAIN].ondigitalocean.app`  
**TTL:** Automatic (or 300)

**How to find the value:**

1. Go to DigitalOcean App Platform: https://cloud.digitalocean.com/apps
2. Click on your **public backend app** (usually named something like `contrezz-public-api`)
3. Look at the **Overview** page - the default domain is shown at the top
4. It will look like: `contrezz-public-api-hetj8.ondigitalocean.app` or similar
5. Copy that entire domain (including `.ondigitalocean.app`)

**Example:**

```
Type: CNAME
Host: api
Value: contrezz-public-api-hetj8.ondigitalocean.app
TTL: Automatic
```

---

### 3. `api.app` Host (for api.app.contrezz.com - App API) - If Needed

**Type:** CNAME  
**Host:** `api.app`  
**Value:** `[YOUR_APP_BACKEND_APP_DEFAULT_DOMAIN].ondigitalocean.app`  
**TTL:** Automatic (or 300)

**How to find the value:**

1. Go to DigitalOcean App Platform: https://cloud.digitalocean.com/apps
2. Click on your **app backend** (usually named something like `contrezz-backend-prod`)
3. Look at the **Overview** page - the default domain is shown at the top
4. It will look like: `contrezz-backend-prod-nnju5.ondigitalocean.app` or similar
5. Copy that entire domain (including `.ondigitalocean.app`)

**Example:**

```
Type: CNAME
Host: api.app
Value: contrezz-backend-prod-nnju5.ondigitalocean.app
TTL: Automatic
```

---

## 📋 Step-by-Step: Add Records in Namecheap

1. **Log in to Namecheap:**

   - Go to https://www.namecheap.com
   - Sign in to your account

2. **Navigate to Domain List:**

   - Click **Domain List** from the left sidebar
   - Find and click **Manage** next to `contrezz.com`

3. **Go to Advanced DNS:**

   - Click the **Advanced DNS** tab

4. **Add each record:**

   - Click **Add New Record**
   - Select **CNAME Record** from the dropdown
   - Fill in:
     - **Host:** `app` (for first record)
     - **Value:** Your frontend app default domain
     - **TTL:** `Automatic` (or `300` for faster testing)
   - Click the **✓** checkmark to save
   - Repeat for `api` and `api.app` if needed

5. **Verify records:**

   - You should see all three records listed:

     ```
     Type: CNAME Record
     Host: app
     Value: [your-frontend-app].ondigitalocean.app

     Type: CNAME Record
     Host: api
     Value: [your-public-backend-app].ondigitalocean.app

     Type: CNAME Record
     Host: api.app
     Value: [your-app-backend-app].ondigitalocean.app
     ```

---

## ✅ Verification

After adding the records, wait 5-10 minutes for DNS propagation, then verify:

```bash
# Check app.contrezz.com
dig app.contrezz.com +short
# Should return: [your-frontend-app].ondigitalocean.app or an IP

# Check api.contrezz.com
dig api.contrezz.com +short
# Should return: [your-public-backend-app].ondigitalocean.app or an IP

# Check api.app.contrezz.com (if you added it)
dig api.app.contrezz.com +short
# Should return: [your-app-backend-app].ondigitalocean.app or an IP
```

---

## 🎯 Summary Table

| Host      | Type  | Value                                     | Purpose                                 |
| --------- | ----- | ----------------------------------------- | --------------------------------------- |
| `app`     | CNAME | `[frontend-app].ondigitalocean.app`       | Application frontend (app.contrezz.com) |
| `api`     | CNAME | `[public-backend-app].ondigitalocean.app` | Public API (api.contrezz.com)           |
| `api.app` | CNAME | `[app-backend-app].ondigitalocean.app`    | App API (api.app.contrezz.com)          |

---

## 🔍 How to Find Your App Default Domains

### Method 1: Settings → Domains (Most Reliable) ✅

1. Go to: https://cloud.digitalocean.com/apps
2. Click on each app
3. Go to **Settings** tab (left sidebar)
4. Scroll down to **"Domains"** section
5. You'll see the **Default domain** listed there (always visible, cannot be disabled)
6. Copy the entire domain (e.g., `app-name-abc123.ondigitalocean.app`)
   - Remove the `https://` prefix - you only need the domain part for DNS

**This is the most reliable method** - the default domain is always visible here, even when custom domains are configured.

### Method 2: Overview Page (May Not Always Show)

1. Go to the **Overview** tab
2. Sometimes the default domain is shown at the top, but this is NOT reliable
3. If you don't see it, use Method 1 instead

### Method 3: Command Line (if you have doctl)

```bash
# List all apps
doctl apps list

# Get details for a specific app
doctl apps get [APP_ID]
```

---

## ⚠️ Important Notes

1. **Use CNAME, not A records** - DigitalOcean apps use CNAME records
2. **Include the full domain** - Must include `.ondigitalocean.app` at the end
3. **Wait for propagation** - DNS changes take 5-30 minutes
4. **Custom domains must be added** - After DNS is set, add custom domains in DigitalOcean:
   - Frontend app → Settings → Domains → Add `app.contrezz.com`
   - Public backend → Settings → Domains → Add `api.contrezz.com`
   - App backend → Settings → Domains → Add `api.app.contrezz.com`

---

## 🚨 If You're Not Sure Which Apps

Check your DigitalOcean apps:

1. **Frontend app** - Usually has a "Static Site" component
2. **Public backend** - Usually named something like `contrezz-public-api` or `public-backend`
3. **App backend** - Usually named something like `contrezz-backend-prod` or `backend`

If you only have one backend app, you might only need:

- `app` → Frontend app
- `api` → Backend app (serves both public and app APIs)

---

**Last Updated:** December 14, 2025  
**Status:** Quick reference for restoring DNS records
