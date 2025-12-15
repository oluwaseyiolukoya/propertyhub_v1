# Production Admin Subdomain - Quick Reference

Quick checklist for setting up `admin.contrezz.com` in production.

## ⚡ Quick Steps

### 1. DNS Configuration (Namecheap)

```
Type: CNAME
Host: admin
Value: [your-frontend-app-default-domain].ondigitalocean.app
TTL: Automatic (or 5 min for testing)
```

### 2. DigitalOcean Frontend App

**Settings → Domains → Add Domain:**

- Domain: `admin.contrezz.com`
- DNS Provider: External (Namecheap)
- Wait for SSL (5-10 minutes)

### 3. Frontend Environment Variables

```env
VITE_PUBLIC_ADMIN_API_URL=https://api.contrezz.com/api/admin
```

### 4. Backend Environment Variables

```env
ALLOWED_ORIGINS=https://admin.contrezz.com,http://localhost:5173
PUBLIC_ADMIN_JWT_SECRET=[your-secret-key]
PUBLIC_ADMIN_JWT_EXPIRES_IN=24h
```

### 5. Verify

```bash
# Check DNS
dig admin.contrezz.com +short

# Test access
curl -I https://admin.contrezz.com
```

## ✅ Checklist

- [ ] CNAME record added in Namecheap
- [ ] Custom domain added in DigitalOcean
- [ ] SSL certificate active
- [ ] Frontend env vars set
- [ ] Backend env vars set
- [ ] DNS resolves correctly
- [ ] HTTPS works (green lock)
- [ ] Admin login page loads
- [ ] Can log in successfully

## 🔗 Full Guide

See `PRODUCTION_ADMIN_SUBDOMAIN_SETUP.md` for detailed instructions.
