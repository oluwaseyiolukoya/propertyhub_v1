# DigitalOcean PostgreSQL Connection Pooling Setup

## Problem

Your application is running out of database connections, causing:
- ❌ Migration failures
- ❌ API request failures
- ❌ "remaining connection slots reserved" errors

## Root Cause

DigitalOcean managed PostgreSQL databases have connection limits based on plan:
- **Basic Plan:** 25 connections
- **Professional Plan:** 97 connections
- **Advanced Plan:** 197 connections

Each Prisma Client instance opens ~10 connections by default. With multiple app replicas, you quickly hit the limit.

---

## ✅ Solution: Use DigitalOcean Connection Pooler

DigitalOcean provides a built-in **PgBouncer** connection pooler for every managed database.

### Step 1: Get Your Connection Pool URL

1. Go to DigitalOcean Dashboard
2. Navigate to your database: `contrezz-db-prod`
3. Click **"Connection Details"**
4. Select **"Connection Pool"** (not "Connection String")
5. Copy the connection pool URL

It looks like:
```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/contrezz?sslmode=require
```

**Note:** Port is usually `25061` for pool (vs `25060` for direct)

---

### Step 2: Create Connection Pool (If Not Exists)

If you don't see a connection pool:

1. In DigitalOcean database dashboard
2. Click **"Connection Pools"** tab
3. Click **"Create a Connection Pool"**
4. Settings:
   - **Pool Name:** `contrezz-pool`
   - **Database:** `contrezz`
   - **Pool Mode:** `Transaction` (recommended for APIs)
   - **Pool Size:** `25` (adjust based on your plan)
5. Click **"Create Pool"**

---

### Step 3: Update Your Application

#### Update Environment Variables

**For App Platform (DigitalOcean Apps):**

1. Go to your app in DigitalOcean
2. Click **"Settings"** → **"Environment Variables"**
3. Update `DATABASE_URL` to use the **connection pool URL**
4. Add `?pgbouncer=true` to the URL
5. Click **"Save"**

```bash
# Connection Pool URL format
DATABASE_URL=postgresql://user:pass@host:25061/db?sslmode=require&pgbouncer=true
```

**Why `?pgbouncer=true`?**
- Tells Prisma to use transaction-level pooling
- Prevents prepared statement issues
- Reduces connection usage

---

### Step 4: Update Prisma Configuration

Update your Prisma connection settings:

```prisma
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add these for better connection management
  relationMode = "prisma"
}
```

Update Prisma Client configuration:

```typescript
// backend/src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Reduce connection pool size since using PgBouncer
  log: ['error', 'warn'],
  // Connection pool settings
  __internal: {
    engine: {
      connection_limit: 5, // Reduce since using PgBouncer
    },
  },
});

export default prisma;
```

---

### Step 5: Configure Pool Mode

**Pool Modes Explained:**

| Mode | Use Case | Pros | Cons |
|------|----------|------|------|
| **Session** | Single long-lived connections | Most compatible | Uses more connections |
| **Transaction** | APIs, short requests | Efficient, fewer connections | Some features limited |
| **Statement** | Extreme efficiency | Fewest connections | Many limitations |

**For your app, use Transaction mode** (already set in Step 2)

---

### Step 6: Update Connection Limits

Edit your Prisma connection string to limit connections:

```bash
# In your .env or App Platform env vars
DATABASE_URL=postgresql://user:pass@host:25061/db?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20
```

Parameters:
- `connection_limit=5` - Max connections per Prisma instance
- `pool_timeout=20` - Wait up to 20s for available connection
- `pgbouncer=true` - Use PgBouncer-compatible mode

---

### Step 7: Redeploy Application

```bash
# Via DigitalOcean App Platform
# Just click "Deploy" after updating env vars

# Or via CLI
doctl apps create-deployment <app-id>
```

---

## 🧪 Verify Connection Pooling Works

### Test 1: Check Active Connections

```sql
-- Direct connection to check pool usage
psql $DIRECT_DATABASE_URL

SELECT 
  datname,
  usename,
  application_name,
  state,
  COUNT(*) as connection_count
FROM pg_stat_activity
WHERE datname = 'contrezz'
GROUP BY datname, usename, application_name, state
ORDER BY connection_count DESC;
```

**Expected:** Much fewer connections (~5-10 instead of 25+)

### Test 2: Run Load Test

```bash
# Generate many concurrent requests
for i in {1..50}; do
  curl https://api.contrezz.com/api/health &
done
wait

# Check if any failed due to connections
```

**Expected:** All requests succeed

---

## 📊 Connection Optimization Best Practices

### 1. Set Appropriate Connection Limits

```typescript
// backend/src/lib/db.ts
const connectionLimit = process.env.NODE_ENV === 'production' 
  ? 5   // Production (using PgBouncer)
  : 10; // Development (direct connection)

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + `?connection_limit=${connectionLimit}`,
    },
  },
});
```

### 2. Close Connections Properly

```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### 3. Use Single Prisma Instance

```typescript
// ❌ WRONG: Creates new instance per request
app.get('/users', async (req, res) => {
  const prisma = new PrismaClient(); // Bad!
  const users = await prisma.users.findMany();
  res.json(users);
});

// ✅ CORRECT: Reuse single instance
import prisma from './lib/db';

app.get('/users', async (req, res) => {
  const users = await prisma.users.findMany();
  res.json(users);
});
```

### 4. Monitor Connection Usage

Add health check endpoint:

```typescript
app.get('/health/db', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as connection_count
      FROM pg_stat_activity
      WHERE datname = current_database();
    `;
    
    res.json({
      healthy: true,
      connections: result[0].connection_count,
    });
  } catch (error) {
    res.status(500).json({ healthy: false, error: error.message });
  }
});
```

---

## 🚨 For Migrations: Use Direct Connection

**Important:** Always use **direct connection** (not pool) for migrations:

```bash
# Get direct connection URL (port 25060, not 25061)
# From DigitalOcean: Connection Details → Database

export DIRECT_DATABASE_URL="postgresql://...@host:25060/contrezz?sslmode=require"

# Apply migrations using direct connection
DATABASE_URL=$DIRECT_DATABASE_URL npx prisma migrate deploy
```

**Why?**
- Migrations need exclusive locks
- PgBouncer can interfere with schema changes
- Direct connection ensures proper migration application

---

## 🎯 Complete Setup Checklist

- [ ] Create connection pool in DigitalOcean
- [ ] Update DATABASE_URL to use pool URL (port 25061)
- [ ] Add `?pgbouncer=true&connection_limit=5` to URL
- [ ] Update Prisma configuration
- [ ] Reduce connection_limit in code
- [ ] Add graceful shutdown handlers
- [ ] Deploy updated application
- [ ] Verify reduced connection count
- [ ] Test under load
- [ ] Save direct URL for migrations
- [ ] Document for team

---

## 📈 Expected Results

### Before Connection Pooling:
- ❌ 20-30 active connections (hitting limit)
- ❌ Frequent connection errors
- ❌ Migrations fail
- ❌ API requests timeout

### After Connection Pooling:
- ✅ 5-10 active connections (plenty of headroom)
- ✅ No connection errors
- ✅ Migrations succeed (via direct connection)
- ✅ API requests fast and reliable

---

## 🔍 Troubleshooting

### Issue: "prepared statement already exists"

**Cause:** Using Session mode instead of Transaction mode
**Fix:** 
```bash
# Add pgbouncer=true to connection string
DATABASE_URL="${DATABASE_URL}?pgbouncer=true"
```

### Issue: "connection terminated unexpectedly"

**Cause:** PgBouncer closing idle connections
**Fix:**
```typescript
// Add connection timeout
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pool_timeout=20',
    },
  },
});
```

### Issue: Migrations still failing

**Cause:** Using pool URL for migrations
**Fix:**
```bash
# Use direct connection for migrations
DATABASE_URL=$DIRECT_DATABASE_URL npx prisma migrate deploy
```

---

## 💡 Quick Reference

```bash
# Connection Pool URL (for application)
postgresql://user:pass@host:25061/db?sslmode=require&pgbouncer=true&connection_limit=5

# Direct URL (for migrations only)
postgresql://user:pass@host:25060/db?sslmode=require

# Check connection count
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname='contrezz';"

# Apply migrations (use direct connection)
DATABASE_URL=$DIRECT_URL npx prisma migrate deploy

# Deploy app with pooling
doctl apps create-deployment <app-id>
```

---

**Created:** December 6, 2025
**Priority:** 🟡 HIGH - Prevents future connection issues
**Time to Implement:** 10-15 minutes
**Benefit:** Solves connection limit problems permanently

