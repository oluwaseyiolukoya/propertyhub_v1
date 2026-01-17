# Landing Page Content Update Fix

## Problem
When updating the homepage content in the public admin, changes appear in local but not in production.

## Root Cause
The issue has multiple potential causes:

1. **Unpublished Page**: The home page exists in the database but `published = false`
2. **Caching**: Browser or CDN caching the old content
3. **Database Connection**: Production might be using a different database or connection
4. **Environment Variables**: The frontend might be pointing to the wrong API URL

## Solution

### ✅ Changes Made

1. **Added Cache-Busting Headers** (`public-backend/src/routes/landing-pages.ts`)
   - Added `Cache-Control: no-cache, no-store, must-revalidate` headers
   - Added `Pragma: no-cache` and `Expires: 0` headers
   - This prevents browsers and CDNs from caching the landing page content

2. **Enhanced Logging** (`public-backend/src/routes/admin/landing-pages.ts` and `landing-pages.ts`)
   - Added detailed console logs to track when content is fetched and updated
   - Logs now show `published` status, `publishedAt` timestamp, and `updatedAt` timestamp
   - This helps diagnose issues in production logs

3. **Created Verification Script** (`public-backend/scripts/verify-home-page.ts`)
   - Checks if home page exists in the database
   - Shows current published status
   - Automatically publishes the page if it's not published
   - Shows content preview

4. **Added Debug Endpoint** (Development only)
   - GET `/api/landing-pages/debug/home` 
   - Returns detailed information about the home page status
   - Only available in development mode

### 🔧 How to Fix in Production

#### Option 1: Run the Verification Script (Recommended)

```bash
# SSH into your production server
ssh your-production-server

# Navigate to the public-backend directory
cd /path/to/public-backend

# Run the verification script
npx tsx scripts/verify-home-page.ts
```

This script will:
- ✅ Check if the home page exists
- ✅ Show its current status (published or not)
- ✅ Automatically publish it if needed
- ✅ Show a preview of the content

#### Option 2: Manually Check and Publish via Database

```sql
-- Check if home page exists and its status
SELECT id, slug, title, published, "publishedAt", "updatedAt" 
FROM landing_pages 
WHERE slug = 'home';

-- If it exists but published = false, publish it
UPDATE landing_pages 
SET published = true, "publishedAt" = NOW() 
WHERE slug = 'home';
```

#### Option 3: Use the Public Admin UI

1. Go to: `https://contrezz.com/public-admin/login`
2. Login with your admin credentials
3. Navigate to: **Landing Pages** → **Home**
4. Make sure the page is **Published** (check the toggle or publish button)
5. Save the page again

### 🧪 Testing the Fix

#### Test in Local (Development)

1. **Check Debug Endpoint**:
   ```bash
   curl http://localhost:5001/api/landing-pages/debug/home
   ```
   
   This should return the home page status.

2. **Check Public Endpoint**:
   ```bash
   curl http://localhost:5001/api/landing-pages/slug/home
   ```
   
   This should return the published home page content.

3. **Update Content in Admin**:
   - Go to `http://localhost:3000/public-admin/landing-pages/home`
   - Make a change (e.g., update the hero headline)
   - Save
   - Refresh the landing page at `http://localhost:3000/`
   - The change should appear immediately

#### Test in Production

1. **Check the Public Endpoint**:
   ```bash
   curl https://api.contrezz.com/api/landing-pages/slug/home
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "page": {
       "id": "...",
       "slug": "home",
       "title": "Home",
       "published": true,
       "content": { ... },
       "updatedAt": "2026-01-17T..."
     }
   }
   ```

2. **Check Production Logs**:
   - Look for logs like:
     ```
     [Public Landing Pages] Fetching page with slug: home
     [Public Landing Pages] Found page: xxx, published: true
     [Public Landing Pages] Returning published page content for "home"
     ```

3. **Update Content**:
   - Go to `https://contrezz.com/public-admin/landing-pages/home`
   - Make a change
   - Save
   - **Hard refresh** the landing page (Ctrl+Shift+R or Cmd+Shift+R)
   - The change should appear

### 🔍 Troubleshooting

#### Issue: "Landing page not found" (404)

**Possible Causes**:
1. Home page doesn't exist in the database
2. Home page exists but `published = false`
3. Wrong database connection in production

**Solution**:
```bash
# Run the verification script
cd public-backend
npx tsx scripts/verify-home-page.ts
```

#### Issue: Changes save but don't appear on landing page

**Possible Causes**:
1. Browser caching
2. CDN caching (if using Cloudflare, Vercel, etc.)
3. Frontend fetching from wrong API URL

**Solution**:
1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
2. **Check frontend API URL**:
   ```typescript
   // In src/components/LandingPage.tsx, line 125-130
   const apiUrl =
     import.meta.env.VITE_PUBLIC_API_URL ||
     (import.meta.env.DEV
       ? "" // Use Vite proxy in dev
       : "https://api.contrezz.com/api");
   ```
   Make sure `VITE_PUBLIC_API_URL` is set correctly in production.

3. **Clear CDN cache** (if using one):
   - Cloudflare: Purge cache for `https://contrezz.com/`
   - Vercel: Redeploy or use the "Clear Cache" button

#### Issue: Content appears but is outdated

**Possible Causes**:
1. Multiple versions of the page in database
2. Cache not cleared
3. Frontend showing fallback/default content

**Solution**:
```sql
-- Check if there are multiple home pages
SELECT id, slug, title, published, "updatedAt" 
FROM landing_pages 
WHERE slug = 'home' OR slug LIKE '%home%';

-- Delete duplicates if found (keep only the latest)
DELETE FROM landing_pages 
WHERE slug = 'home' AND id != 'keep-this-id';
```

### 📋 Checklist for Production Deployment

Before deploying these changes to production:

- [ ] Verify `PUBLIC_DATABASE_URL` is set correctly in production `.env`
- [ ] Verify `VITE_PUBLIC_API_URL` is set to `https://api.contrezz.com/api` in frontend
- [ ] Run the verification script to check home page status
- [ ] Test the public endpoint: `curl https://api.contrezz.com/api/landing-pages/slug/home`
- [ ] Update content in admin and verify it appears on landing page
- [ ] Check production logs for any errors
- [ ] Clear CDN cache if using one

### 🚀 Deployment Steps

1. **Deploy Backend Changes**:
   ```bash
   cd public-backend
   git pull origin main
   npm install
   npm run build
   pm2 restart public-backend  # or your process manager
   ```

2. **Run Verification**:
   ```bash
   npx tsx scripts/verify-home-page.ts
   ```

3. **Deploy Frontend Changes** (if needed):
   ```bash
   cd ..
   git pull origin main
   npm install
   npm run build
   # Deploy to your hosting (Vercel, Netlify, etc.)
   ```

4. **Test**:
   - Visit `https://contrezz.com/`
   - Hard refresh (Ctrl+Shift+R)
   - Verify content is up to date

### 📞 Need Help?

If the issue persists after following these steps:

1. Check the production logs:
   ```bash
   pm2 logs public-backend --lines 100
   ```

2. Run the verification script and share the output:
   ```bash
   npx tsx scripts/verify-home-page.ts
   ```

3. Check the API response:
   ```bash
   curl -v https://api.contrezz.com/api/landing-pages/slug/home
   ```

4. Share these details for further diagnosis.

---

**Last Updated**: January 17, 2026  
**Status**: ✅ Fixed - Ready for testing

