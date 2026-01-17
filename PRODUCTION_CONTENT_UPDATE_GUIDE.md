# 🚨 CRITICAL: Production Content Update Guide

## The Real Issue

You have **TWO SEPARATE DATABASES**:

1. **Local Database** (`localhost:5432/contrezz`) - Used in development
2. **Production Database** (DigitalOcean PostgreSQL) - Used by `https://api.contrezz.com`

When you update content in your **local** public admin, it only updates your **local** database.  
The production website (`https://contrezz.com`) fetches from the **production** database.

## ✅ Solution: Update Content in Production

### Option 1: Use Production Public Admin (Recommended)

1. **Go to Production Public Admin**:
   ```
   https://admin.contrezz.com/
   ```

2. **Login** with your production admin credentials

3. **Navigate to Landing Pages** → **Home**

4. **Make your changes**

5. **Save**

6. **Verify**:
   - Go to `https://contrezz.com/`
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Changes should appear immediately

### Option 2: Update Production Database Directly

If you need to sync your local changes to production:

#### Step 1: Export Local Content

```bash
cd public-backend

# Export the home page content from local database
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function exportContent() {
  const page = await prisma.landing_pages.findUnique({
    where: { slug: 'home' }
  });
  
  if (page) {
    console.log(JSON.stringify(page.content, null, 2));
  }
  
  await prisma.\$disconnect();
}

exportContent();
" > home-page-content.json
```

#### Step 2: Update Production Database

**Method A: Via Production Console**

1. SSH into your production server or use DigitalOcean console
2. Connect to the production database
3. Update the content:

```sql
-- First, check if home page exists
SELECT id, slug, title, published FROM landing_pages WHERE slug = 'home';

-- Update the content (replace with your JSON)
UPDATE landing_pages 
SET 
  content = '{ YOUR_JSON_CONTENT_HERE }',
  "updatedAt" = NOW(),
  published = true,
  "publishedAt" = CASE WHEN published = false THEN NOW() ELSE "publishedAt" END
WHERE slug = 'home';
```

**Method B: Via Script (Better)**

Create a script to update production:

```typescript
// public-backend/scripts/update-production-content.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PUBLIC_DATABASE_URL // Production DB
    }
  }
});

async function updateProduction() {
  try {
    // Read the exported content
    const content = JSON.parse(fs.readFileSync('home-page-content.json', 'utf-8'));
    
    // Update production database
    const updated = await prisma.landing_pages.update({
      where: { slug: 'home' },
      data: {
        content: content,
        published: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      }
    });
    
    console.log('✅ Production content updated successfully!');
    console.log('   Page ID:', updated.id);
    console.log('   Published:', updated.published);
    console.log('   Updated At:', updated.updatedAt);
  } catch (error) {
    console.error('❌ Error updating production:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProduction();
```

Run it:

```bash
# Set production database URL
export PUBLIC_DATABASE_URL="your-production-db-url"

# Run the script
npx tsx scripts/update-production-content.ts
```

### Option 3: Use Production Public Admin API Directly

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST https://api.contrezz.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@email.com","password":"your-password"}' \
  | jq -r '.token')

# 2. Get current home page
curl -s https://api.contrezz.com/api/admin/landing-pages/slug/home \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.page.content' > current-content.json

# 3. Edit current-content.json with your changes

# 4. Get the page ID
PAGE_ID=$(curl -s https://api.contrezz.com/api/admin/landing-pages/slug/home \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.page.id')

# 5. Update the page
curl -X PUT https://api.contrezz.com/api/admin/landing-pages/$PAGE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @update-payload.json
```

## 🔍 Verify Changes in Production

### 1. Check Public API Endpoint

```bash
curl -s https://api.contrezz.com/api/landing-pages/slug/home \
  | jq '.page.content.hero.headline'
```

This should show your updated headline.

### 2. Check Production Logs

```bash
# If using DigitalOcean
doctl apps logs <APP_ID> --follow

# Look for:
# [Public Landing Pages] Fetching page with slug: home
# [Public Landing Pages] Found page: xxx, published: true
# [Public Landing Pages] Returning published page content for "home"
```

### 3. Test the Website

1. Go to `https://contrezz.com/`
2. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
3. Check if your changes appear

If not appearing:
- **Clear browser cache completely**
- **Try incognito/private mode**
- **Check if Cloudflare is caching** (if using Cloudflare, purge cache)

## 🐛 Troubleshooting

### Issue: Changes appear in admin but not on landing page

**Cause**: Page is not published in production database

**Solution**:
```bash
# Run verification script against production
PUBLIC_DATABASE_URL="your-prod-db-url" npx tsx scripts/verify-home-page.ts
```

### Issue: "No token provided" error

**Cause**: Not authenticated or token expired

**Solution**:
1. Login again through `https://admin.contrezz.com/`
2. Check if your admin account exists in production database
3. Verify `ALLOWED_ORIGINS` includes `https://admin.contrezz.com`

### Issue: Career page shows error

**Cause**: Could be multiple issues

**Check**:
1. **Database connection**: Is production database accessible?
2. **Migrations**: Are all migrations applied to production?
3. **API logs**: What error is shown in production logs?

```bash
# Check production logs
doctl apps logs <APP_ID> --tail 100 | grep -i error

# Check if careers table exists
PUBLIC_DATABASE_URL="your-prod-db" psql -c "\dt career*"
```

### Issue: Content updates but reverts after refresh

**Cause**: Caching (browser, CDN, or server)

**Solution**:
1. **Clear browser cache**
2. **Purge CDN cache** (Cloudflare, etc.)
3. **Check cache headers** in the API response:
   ```bash
   curl -I https://api.contrezz.com/api/landing-pages/slug/home
   ```
   Should show:
   ```
   Cache-Control: no-cache, no-store, must-revalidate
   Pragma: no-cache
   Expires: 0
   ```

## 📋 Best Practices

### 1. Always Test in Production Admin

Don't test content changes locally and expect them to appear in production.  
Always use `https://admin.contrezz.com/` for production content updates.

### 2. Keep Local and Production Separate

- **Local**: For development and testing new features
- **Production**: For actual content management

### 3. Use Version Control for Code, Not Content

- ✅ Commit code changes to git
- ❌ Don't commit database content changes
- ✅ Use admin interface for content updates

### 4. Document Production Credentials

Keep your production admin credentials secure:
- Use a password manager
- Don't share credentials in code or git
- Rotate passwords regularly

## 🚀 Quick Checklist

When updating production content:

- [ ] Login to `https://admin.contrezz.com/`
- [ ] Navigate to the content you want to update
- [ ] Make your changes
- [ ] **Save** the changes
- [ ] Verify changes appear on `https://contrezz.com/`
- [ ] If not appearing, hard refresh (Ctrl+Shift+R)
- [ ] If still not appearing, check production logs
- [ ] If still not appearing, verify page is published

## 🆘 Emergency: Content Not Updating

If content is still not updating after all troubleshooting:

1. **Check if production backend is running**:
   ```bash
   curl https://api.contrezz.com/health
   ```

2. **Check database connection**:
   ```bash
   PUBLIC_DATABASE_URL="your-prod-db" psql -c "SELECT NOW();"
   ```

3. **Verify home page exists and is published**:
   ```bash
   PUBLIC_DATABASE_URL="your-prod-db" \
   npx tsx scripts/verify-home-page.ts
   ```

4. **Check production logs for errors**:
   ```bash
   doctl apps logs <APP_ID> --tail 200
   ```

5. **Restart production backend**:
   ```bash
   doctl apps create-deployment <APP_ID>
   ```

6. **Contact support** if issue persists

---

**Last Updated**: January 17, 2026  
**Status**: ✅ Critical - Read before updating production content

