# Check Production Performance

## Step 1: Verify Database Indexes Are Applied

Run in **DigitalOcean Console (Backend)**:

```bash
cd /workspace/backend && npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkIndexes() {
  console.log('🔍 Checking if performance indexes exist...\n');

  const result = await prisma.\$queryRaw\`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('properties', 'leases', 'payments', 'units', 'expenses')
    ORDER BY tablename, indexname;
  \`;

  console.log('📊 Indexes found:', (result as any[]).length);
  console.log('');

  const expectedIndexes = [
    'leases_propertyId_idx',
    'leases_tenantId_idx',
    'leases_status_idx',
    'leases_propertyId_status_idx',
    'payments_paidAt_idx',
    'payments_propertyId_status_idx',
    'properties_ownerId_idx',
    'properties_customerId_idx',
    'properties_status_idx',
    'units_propertyId_idx',
    'units_status_idx',
  ];

  const foundIndexNames = (result as any[]).map((r: any) => r.indexname);

  console.log('✅ Expected indexes:', expectedIndexes.length);
  console.log('📋 Found indexes:', foundIndexNames.filter(name =>
    expectedIndexes.some(exp => name.includes(exp.replace('_idx', '')))
  ).length);
  console.log('');

  expectedIndexes.forEach(exp => {
    const exists = foundIndexNames.some(found => found.includes(exp.replace('_idx', '')));
    console.log(exists ? '✅' : '❌', exp);
  });

  await prisma.\$disconnect();
}

checkIndexes();
"
```

---

## Step 2: Test React Query Caching in Browser

Open production site and **Browser Console** (F12):

```javascript
// Check if React Query is loaded
console.log('React Query installed:', !!window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__);

// Monitor network requests
console.log('📡 Monitoring API calls...');
let apiCalls = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/api/')) {
    apiCalls++;
    console.log(`📞 API Call #${apiCalls}:`, args[0]);
  }
  return originalFetch.apply(this, args);
};

// Test caching
console.log('
Test Plan:
1. Count API calls on first Dashboard load
2. Navigate to Properties
3. Come back to Dashboard
4. Should see 0 new API calls (data from cache)
');
```

**Expected Results:**

- First load: 4 API calls (properties, units, dashboard, account)
- Navigate away and back: **0 API calls** (cached!)

If you see 4 API calls again = caching NOT working ❌

---

## Step 3: Measure Actual Load Time

Add this to your browser console on production:

```javascript
// Measure page transition time
const measurePageLoad = (pageName) => {
  const start = performance.now();
  return () => {
    const end = performance.now();
    const time = (end - start).toFixed(0);
    console.log(`⏱️ ${pageName} loaded in ${time}ms`);

    if (time < 100) {
      console.log("✅ INSTANT - Loaded from cache!");
    } else if (time < 500) {
      console.log("⚡ FAST - Good performance");
    } else if (time < 1000) {
      console.log("⚠️ SLOW - Could be better");
    } else {
      console.log("❌ VERY SLOW - Problem detected");
    }
  };
};

// Usage:
// When clicking Dashboard
const end = measurePageLoad("Dashboard");
// Wait for page to load, then call:
// end();
```

---

## Step 4: Check What's Taking Time

In browser DevTools → **Network tab**:

1. Click "Dashboard"
2. Sort by **"Time"** column
3. Look for slow requests

**What to look for:**

- API calls taking >500ms each
- Slow database queries
- Large response payloads
- Multiple duplicate calls

---

## Step 5: Profile React Rendering

In browser console:

```javascript
// Enable React DevTools Profiler
// Then click Dashboard and check:
// 1. Component render times
// 2. Number of re-renders
// 3. Wasted renders
```

---

## 🎯 Expected Results After Our Changes

### Database Indexes Applied:

| Query          | Before | After | Expected      |
| -------------- | ------ | ----- | ------------- |
| Get Properties | 300ms  | 150ms | ✅ 50% faster |
| Get Leases     | 250ms  | 120ms | ✅ 50% faster |
| Get Payments   | 400ms  | 180ms | ✅ 55% faster |

### React Query Caching:

| Action       | Before | After    | Expected      |
| ------------ | ------ | -------- | ------------- |
| First Load   | 2000ms | 600ms    | ✅ 70% faster |
| Return Visit | 2000ms | **50ms** | ✅ 97% faster |

---

## 🔧 If Still Slow, Check:

### A. Other Components Not Using React Query

The following pages might still be using old fetch patterns:

```bash
# Check which components still use manual fetch
cd /Users/oluwaseyio/test_ui_figma_and_cursor
grep -r "useState.*\[\]" src/components/*.tsx | grep -i "propert\|unit\|dashboard" | head -20
```

### B. Clear Browser Cache

Hard refresh:

- **Mac:** `Cmd + Shift + R`
- **Windows:** `Ctrl + Shift + R`
- **Or:** Open DevTools → Right-click refresh → "Empty Cache and Hard Reload"

### C. Check if Build Deployed

In DigitalOcean:

1. Go to your Frontend app
2. Check **"Deployments"** tab
3. Look for latest commit: `d0a23b2` or newer
4. Status should be: ✅ **"Live"**

---

## 🚀 Quick Fix: Add Loading Skeleton

While data loads, show a skeleton instead of blank screen:

```typescript
// In PropertyOwnerDashboard.tsx
if (loading) {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

This makes it **feel** faster even if loading time is the same!

---

## 📊 Performance Monitoring Script

Save this for ongoing monitoring:

```typescript
// src/lib/performance-monitor.ts
export class PerformanceMonitor {
  static timers = new Map<string, number>();

  static start(label: string) {
    this.timers.set(label, performance.now());
  }

  static end(label: string) {
    const start = this.timers.get(label);
    if (!start) return;

    const duration = performance.now() - start;
    console.log(`⏱️ ${label}: ${duration.toFixed(0)}ms`);

    this.timers.delete(label);
    return duration;
  }
}

// Usage in components:
// PerformanceMonitor.start('Dashboard Load');
// ... after data loads ...
// PerformanceMonitor.end('Dashboard Load');
```

---

## 🎯 Action Plan

**Do these in order:**

1. ✅ **Run Step 1** - Verify indexes are applied in production
2. ✅ **Run Step 2** - Test if React Query caching works
3. ✅ **Run Step 3** - Measure actual load times
4. ✅ **Share results** - Tell me what you find

Then I can tell you exactly what the bottleneck is! 🔍

