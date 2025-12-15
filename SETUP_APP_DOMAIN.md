# Setup app.contrezz.com Domain

Based on your DigitalOcean apps, here's how to set up `app.contrezz.com`:

## Current Apps

From `doctl apps list`:

- `contrezz-public-api` → `contrezz-public-api-hetj8.ondigitalocean.app`
- `contrezz-backend-prod` → `contrezz-backend-prod-nnju5.ondigitalocean.app`

## Where is Your Frontend?

Your frontend needs to be accessible for `app.contrezz.com` to work. Check:

### Option 1: Frontend is on DigitalOcean (as Static Site)

If your frontend is deployed as a static site on DigitalOcean:

1. **Find your frontend app:**

   ```bash
   # Check DigitalOcean console:
   # https://cloud.digitalocean.com/apps
   # Look for an app with a static site component
   ```

2. **Get the default domain:**
   - It should look like: `xxxxxx.ondigitalocean.app`
   - Or check if `contrezz.com` is already configured

### Option 2: Frontend is on Vercel/Netlify

If your frontend is on Vercel or Netlify:

1. **Get the deployment URL:**

   - Vercel: Check your Vercel dashboard
   - Netlify: Check your Netlify dashboard

2. **Add DNS Record:**
   - Type: CNAME
   - Host: `app`
   - Value: `cname.vercel-dns.com` (Vercel) or `cname.netlify.com` (Netlify)

### Option 3: Frontend Not Deployed Yet

If your frontend isn't deployed yet:

1. **Deploy frontend to DigitalOcean:**

   - Create a new app or add static site to existing app
   - Use the `app.yaml` configuration
   - Deploy from GitHub

2. **Then follow Option 1**

---

## Step-by-Step: Add app.contrezz.com DNS

### Step 1: Find Frontend URL

**If frontend is on DigitalOcean:**

```bash
# Check DigitalOcean console for static site
# Or check if contrezz.com already works:
curl -I https://contrezz.com
```

**If `contrezz.com` works:**

- Your frontend might be at `contrezz.com`
- `app.contrezz.com` should point to the same place OR a different deployment

### Step 2: Add DNS Record in Namecheap

1. Go to: https://www.namecheap.com/myaccount/login/
2. Domain List → Manage next to `contrezz.com`
3. Advanced DNS tab
4. In Host Records, click **Add New Record**
5. Add:
   - **Type:** CNAME
   - **Host:** `app`
   - **Value:**
     - If DigitalOcean: `your-frontend-app.ondigitalocean.app`
     - If Vercel: `cname.vercel-dns.com`
     - If Netlify: `cname.netlify.com`
     - If same as main site: `contrezz.com` (or use A record with IP)
   - **TTL:** Automatic (or 300)
6. Click checkmark to save

### Step 3: Add Domain in DigitalOcean (if using DO)

1. Go to: https://cloud.digitalocean.com/apps
2. Find your frontend app (or create one)
3. Settings → Domains
4. Click "Add Domain"
5. Enter: `app.contrezz.com`
6. Click "Add Domain"
7. Wait 5-10 minutes for SSL certificate

### Step 4: Verify

Wait 5-30 minutes for DNS propagation, then:

```bash
# Check DNS
dig app.contrezz.com +short

# Test access
curl -I https://app.contrezz.com
```

---

## Quick Check: Where is contrezz.com?

```bash
# Check where contrezz.com points
dig contrezz.com +short

# Test if it loads
curl -I https://contrezz.com
```

If `contrezz.com` works, you can:

- Point `app.contrezz.com` to the same frontend (if you want same deployment)
- OR point `app.contrezz.com` to a different deployment (for split architecture)

---

## For Split Architecture

Based on your setup:

- `contrezz.com` → Public frontend (landing, careers, blog)
- `app.contrezz.com` → App frontend (dashboard, authenticated pages)

Both can use the same codebase but different:

- Environment variables
- Build configurations
- Deployments

---

**Next Steps:**

1. Find where your frontend is deployed
2. Add DNS record for `app` subdomain
3. Configure domain in hosting platform
4. Wait for SSL certificate

---

**Last Updated:** December 14, 2025
