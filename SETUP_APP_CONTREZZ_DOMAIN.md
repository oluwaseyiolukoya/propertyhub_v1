# Setup app.contrezz.com Domain

## Current Setup

- **Frontend:** `https://contrezz.com` ✅ (working)
- **Backend FRONTEND_URL:** `https://contrezz.com`
- **Public API:** `https://api.contrezz.com` (contrezz-public-api)
- **App API:** `https://api.app.contrezz.com` (contrezz-backend-prod)

## Option 1: Same Frontend for Both Domains (Simpler)

If you want `app.contrezz.com` to use the **same frontend deployment** as `contrezz.com`:

### Step 1: Add DNS Record

1. Go to Namecheap: https://www.namecheap.com/myaccount/login/
2. Domain List → Manage → Advanced DNS
3. Add CNAME record:
   - **Type:** CNAME
   - **Host:** `app`
   - **Value:** `contrezz.com` (or the actual frontend URL if different)
   - **TTL:** Automatic
4. Click checkmark to save

### Step 2: Add Domain in Frontend App (if using DigitalOcean)

1. Go to your frontend app in DigitalOcean
2. Settings → Domains
3. Click "Add Domain"
4. Enter: `app.contrezz.com`
5. Click "Add Domain"
6. Wait 5-10 minutes for SSL certificate

### Step 3: Update Backend FRONTEND_URL (Optional)

If you want the backend to recognize `app.contrezz.com`:

1. Go to backend component settings
2. Environment Variables
3. Update `FRONTEND_URL` to include both:
   ```
   https://contrezz.com,https://app.contrezz.com
   ```
   Or keep it as `https://contrezz.com` if you want to handle routing in the frontend

### Result

- `contrezz.com` → Frontend (public pages)
- `app.contrezz.com` → Same frontend (app pages)
- Frontend code handles routing based on domain

---

## Option 2: Separate Frontend Deployment (True Split)

If you want a **separate frontend deployment** for `app.contrezz.com`:

### Step 1: Create New Frontend App (or Component)

1. Go to DigitalOcean Apps
2. Create new app OR add static site component to existing app
3. Configure:
   - Source: Same GitHub repo
   - Branch: `main` (or create `app` branch)
   - Build command: `npm ci && npm run build`
   - Output directory: `dist`
   - Environment variables:
     - `VITE_API_URL=https://api.app.contrezz.com`
     - `VITE_PUBLIC_API_URL=https://api.contrezz.com/api`

### Step 2: Get Default Domain

After deployment, get the default domain:

- `https://xxxxxx.ondigitalocean.app`

### Step 3: Add DNS Record

1. Namecheap → Advanced DNS
2. Add CNAME:
   - **Host:** `app`
   - **Value:** `xxxxxx.ondigitalocean.app` (from step 2)
   - **TTL:** Automatic

### Step 4: Add Custom Domain

1. In the new frontend app
2. Settings → Domains
3. Add: `app.contrezz.com`
4. Wait for SSL certificate

### Step 5: Update Backend

1. Backend component → Environment Variables
2. Update `FRONTEND_URL`:
   ```
   https://app.contrezz.com
   ```
   Or keep both:
   ```
   https://contrezz.com,https://app.contrezz.com
   ```

### Result

- `contrezz.com` → Public frontend (landing, careers)
- `app.contrezz.com` → App frontend (dashboard, authenticated)
- Separate deployments, different environment variables

---

## Recommended Approach

**For now, use Option 1** (same frontend):

- Simpler setup
- No need for separate deployment
- Frontend can detect domain and show appropriate content
- Can split later if needed

**Use Option 2** if:

- You want completely separate deployments
- Different build configurations
- Different environment variables per domain

---

## Quick Setup (Option 1)

1. **Add DNS in Namecheap:**

   - CNAME: `app` → `contrezz.com`

2. **Add domain in DigitalOcean** (if frontend is on DO):

   - Settings → Domains → Add `app.contrezz.com`

3. **Wait 5-30 minutes** for DNS propagation

4. **Test:**

   ```bash
   dig app.contrezz.com +short
   curl -I https://app.contrezz.com
   ```

5. **Update backend CORS** (if needed):
   - Add `https://app.contrezz.com` to `ALLOWED_ORIGINS` in public backend
   - Add `https://app.contrezz.com` to `CORS_ORIGIN` in app backend

---

## Summary

**Current:**

- Frontend: `contrezz.com` ✅
- Backend knows: `FRONTEND_URL = https://contrezz.com`

**To add `app.contrezz.com`:**

1. Add DNS: `app` CNAME → `contrezz.com`
2. Add domain in frontend app (if on DigitalOcean)
3. Wait for SSL
4. Test access

**That's it!** Both domains will point to the same frontend, and your frontend code can handle routing based on the domain.

---

**Last Updated:** December 14, 2025
