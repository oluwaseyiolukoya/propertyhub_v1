# Split Architecture Implementation Checklist

Use this checklist to track your progress implementing the split architecture.

## ✅ Completed (By AI Assistant)

- [x] Create public-backend project structure
- [x] Set up Prisma schema for public database
- [x] Create Express server with TypeScript
- [x] Implement careers API endpoints
- [x] Create rate limiting middleware
- [x] Create DigitalOcean deployment configs
- [x] Write migration scripts
- [x] Create comprehensive documentation
- [x] Create DNS configuration guide
- [x] Create frontend integration guide

## 🚀 Phase 1: Local Setup & Testing (Week 1)

### Day 1-2: Setup Local Environment

- [ ] Install dependencies in public-backend

  ```bash
  cd public-backend
  npm install
  ```

- [ ] Create local public database

  ```bash
  createdb contrezz_public_dev
  ```

- [ ] Configure .env file

  ```bash
  cp .env.example .env
  # Edit .env with local database URL
  ```

- [ ] Generate Prisma client

  ```bash
  npx prisma generate
  ```

- [ ] Run initial migration

  ```bash
  npx prisma migrate dev --name init
  ```

- [ ] Start public backend locally

  ```bash
  npm run dev
  # Should run on http://localhost:5001
  ```

- [ ] Test public API locally
  ```bash
  ./scripts/test-public-api.sh
  ```

### Day 3-4: Data Migration (Local)

- [ ] Export sample careers from app database

  ```bash
  # Set environment variables
  export APP_DATABASE_URL="your-local-app-db"
  export PUBLIC_DATABASE_URL="your-local-public-db"
  ```

- [ ] Run migration script

  ```bash
  ./scripts/migrate-careers-to-public.sh
  ```

- [ ] Verify data in Prisma Studio

  ```bash
  cd public-backend
  npx prisma studio
  # Check career_postings table
  ```

- [ ] Test API with migrated data
  ```bash
  curl http://localhost:5001/api/careers | jq
  ```

## 🌐 Phase 2: DigitalOcean Setup (Week 1-2)

### DigitalOcean Infrastructure

- [ ] Install doctl CLI

  ```bash
  # macOS
  brew install doctl

  # Or download from
  # https://docs.digitalocean.com/reference/doctl/how-to/install/
  ```

- [ ] Authenticate with DigitalOcean

  ```bash
  doctl auth init
  ```

- [ ] Run setup script
  ```bash
  chmod +x scripts/setup-digitalocean-split-architecture.sh
  ./scripts/setup-digitalocean-split-architecture.sh
  ```

### Database Setup

- [ ] Save public database connection string

  ```bash
  # Copy from setup script output
  # Save to password manager
  ```

- [ ] Add your IP to database firewall

  ```bash
  doctl databases firewalls append <db-id> \
    --rule ip_addr:$(curl -s ifconfig.me)
  ```

- [ ] Test database connection
  ```bash
  psql $PUBLIC_DATABASE_URL -c "SELECT version();"
  ```

### Deploy Public Backend

- [ ] Push code to GitHub

  ```bash
  git add .
  git commit -m "Add public backend"
  git push origin main
  ```

- [ ] Verify app deployed in DigitalOcean

  ```bash
  doctl apps list
  ```

- [ ] Check app logs

  ```bash
  APP_ID=$(doctl apps list --format ID --no-header | head -1)
  doctl apps logs $APP_ID --follow
  ```

- [ ] Verify health endpoint
  ```bash
  # Get app URL from DigitalOcean
  curl https://your-app.ondigitalocean.app/health
  ```

## 🔧 Phase 3: Configuration (Week 2)

### Environment Variables

- [ ] Configure public backend env vars in DigitalOcean

  - [ ] PUBLIC_DATABASE_URL
  - [ ] ALLOWED_ORIGINS
  - [ ] APP_URL
  - [ ] NODE_ENV=production
  - [ ] PORT=8080

- [ ] Verify app redeployed with new env vars

### Custom Domains

- [ ] Add api.contrezz.com to public backend

  - In DigitalOcean: Apps → Your App → Settings → Domains
  - Click "Add Domain"
  - Enter: api.contrezz.com

- [ ] Add api.app.contrezz.com to app backend (if needed)

  - Same process for app backend

- [ ] Note the CNAME targets provided by DigitalOcean

## 🌐 Phase 4: DNS Configuration (Week 2)

### DNS Records

- [ ] Log into your domain registrar

  - [ ] Namecheap
  - [ ] Cloudflare
  - [ ] Route 53
  - [ ] Other: ****\_\_\_****

- [ ] Add CNAME for public API

  ```
  Type: CNAME
  Name: api
  Value: <your-public-app>.ondigitalocean.app
  TTL: 300
  ```

- [ ] Add CNAME for app API (if needed)

  ```
  Type: CNAME
  Name: api.app
  Value: <your-app-backend>.ondigitalocean.app
  TTL: 300
  ```

- [ ] Add A record for public site (if needed)

  ```
  Type: A
  Name: @
  Value: <your-frontend-ip>
  TTL: 300
  ```

- [ ] Add A record for app site (if needed)
  ```
  Type: A
  Name: app
  Value: <your-app-frontend-ip>
  TTL: 300
  ```

### DNS Verification

- [ ] Wait for DNS propagation (5-30 minutes)

- [ ] Test DNS resolution

  ```bash
  dig api.contrezz.com +short
  dig api.app.contrezz.com +short
  ```

- [ ] Check from multiple locations

  - Visit: https://dnschecker.org

- [ ] Verify SSL certificate
  ```bash
  curl -I https://api.contrezz.com/health
  # Should show 200 OK with valid certificate
  ```

## 📊 Phase 5: Data Migration (Production) (Week 2-3)

### Migrate Career Data

- [ ] Set production environment variables

  ```bash
  export APP_DATABASE_URL="postgresql://production-app-db"
  export PUBLIC_DATABASE_URL="postgresql://production-public-db"
  ```

- [ ] Backup app database first

  ```bash
  pg_dump $APP_DATABASE_URL > backup-before-migration.sql
  ```

- [ ] Run migration script

  ```bash
  ./scripts/migrate-careers-to-public.sh
  ```

- [ ] Verify migration

  ```bash
  psql $PUBLIC_DATABASE_URL -c \
    "SELECT COUNT(*) FROM career_postings WHERE deleted_at IS NULL;"
  ```

- [ ] Test public API with production data
  ```bash
  PUBLIC_API_URL=https://api.contrezz.com ./scripts/test-public-api.sh
  ```

## 🎨 Phase 6: Frontend Integration (Week 3)

### Update Environment Variables

- [ ] Update public frontend .env

  ```
  VITE_PUBLIC_API_URL=https://api.contrezz.com/api
  VITE_APP_SIGNUP_URL=https://app.contrezz.com/signup
  ```

- [ ] Update app frontend .env
  ```
  VITE_API_URL=https://api.app.contrezz.com/api
  ```

### Update Code

- [ ] Create publicApi.ts client

  - [ ] See FRONTEND_INTEGRATION_GUIDE.md

- [ ] Update careers API calls

  - [ ] Remove auth headers for public API
  - [ ] Update base URL

- [ ] Update career page components

  - [ ] CareersPage.tsx
  - [ ] CareerDetailPage.tsx

- [ ] Test locally first
  ```bash
  cd app-frontend
  npm run dev
  # Verify careers load from public API
  ```

### Deploy Frontend Changes

- [ ] Deploy public frontend

  - [ ] Vercel/Netlify
  - [ ] Verify careers page works

- [ ] Deploy app frontend
  - [ ] Verify no regressions

## 🧪 Phase 7: Testing (Week 3-4)

### Functional Testing

- [ ] Test public careers page

  - [ ] Loads career listings
  - [ ] Filters work
  - [ ] Search works
  - [ ] Single career page loads
  - [ ] Pagination works

- [ ] Test app dashboard

  - [ ] Login works
  - [ ] Dashboard loads
  - [ ] All features work

- [ ] Test admin career management
  - [ ] Can create careers
  - [ ] Can update careers
  - [ ] Can delete careers
  - [ ] Changes eventually appear on public site

### Cross-Domain Testing

- [ ] Test navigation from public to app

  - [ ] "Get Started" button → app.contrezz.com/signup
  - [ ] "Login" link → app.contrezz.com/login

- [ ] Test navigation from app to public
  - [ ] "Careers" link → contrezz.com/careers
  - [ ] Logo click → contrezz.com

### Performance Testing

- [ ] Test API response times

  ```bash
  # Should be < 200ms
  curl -w "@curl-format.txt" -o /dev/null -s https://api.contrezz.com/api/careers
  ```

- [ ] Test rate limiting

  ```bash
  # Should get 429 after 100 requests in 15 min
  for i in {1..101}; do curl https://api.contrezz.com/health; done
  ```

- [ ] Load test (optional)
  ```bash
  ab -n 1000 -c 10 https://api.contrezz.com/api/careers
  ```

### Security Testing

- [ ] Verify SSL on all domains

  - [ ] https://contrezz.com
  - [ ] https://api.contrezz.com
  - [ ] https://app.contrezz.com
  - [ ] https://api.app.contrezz.com

- [ ] Test CORS configuration

  ```bash
  # Should allow contrezz.com
  curl -H "Origin: https://contrezz.com" https://api.contrezz.com/api/careers

  # Should block others
  curl -H "Origin: https://evil.com" https://api.contrezz.com/api/careers
  ```

- [ ] Verify no credentials sent to public API
  - Check Network tab in browser
  - Verify no Authorization headers

## 📈 Phase 8: Monitoring & Optimization (Week 4+)

### Setup Monitoring

- [ ] Enable DigitalOcean monitoring

  - Apps → Your App → Insights
  - Check CPU, Memory, Requests

- [ ] Setup alerts

  - [ ] High CPU (>80%)
  - [ ] High memory (>80%)
  - [ ] Error rate spike
  - [ ] Deployment failures

- [ ] Setup uptime monitoring (optional)
  - UptimeRobot
  - Pingdom
  - DigitalOcean Uptime Checks

### Documentation

- [ ] Document architecture for team
- [ ] Create runbook for common issues
- [ ] Document deployment process
- [ ] Update README files

### Training

- [ ] Train team on new architecture
- [ ] Review monitoring dashboards
- [ ] Practice incident response
- [ ] Document on-call procedures

## 🎯 Phase 9: Future Enhancements (Optional)

### Add Landing Pages API

- [ ] Create landing page routes
- [ ] Create landing page service
- [ ] Migrate landing page data
- [ ] Update admin to sync changes

### Add Blog API

- [ ] Create blog routes
- [ ] Create blog service
- [ ] Build blog frontend
- [ ] Setup blog admin

### Optimization

- [ ] Add Redis caching
- [ ] Setup CDN for static assets
- [ ] Optimize database queries
- [ ] Add search indexing

## ✅ Final Verification

### Production Checklist

- [ ] All tests passing
- [ ] No console errors in production
- [ ] SSL certificates valid
- [ ] DNS configured correctly
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Documentation complete
- [ ] Team trained
- [ ] Backup strategy in place
- [ ] Rollback plan documented

### Performance Metrics

- [ ] Public API response time < 200ms
- [ ] App API response time < 300ms
- [ ] Uptime > 99.9%
- [ ] Error rate < 0.1%
- [ ] Database queries < 50ms

### Cost Verification

- [ ] Monthly cost within budget
- [ ] No unexpected charges
- [ ] Resource utilization optimal
- [ ] Scaling policies configured

## 📞 Support Contacts

If you get stuck:

- **DigitalOcean Support:** https://cloud.digitalocean.com/support
- **Team Slack:** #backend-public
- **Documentation:** See all markdown files in project root
- **Scripts:** ./scripts/ directory

## 🎉 Completion

When all items are checked:

- [ ] Mark implementation as COMPLETE
- [ ] Schedule review in 1 month
- [ ] Celebrate! 🎊

---

**Started:** ******\_******
**Completed:** ******\_******
**Team Members:** ******\_******
**Notes:** ******\_******
