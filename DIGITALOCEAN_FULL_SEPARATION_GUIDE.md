# DigitalOcean Full Separation Architecture Guide

This guide will help you deploy Contrezz with a complete separation between public pages (contrezz.com) and the application (app.contrezz.com).

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    contrezz.com (Public)                     │
│  ┌────────────────┐         ┌─────────────────────────────┐ │
│  │   Frontend     │────────▶│  Public Backend API         │ │
│  │  (Vercel/DO)   │         │  api.contrezz.com           │ │
│  │                │         │  Port: 5001                 │ │
│  │  - Landing     │         └─────────────┬───────────────┘ │
│  │  - Careers     │                       │                  │
│  │  - Blog        │                       ▼                  │
│  └────────────────┘         ┌─────────────────────────────┐ │
│                              │  Public Database            │ │
│                              │  (PostgreSQL)               │ │
│                              │  - career_postings          │ │
│                              │  - blog_posts               │ │
│                              └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 app.contrezz.com (Application)               │
│  ┌────────────────┐         ┌─────────────────────────────┐ │
│  │   Frontend     │────────▶│  App Backend API            │ │
│  │     (SPA)      │         │  api.app.contrezz.com       │ │
│  │                │         │  Port: 5000                 │ │
│  └────────────────┘         └─────────────┬───────────────┘ │
│                                            │                  │
│                                            ▼                  │
│                              ┌─────────────────────────────┐ │
│                              │  App Database               │ │
│                              │  (PostgreSQL)               │ │
│                              │  - users, customers, etc.   │ │
│                              └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Step-by-Step Implementation

### Phase 1: Setup DigitalOcean Infrastructure (Week 1)

#### 1.1 Create Databases

**Public Database:**

```bash
# Via DigitalOcean Web Console or CLI
doctl databases create contrezz-public-db \
  --engine pg \
  --version 15 \
  --region nyc3 \
  --size db-s-1vcpu-1gb \
  --num-nodes 1

# Get connection string
doctl databases connection contrezz-public-db --format DSN
# Save this as PUBLIC_DATABASE_URL
```

**App Database (if not exists):**

```bash
doctl databases create contrezz-app-db \
  --engine pg \
  --version 15 \
  --region nyc3 \
  --size db-s-1vcpu-2gb \
  --num-nodes 1

# Get connection string
doctl databases connection contrezz-app-db --format DSN
# Save this as DATABASE_URL
```

#### 1.2 Configure Database Access

**Add trusted sources:**

```bash
# Add your IP for migrations
doctl databases firewalls append contrezz-public-db \
  --rule ip_addr:YOUR_IP_ADDRESS

# Add app platform (automatic when deployed)
```

#### 1.3 Run Database Migrations

**For Public Database:**

```bash
cd public-backend

# Create .env file
cat > .env << EOF
PUBLIC_DATABASE_URL=postgresql://user:pass@host:25060/contrezz_public
NODE_ENV=development
PORT=5001
EOF

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init_public_schema

# Verify schema
npx prisma studio
```

### Phase 2: Deploy Public Backend (Week 1-2)

#### 2.1 Deploy via DigitalOcean App Platform

**Option A: Using Web Console**

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect your GitHub repository
4. Select `public-backend` folder as source
5. Configure:
   - **Name:** contrezz-public-api
   - **Region:** NYC3 (or nearest)
   - **Branch:** main
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Run Command:** `npm start`
   - **HTTP Port:** 8080
   - **Health Check:** /health
6. Add environment variables (see section 2.2)
7. Add database reference
8. Click "Create Resources"

**Option B: Using doctl CLI**

```bash
# Create app from spec file
cd public-backend
doctl apps create --spec .do/app.yaml

# Get app ID
doctl apps list

# View logs
doctl apps logs <app-id> --follow
```

#### 2.2 Configure Environment Variables

In DigitalOcean App Platform, add these environment variables:

```
NODE_ENV=production
PORT=8080
PUBLIC_DATABASE_URL=${public-db.DATABASE_URL}
ALLOWED_ORIGINS=https://contrezz.com,https://www.contrezz.com
APP_URL=https://app.contrezz.com
APP_SIGNUP_URL=https://app.contrezz.com/signup
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 2.3 Configure Custom Domain

```bash
# Via CLI
doctl apps create-domain <app-id> \
  --domain api.contrezz.com

# Via Web Console:
# 1. Go to your app in DigitalOcean
# 2. Settings → Domains
# 3. Add domain: api.contrezz.com
# 4. Follow DNS instructions
```

### Phase 3: Configure DNS (Week 2)

#### 3.1 DNS Records Setup

Add these records to your domain registrar (e.g., Namecheap, Cloudflare):

```
# Public Site
Type: A
Host: @
Value: <your-public-frontend-ip>
TTL: 300

Type: CNAME
Host: www
Value: contrezz.com
TTL: 300

# Public API
Type: CNAME
Host: api
Value: <digitalocean-app-domain>.ondigitalocean.app
TTL: 300

# Application Site
Type: A
Host: app
Value: <your-app-frontend-ip>
TTL: 300

# Application API
Type: CNAME
Host: api.app
Value: <digitalocean-app-domain>.ondigitalocean.app
TTL: 300
```

#### 3.2 SSL Certificates

DigitalOcean automatically provisions Let's Encrypt certificates for:

- api.contrezz.com
- api.app.contrezz.com

### Phase 4: Migrate Careers API (Week 2)

#### 4.1 Copy Data to Public Database

```bash
# Create migration script
cat > scripts/migrate-careers-data.sh << 'EOF'
#!/bin/bash

# Source: App Database
# Destination: Public Database

echo "🔄 Migrating career postings to public database..."

# Export from app database
psql $APP_DATABASE_URL -c "\COPY career_postings TO '/tmp/careers.csv' CSV HEADER"

# Import to public database
psql $PUBLIC_DATABASE_URL -c "\COPY career_postings FROM '/tmp/careers.csv' CSV HEADER"

echo "✅ Migration complete!"
EOF

chmod +x scripts/migrate-careers-data.sh

# Run migration
./scripts/migrate-careers-data.sh
```

#### 4.2 Update Frontend to Use Public API

```typescript
// src/lib/api/careers.ts
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.contrezz.com/api"
    : "http://localhost:5001/api";

export const getCareers = async (filters?: any) => {
  const response = await fetch(`${API_BASE_URL}/careers`, {
    method: "GET",
    // No auth headers needed for public API
  });
  return response.json();
};
```

#### 4.3 Keep Admin Careers Management in App Backend

The admin endpoints (create, update, delete) stay in `backend/src/routes/careers.ts` and continue using the app database for management. Set up a sync job to push changes to public DB.

### Phase 5: Setup Data Synchronization (Week 2-3)

#### 5.1 Create Sync Service

```typescript
// backend/src/services/public-sync.service.ts
import { prisma as appDb } from "../lib/db";
import fetch from "node-fetch";

export class PublicSyncService {
  private publicApiUrl =
    process.env.PUBLIC_API_URL || "https://api.contrezz.com";

  /**
   * Sync career posting to public database
   */
  async syncCareerPosting(id: string) {
    // Get from app database
    const posting = await appDb.career_postings.findUnique({
      where: { id },
    });

    if (!posting) return;

    // Push to public API (internal endpoint)
    await fetch(`${this.publicApiUrl}/internal/careers/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.PUBLIC_API_ADMIN_KEY!,
      },
      body: JSON.stringify(posting),
    });
  }

  /**
   * Sync all active career postings
   */
  async syncAllCareers() {
    const postings = await appDb.career_postings.findMany({
      where: {
        status: "active",
        deletedAt: null,
      },
    });

    for (const posting of postings) {
      await this.syncCareerPosting(posting.id);
    }
  }
}
```

#### 5.2 Add Internal Sync Endpoint to Public Backend

```typescript
// public-backend/src/routes/internal.ts
import express from "express";
import prisma from "../lib/db";

const router = express.Router();

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

router.use(validateApiKey);

// Sync endpoint
router.post("/careers/sync", async (req, res) => {
  try {
    const posting = req.body;

    await prisma.career_postings.upsert({
      where: { id: posting.id },
      create: posting,
      update: posting,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Sync failed" });
  }
});

export default router;
```

#### 5.3 Trigger Sync on Career Changes

```typescript
// backend/src/routes/careers.ts
import { publicSyncService } from "../services/public-sync.service";

router.post("/admin/careers", authMiddleware, async (req, res) => {
  // ... create posting ...

  // Sync to public database if active
  if (posting.status === "active") {
    await publicSyncService.syncCareerPosting(posting.id);
  }

  res.json({ success: true, data: posting });
});
```

### Phase 6: Deploy App Backend (Existing)

Your existing app backend stays as is, just update the domain:

```bash
# In DigitalOcean, add custom domain
api.app.contrezz.com → existing-app-backend.ondigitalocean.app
```

### Phase 7: Cost Optimization

#### Monthly Cost Breakdown

**Minimal Setup ($35/month):**

- Public Backend: Basic XXS ($5)
- Public Database: 1GB ($15)
- App Backend: Basic XXS ($5)
- App Database: 2GB ($25)

**Recommended Production ($80/month):**

- Public Backend: Basic XS ($12)
- Public Database: 2GB ($25)
- App Backend: Professional XS ($24)
- App Database: 4GB ($40)

**High Traffic ($200+/month):**

- Public Backend: Professional S ($48)
- Public Database: 4GB ($40)
- App Backend: Professional M ($96)
- App Database: 8GB ($80)

### Phase 8: Monitoring & Alerts

#### 8.1 Setup Uptime Monitoring

```bash
# Use DigitalOcean's built-in monitoring
doctl monitoring alert-policy create \
  --type v1/insights/droplet/cpu \
  --description "High CPU on public API" \
  --compare GreaterThan \
  --value 80 \
  --window 5m \
  --entities <app-id>
```

#### 8.2 Setup Log Forwarding

```bash
# Forward logs to external service (optional)
# Papertrail, Datadog, etc.
```

## 🔄 Migration Checklist

### Week 1: Infrastructure

- [ ] Create public database on DigitalOcean
- [ ] Run migrations on public database
- [ ] Deploy public backend to App Platform
- [ ] Configure custom domain (api.contrezz.com)
- [ ] Test health endpoint

### Week 2: Data Migration

- [ ] Migrate existing career postings to public DB
- [ ] Update frontend to use public API
- [ ] Test public career listings
- [ ] Set up sync service
- [ ] Configure internal sync endpoint

### Week 3: DNS & Testing

- [ ] Configure all DNS records
- [ ] Test contrezz.com → api.contrezz.com
- [ ] Test app.contrezz.com → api.app.contrezz.com
- [ ] Verify SSL certificates
- [ ] Load test public API

### Week 4: Production Launch

- [ ] Switch DNS to production
- [ ] Monitor logs and metrics
- [ ] Test complete user flows
- [ ] Document runbook
- [ ] Train team on new architecture

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $PUBLIC_DATABASE_URL -c "SELECT version();"

# Check firewall rules
doctl databases firewalls list contrezz-public-db

# Add trusted source
doctl databases firewalls append contrezz-public-db \
  --rule ip_addr:YOUR_IP
```

### App Not Building

```bash
# Check build logs
doctl apps logs <app-id> --type build

# Common issues:
# - Prisma generate not running → add to build command
# - Wrong Node version → check .node-version file
# - Missing dependencies → check package.json
```

### CORS Errors

```bash
# Verify ALLOWED_ORIGINS includes your frontend domain
# Check browser console for specific origin being blocked
# Update in App Platform → Environment Variables
```

## 📚 Additional Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [DigitalOcean Managed Databases](https://docs.digitalocean.com/products/databases/)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)
- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## 🆘 Support

If you encounter issues:

1. Check DigitalOcean logs: `doctl apps logs <app-id>`
2. Check database status: `doctl databases get <db-id>`
3. Review this guide's troubleshooting section
4. Contact DigitalOcean support via dashboard

---

**Last Updated:** December 2024
**Architecture Version:** 1.0
**Status:** Ready for Implementation
