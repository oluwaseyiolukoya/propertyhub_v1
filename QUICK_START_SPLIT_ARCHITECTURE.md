# Quick Start: Split Architecture on DigitalOcean

This is a condensed guide to get you up and running quickly with the split architecture.

## ⚡ Prerequisites

1. **DigitalOcean Account** with payment method
2. **doctl CLI** installed and authenticated
3. **Git repository** connected to GitHub
4. **Domain** ready (e.g., contrezz.com)

## 🚀 5-Minute Setup

### Step 1: Install doctl (if needed)

```bash
# macOS
brew install doctl

# Or download from
# https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init
```

### Step 2: Run Setup Script

```bash
# From project root
chmod +x scripts/setup-digitalocean-split-architecture.sh
./scripts/setup-digitalocean-split-architecture.sh
```

This script will:

- ✅ Create public database
- ✅ Create app database
- ✅ Configure firewalls
- ✅ Deploy public backend
- ✅ Deploy app backend

### Step 3: Save Connection Strings

After the script runs, save the database URLs:

```bash
# For public-backend/.env
PUBLIC_DATABASE_URL=postgresql://doadmin:...@...

# For backend/.env (app)
DATABASE_URL=postgresql://doadmin:...@...
```

### Step 4: Run Migrations

**Public Database:**

```bash
cd public-backend
npm install
npx prisma generate
npx prisma migrate deploy
cd ..
```

**App Database:**

```bash
cd backend
npx prisma migrate deploy
cd ..
```

### Step 5: Migrate Data

```bash
# Export environment variables
export APP_DATABASE_URL="postgresql://..."
export PUBLIC_DATABASE_URL="postgresql://..."

# Run migration script
./scripts/migrate-careers-to-public.sh
```

### Step 6: Configure DNS

Add these DNS records at your domain registrar:

| Type  | Host    | Value                                 |
| ----- | ------- | ------------------------------------- |
| CNAME | api     | `your-public-app.ondigitalocean.app`  |
| CNAME | api.app | `your-app-backend.ondigitalocean.app` |
| A     | @       | Your public frontend IP               |
| A     | app     | Your app frontend IP                  |

### Step 7: Test

```bash
# Test public API
PUBLIC_API_URL=https://api.contrezz.com ./scripts/test-public-api.sh

# Or test locally first
cd public-backend
npm run dev
# In another terminal:
./scripts/test-public-api.sh
```

## 📋 Verification Checklist

After setup, verify these work:

- [ ] Public API health check: `https://api.contrezz.com/health`
- [ ] Careers list: `https://api.contrezz.com/api/careers`
- [ ] App API health check: `https://api.app.contrezz.com/health`
- [ ] Frontend can fetch from public API
- [ ] Admin can manage careers in app backend
- [ ] SSL certificates are active

## 🎯 What You Get

### Public Backend (`api.contrezz.com`)

- **Port:** 5001 (internal 8080)
- **Database:** contrezz_public
- **Purpose:** Serve public content (careers, blog, landing pages)
- **No Auth:** Public endpoints only

### App Backend (`api.app.contrezz.com`)

- **Port:** 5000 (internal 8080)
- **Database:** contrezz_app
- **Purpose:** User data, subscriptions, authentication
- **Auth Required:** JWT tokens for all endpoints

### Benefits

✅ Public site isolated from user data
✅ Independent scaling
✅ Better security
✅ Faster public pages
✅ Easier to maintain

## 💰 Monthly Costs

**Starter Setup (~$35/month):**

- Public Backend: $5
- Public Database: $15
- App Backend: $5 (existing)
- App Database: $25 (existing)

**Production Setup (~$80/month):**

- Public Backend: $12
- Public Database: $25
- App Backend: $24
- App Database: $40

## 🔧 Common Issues

### "Cannot connect to database"

```bash
# Check database is running
doctl databases get <db-id>

# Add your IP to firewall
doctl databases firewalls append <db-id> --rule ip_addr:$(curl -s ifconfig.me)
```

### "App build failed"

```bash
# Check build logs
doctl apps logs <app-id> --type build

# Common fixes:
# - Add "npx prisma generate" to build command
# - Check Node version in .node-version file
# - Verify all dependencies in package.json
```

### "CORS error"

```bash
# In DigitalOcean App Platform:
# Go to app → Settings → Environment Variables
# Update ALLOWED_ORIGINS to include your frontend domain
```

## 📚 Full Documentation

For detailed information, see:

- [Complete Guide](./DIGITALOCEAN_FULL_SEPARATION_GUIDE.md)
- [Public Backend README](./public-backend/README.md)
- [Architecture Decisions](./docs/ARCHITECTURE.md)

## 🆘 Get Help

```bash
# View app status
doctl apps list

# View logs
doctl apps logs <app-id> --follow

# View database info
doctl databases get <db-id>

# Check database connection
psql $PUBLIC_DATABASE_URL -c "SELECT version();"
```

## 🎉 Next Steps

After basic setup:

1. **Add Landing Pages API** - Extend public backend
2. **Add Blog API** - Create blog service
3. **Setup Monitoring** - Configure alerts
4. **Optimize Performance** - Add caching, CDN
5. **Add Analytics** - Track public page views

---

**Time to Complete:** 15-30 minutes  
**Difficulty:** Intermediate  
**Support:** Check logs, review docs, contact team
