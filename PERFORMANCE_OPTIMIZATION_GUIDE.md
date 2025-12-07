# 🚀 Performance Optimization Guide

**Last Updated:** December 6, 2024

## 📊 Current Setup Analysis

**Your Stack:**

- DigitalOcean App Platform (Backend)
- PostgreSQL Database (25 connections)
- Prisma ORM
- Direct database connection (port 25060)
- Connection limit: 5 per instance

---

## 🎯 Performance Optimization Priorities

### **Tier 1: Quick Wins (Do Now) - 1-2 Days**

These give immediate improvements with minimal effort.

#### **1. Database Indexing**

**Impact:** 🔥🔥🔥 High  
**Effort:** ⭐ Low  
**Time:** 2-4 hours

**Add indexes on frequently queried columns:**

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_customer_id ON users("customerId");
CREATE INDEX idx_users_status ON users(status);

-- Sessions
CREATE INDEX idx_sessions_user_id ON sessions("userId");
CREATE INDEX idx_sessions_expires_at ON sessions("expiresAt");
CREATE INDEX idx_sessions_token ON sessions(token);

-- Properties
CREATE INDEX idx_properties_customer_id ON properties("customerId");
CREATE INDEX idx_properties_status ON properties(status);

-- Tenants
CREATE INDEX idx_tenants_property_id ON tenants("propertyId");
CREATE INDEX idx_tenants_status ON tenants(status);

-- Maintenance requests
CREATE INDEX idx_maintenance_property_id ON maintenance_requests("propertyId");
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_created_at ON maintenance_requests("createdAt");

-- Payments
CREATE INDEX idx_payments_customer_id ON payments("customerId");
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments("createdAt");

-- Composite indexes for common queries
CREATE INDEX idx_users_customer_status ON users("customerId", status);
CREATE INDEX idx_properties_customer_status ON properties("customerId", status);
```

**How to apply:**

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name "add_performance_indexes"

# Deploy to production
npx prisma migrate deploy
```

**Expected improvement:** 50-80% faster queries on indexed columns

---

#### **2. Add Prisma Query Optimization**

**Impact:** 🔥🔥 Medium-High  
**Effort:** ⭐⭐ Medium  
**Time:** 4-6 hours

**Use `select` to fetch only needed fields:**

```typescript
// ❌ BAD: Fetches all fields
const users = await prisma.users.findMany({
  where: { customerId },
});

// ✅ GOOD: Fetches only needed fields
const users = await prisma.users.findMany({
  where: { customerId },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
  },
});
```

**Use pagination for large result sets:**

```typescript
// ❌ BAD: Fetches all records
const properties = await prisma.properties.findMany({
  where: { customerId },
});

// ✅ GOOD: Paginated results
const properties = await prisma.properties.findMany({
  where: { customerId },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: "desc" },
});
```

**Avoid N+1 queries with `include`:**

```typescript
// ❌ BAD: N+1 query problem
const properties = await prisma.properties.findMany();
for (const property of properties) {
  const tenants = await prisma.tenants.findMany({
    where: { propertyId: property.id },
  });
}

// ✅ GOOD: Single query with join
const properties = await prisma.properties.findMany({
  include: {
    tenants: {
      where: { status: "active" },
    },
  },
});
```

**Expected improvement:** 30-60% faster API responses

---

#### **3. Enable Response Compression**

**Impact:** 🔥🔥 Medium  
**Effort:** ⭐ Low  
**Time:** 15 minutes

**Add compression middleware:**

```bash
cd backend
npm install compression
```

```typescript
// backend/src/index.ts
import compression from "compression";

// Add before routes
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression
  })
);
```

**Expected improvement:** 60-80% smaller response sizes, faster page loads

---

#### **4. Add Database Connection Pooling (PgBouncer)**

**Impact:** 🔥🔥🔥 High  
**Effort:** ⭐⭐⭐ High (we tried this today, but worth revisiting)  
**Time:** 1-2 hours (when you have time)

**Current:** Direct connection (5 connections per instance)  
**Better:** Connection pool (20 connections shared across instances)

**When to implement:**

- When you scale to 2+ app instances
- When you see "remaining connection slots" errors
- When you need better connection efficiency

**Steps:**

1. Wait for DigitalOcean to fix connection pool issue (or try again in a week)
2. Delete and recreate pool if needed
3. Update DATABASE_URL to use port 25061
4. Test thoroughly

**Expected improvement:** Can scale to 10+ instances without connection issues

---

### **Tier 2: Medium-Term Improvements (1-2 Weeks)**

#### **5. Implement Redis Caching**

**Impact:** 🔥🔥🔥 High  
**Effort:** ⭐⭐⭐ Medium  
**Time:** 1-2 days

**Cache frequently accessed, rarely changed data:**

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Cache customer data (5 minutes)
async function getCustomer(id: string) {
  const cacheKey = `customer:${id}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const customer = await prisma.customers.findUnique({
    where: { id },
    include: { plans: true },
  });

  // Store in cache
  await redis.setex(cacheKey, 300, JSON.stringify(customer));

  return customer;
}

// Invalidate cache on update
async function updateCustomer(id: string, data: any) {
  const customer = await prisma.customers.update({
    where: { id },
    data,
  });

  // Clear cache
  await redis.del(`customer:${id}`);

  return customer;
}
```

**What to cache:**

- Customer/user profiles (5-10 minutes)
- Plan information (1 hour)
- System settings (30 minutes)
- Dashboard statistics (5 minutes)
- Report data (10 minutes)

**DigitalOcean Setup:**

1. Create Redis cluster in DigitalOcean
2. Add REDIS_URL to app environment variables
3. Install `ioredis` package
4. Implement caching layer

**Expected improvement:** 70-90% faster for cached data, reduced database load

---

#### **6. Optimize Database Queries**

**Impact:** 🔥🔥🔥 High  
**Effort:** ⭐⭐⭐ Medium-High  
**Time:** 2-3 days

**Use Prisma query logging to find slow queries:**

```typescript
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}
```

```typescript
// backend/src/lib/prisma.ts
const prisma = new PrismaClient({
  log: [
    { level: "query", emit: "event" },
    { level: "error", emit: "stdout" },
    { level: "warn", emit: "stdout" },
  ],
});

// Log slow queries
prisma.$on("query", (e) => {
  if (e.duration > 100) {
    // Queries taking >100ms
    console.warn("Slow query detected:", {
      query: e.query,
      duration: e.duration,
      params: e.params,
    });
  }
});
```

**Common optimizations:**

```typescript
// ❌ BAD: Fetches all data then filters in JS
const activeProperties = (await prisma.properties.findMany()).filter(
  (p) => p.status === "active"
);

// ✅ GOOD: Filters in database
const activeProperties = await prisma.properties.findMany({
  where: { status: "active" },
});

// ❌ BAD: Multiple separate queries
const customer = await prisma.customers.findUnique({ where: { id } });
const properties = await prisma.properties.findMany({
  where: { customerId: id },
});
const users = await prisma.users.findMany({ where: { customerId: id } });

// ✅ GOOD: Single query with includes
const customer = await prisma.customers.findUnique({
  where: { id },
  include: {
    properties: {
      where: { status: "active" },
      take: 10,
    },
    users: {
      where: { status: "active" },
    },
  },
});
```

**Expected improvement:** 40-70% faster queries

---

#### **7. Implement API Response Caching**

**Impact:** 🔥🔥 Medium  
**Effort:** ⭐⭐ Medium  
**Time:** 1 day

**Cache API responses for GET requests:**

```typescript
import { createHash } from "crypto";

// Caching middleware
function cacheMiddleware(duration: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = `api:${req.path}:${createHash("md5")
      .update(JSON.stringify(req.query))
      .digest("hex")}`;

    // Try cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (data: any) => {
      redis.setex(cacheKey, duration, JSON.stringify(data));
      return originalJson(data);
    };

    next();
  };
}

// Use on specific routes
router.get("/dashboard/stats", cacheMiddleware(300), async (req, res) => {
  // This will be cached for 5 minutes
  const stats = await getDashboardStats();
  res.json(stats);
});
```

**Expected improvement:** 80-95% faster for cached endpoints

---

### **Tier 3: Long-Term Optimizations (1-3 Months)**

#### **8. Database Read Replicas**

**Impact:** 🔥🔥🔥 High  
**Effort:** ⭐⭐⭐⭐ High  
**Time:** 3-5 days

**Setup read replicas for read-heavy operations:**

```typescript
// Primary database (writes)
const prismaWrite = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

// Read replica (reads)
const prismaRead = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_URL },
  },
});

// Use read replica for queries
async function getCustomerDashboard(customerId: string) {
  return prismaRead.customers.findUnique({
    where: { id: customerId },
    include: {
      properties: true,
      users: true,
    },
  });
}

// Use primary for writes
async function updateCustomer(id: string, data: any) {
  return prismaWrite.customers.update({
    where: { id },
    data,
  });
}
```

**DigitalOcean Setup:**

1. Add read replica in database settings
2. Add DATABASE_READ_URL environment variable
3. Update code to use read replica for queries
4. Keep writes on primary database

**Expected improvement:** 50-70% faster read operations, reduced primary DB load

---

#### **9. CDN for Static Assets**

**Impact:** 🔥🔥 Medium  
**Effort:** ⭐⭐ Medium  
**Time:** 1-2 days

**Use DigitalOcean Spaces + CDN:**

1. Create DigitalOcean Space for static assets
2. Upload images, CSS, JS to Spaces
3. Enable CDN on the Space
4. Update frontend to use CDN URLs

**Expected improvement:** 60-80% faster asset loading, reduced server load

---

#### **10. Implement Background Job Processing**

**Impact:** 🔥🔥🔥 High  
**Effort:** ⭐⭐⭐⭐ High  
**Time:** 3-5 days

**Move long-running tasks to background workers:**

```typescript
import Bull from "bull";

// Create job queue
const reportQueue = new Bull("reports", process.env.REDIS_URL);

// Add job to queue (in API handler)
router.post("/reports/generate", async (req, res) => {
  const job = await reportQueue.add({
    customerId: req.user.customerId,
    reportType: req.body.type,
    dateRange: req.body.dateRange,
  });

  res.json({ jobId: job.id, status: "processing" });
});

// Process jobs in background worker
reportQueue.process(async (job) => {
  const report = await generateReport(job.data);
  await sendReportEmail(report);
  return { success: true };
});
```

**Tasks to move to background:**

- Report generation
- Email sending
- PDF generation
- Data exports
- Batch operations

**Expected improvement:** 90% faster API responses for heavy tasks

---

## 📊 Monitoring & Metrics

### **Set Up Performance Monitoring**

**1. Database Query Monitoring**

```typescript
// Track query performance
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  console.log({
    model: params.model,
    action: params.action,
    duration,
    slow: duration > 100,
  });

  return result;
});
```

**2. API Response Time Monitoring**

```typescript
// Response time middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    });
  });

  next();
});
```

**3. Use DigitalOcean Monitoring**

- Enable App Platform metrics
- Enable Database insights
- Set up alerts for:
  - High response times (>500ms)
  - High error rates (>1%)
  - High database connections (>20)
  - High CPU usage (>80%)

---

## 🎯 Performance Benchmarks

### **Current Performance (Estimated)**

| Metric               | Current   | Target | Priority |
| -------------------- | --------- | ------ | -------- |
| API Response Time    | 200-500ms | <200ms | High     |
| Database Query Time  | 50-200ms  | <50ms  | High     |
| Page Load Time       | 2-4s      | <2s    | Medium   |
| Concurrent Users     | 50-100    | 500+   | Medium   |
| Database Connections | 5/25      | 15/25  | Low      |

### **After Tier 1 Optimizations**

| Metric              | Improvement | New Target |
| ------------------- | ----------- | ---------- |
| API Response Time   | 40% faster  | 120-300ms  |
| Database Query Time | 60% faster  | 20-80ms    |
| Page Load Time      | 30% faster  | 1.4-2.8s   |
| Concurrent Users    | 2x capacity | 100-200    |

### **After Tier 2 Optimizations**

| Metric              | Improvement | New Target |
| ------------------- | ----------- | ---------- |
| API Response Time   | 70% faster  | 60-150ms   |
| Database Query Time | 80% faster  | 10-40ms    |
| Page Load Time      | 60% faster  | 0.8-1.6s   |
| Concurrent Users    | 5x capacity | 250-500    |

---

## 🛠️ Tools & Resources

### **Performance Testing Tools**

1. **k6** (Load testing)

```bash
# Install k6
brew install k6

# Create test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const res = http.get('https://api.contrezz.com/api/auth/validate-session');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
EOF

# Run test
k6 run load-test.js
```

2. **Prisma Studio** (Database inspection)

```bash
cd backend
npx prisma studio
```

3. **PostgreSQL EXPLAIN** (Query analysis)

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

---

## 📋 Implementation Checklist

### **Phase 1: Quick Wins (Week 1)**

- [ ] Add database indexes
- [ ] Optimize Prisma queries
- [ ] Enable response compression
- [ ] Add query logging
- [ ] Set up basic monitoring

### **Phase 2: Caching (Week 2-3)**

- [ ] Set up Redis on DigitalOcean
- [ ] Implement data caching layer
- [ ] Implement API response caching
- [ ] Test cache invalidation
- [ ] Monitor cache hit rates

### **Phase 3: Scaling (Month 2)**

- [ ] Revisit connection pooling (if needed)
- [ ] Implement background job processing
- [ ] Set up CDN for static assets
- [ ] Add read replicas (if needed)
- [ ] Optimize critical queries

### **Phase 4: Advanced (Month 3)**

- [ ] Full performance audit
- [ ] Load testing
- [ ] Database optimization
- [ ] Code profiling
- [ ] Architecture review

---

## 🎯 Quick Wins Priority List

**Start with these (in order):**

1. **Add database indexes** (2-4 hours, huge impact)
2. **Enable compression** (15 minutes, easy win)
3. **Optimize Prisma queries** (4-6 hours, big impact)
4. **Add query logging** (1 hour, visibility)
5. **Implement basic caching** (1-2 days, major improvement)

---

## 💡 Performance Best Practices

### **Database**

- ✅ Always use indexes on foreign keys
- ✅ Use composite indexes for common query patterns
- ✅ Limit result sets with pagination
- ✅ Use select to fetch only needed fields
- ✅ Avoid N+1 query problems

### **API**

- ✅ Enable compression for responses
- ✅ Cache GET requests when possible
- ✅ Use pagination for large datasets
- ✅ Implement rate limiting
- ✅ Return appropriate HTTP status codes

### **Frontend**

- ✅ Lazy load components
- ✅ Optimize images
- ✅ Use CDN for static assets
- ✅ Minimize bundle size
- ✅ Implement client-side caching

---

**Status:** Ready to implement  
**Priority:** Start with Tier 1 (Quick Wins)  
**Estimated ROI:** 2-5x performance improvement
