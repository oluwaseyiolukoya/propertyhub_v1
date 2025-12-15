# Setting Up admin.contrezz.com Subdomain

## 🎯 Goal

Configure `admin.contrezz.com` as the URL for the public content admin interface.

## 📋 DNS Configuration Steps

### Step 1: Get DigitalOcean Frontend App Domain

1. Go to DigitalOcean App Platform
2. Select your frontend app (the one serving `contrezz.com`)
3. Find the **Default Domain** (e.g., `contrezz-frontend-xxxxx.ondigitalocean.app`)
4. Copy this domain name

### Step 2: Add CNAME Record in Namecheap

1. Log in to Namecheap
2. Go to **Domain List** → Select `contrezz.com`
3. Click **Manage** → **Advanced DNS**
4. Add a new **CNAME Record**:
   - **Host**: `admin`
   - **Value**: `contrezz-frontend-xxxxx.ondigitalocean.app` (your frontend app's default domain)
   - **TTL**: Automatic (or 5 min for testing)
5. Click **Save**

### Step 3: Configure Custom Domain in DigitalOcean

1. In DigitalOcean App Platform, select your frontend app
2. Go to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter: `admin.contrezz.com`
5. Click **Add Domain**
6. DigitalOcean will automatically provision an SSL certificate (may take a few minutes)

### Step 4: Verify DNS Propagation

Wait 5-10 minutes for DNS to propagate, then verify:

```bash
# Check DNS resolution
dig admin.contrezz.com +short

# Should return something like:
# contrezz-frontend-xxxxx.ondigitalocean.app
# or an IP address
```

### Step 5: Test Access

1. Visit `https://admin.contrezz.com` in your browser
2. You should see your frontend app (may need to add routing logic)
3. SSL certificate should be valid (green lock icon)

## 🔧 Frontend Configuration

### Update Environment Variables

Add to your frontend `.env` (or DigitalOcean environment variables):

```env
# Public Admin Domain
VITE_PUBLIC_ADMIN_DOMAIN=https://admin.contrezz.com
```

### Update Routing Logic

In `src/App.tsx`, add logic to detect admin subdomain:

```typescript
// Detect if we're on admin subdomain
const isAdminDomain =
  window.location.hostname === "admin.contrezz.com" ||
  window.location.hostname === "admin.contrezz.local";

// Route to public admin interface
if (isAdminDomain) {
  // Show public admin interface
  return <PublicAdminRouter />;
}
```

## 🧪 Local Development Setup

For local development, add to `/etc/hosts`:

```
127.0.0.1 admin.contrezz.local
```

Then access at: `http://admin.contrezz.local:5173`

## ✅ Verification Checklist

- [ ] CNAME record added in Namecheap
- [ ] Custom domain added in DigitalOcean
- [ ] SSL certificate provisioned (check in browser)
- [ ] `admin.contrezz.com` resolves correctly
- [ ] Frontend routing detects admin subdomain
- [ ] Public admin interface loads correctly
- [ ] Local development setup works (`admin.contrezz.local`)

## 🚨 Troubleshooting

### DNS Not Resolving

**Issue**: `admin.contrezz.com` doesn't resolve

**Solutions**:

1. Wait 10-15 minutes for DNS propagation
2. Check CNAME record in Namecheap is correct
3. Verify TTL is not too high (use 5 min for testing)
4. Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)

### SSL Certificate Not Provisioning

**Issue**: SSL certificate not available

**Solutions**:

1. Wait 5-10 minutes after adding domain
2. Check domain is correctly added in DigitalOcean
3. Verify DNS is resolving correctly
4. Check DigitalOcean app logs for SSL errors

### Frontend Not Loading

**Issue**: Domain resolves but shows 404 or wrong content

**Solutions**:

1. Verify frontend routing logic detects admin subdomain
2. Check environment variables are set correctly
3. Ensure frontend app is deployed with latest code
4. Check browser console for errors

## 📝 Notes

- **DNS Propagation**: Can take 5-60 minutes depending on TTL
- **SSL Certificate**: DigitalOcean automatically provisions Let's Encrypt certificates
- **Local Development**: Use `admin.contrezz.local` for local testing
- **CORS**: Update backend CORS settings to allow `admin.contrezz.com`

## 🔗 Related Documentation

- `PUBLIC_CONTENT_ADMIN_ARCHITECTURE.md` - Full architecture
- `PUBLIC_ADMIN_IMPLEMENTATION_PLAN.md` - Implementation steps
- `FIX_APP_DOMAIN_SSL.md` - Similar setup for app.contrezz.com

---

**Status**: Ready for DNS configuration  
**Next Step**: Add CNAME record in Namecheap
