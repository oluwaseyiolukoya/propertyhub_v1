# Split Architecture Domain Setup

## 🎯 Target Architecture

- **`www.contrezz.com` (or `contrezz.com`)** → Public pages

  - Landing page
  - Careers page
  - Blog
  - About/Contact
  - **No authentication required**

- **`app.contrezz.com`** → Application/Dashboard
  - Login page
  - Dashboard
  - All authenticated pages
  - **Requires authentication**

## 📋 Current State

- Frontend: `https://contrezz.com` ✅ (working)
- Backend FRONTEND_URL: `https://contrezz.com`
- Public API: `https://api.contrezz.com` ✅
- App API: `https://api.app.contrezz.com` ✅

## 🔧 Implementation Options

### Option 1: Same Frontend, Domain-Based Routing (Recommended for Start)

Use the **same frontend deployment** but route based on domain:

**How it works:**

- Both `contrezz.com` and `app.contrezz.com` point to the same frontend
- Frontend code detects the domain and shows appropriate content
- Public pages on `contrezz.com`
- App pages on `app.contrezz.com`

**Setup:**

1. **Add DNS for `app.contrezz.com`:**

   - Namecheap → Advanced DNS
   - CNAME: `app` → `contrezz.com`
   - TTL: Automatic

2. **Add domain in DigitalOcean:**

   - Frontend app → Settings → Domains
   - Add: `app.contrezz.com`

3. **Update frontend routing:**

   ```typescript
   // In your frontend code, detect domain:
   const isAppDomain = window.location.hostname === "app.contrezz.com";

   // Route accordingly:
   if (isAppDomain) {
     // Show app routes (login, dashboard)
   } else {
     // Show public routes (landing, careers)
   }
   ```

4. **Update backend CORS:**
   - Public backend: Add `https://app.contrezz.com` to `ALLOWED_ORIGINS`
   - App backend: Add `https://app.contrezz.com` to `CORS_ORIGIN`

**Pros:**

- ✅ Simple setup
- ✅ One deployment to manage
- ✅ Easy to implement

**Cons:**

- ⚠️ Same codebase for both
- ⚠️ Can't have different build configs per domain

---

### Option 2: Separate Frontend Deployments (True Split)

Deploy **two separate frontend apps**:

**Setup:**

1. **Keep existing frontend for public:**

   - `contrezz.com` → Public frontend (already working)
   - Environment: `VITE_PUBLIC_API_URL=https://api.contrezz.com/api`

2. **Create new frontend app for application:**

   - Create new DigitalOcean app with static site
   - Or add static site component to existing app
   - Configure:
     - Source: Same GitHub repo (or separate branch)
     - Build: `npm ci && npm run build`
     - Output: `dist`
     - Environment variables:
       - `VITE_API_URL=https://api.app.contrezz.com`
       - `VITE_PUBLIC_API_URL=https://api.contrezz.com/api`
       - `VITE_APP_DOMAIN=https://app.contrezz.com`

3. **Get default domain:**

   - New app will have: `https://xxxxxx.ondigitalocean.app`

4. **Add DNS for `app.contrezz.com`:**

   - Namecheap → Advanced DNS
   - CNAME: `app` → `xxxxxx.ondigitalocean.app` (new app domain)
   - TTL: Automatic

5. **Add custom domain:**

   - New app → Settings → Domains
   - Add: `app.contrezz.com`

6. **Update backend:**
   - App backend → Environment Variables
   - Update `FRONTEND_URL`: `https://app.contrezz.com`

**Pros:**

- ✅ True separation
- ✅ Different build configs per domain
- ✅ Independent deployments
- ✅ Better for scaling

**Cons:**

- ⚠️ More complex setup
- ⚠️ Two deployments to manage

---

## 🚀 Recommended Implementation Plan

### Phase 1: Quick Setup (Option 1)

1. **Add DNS:**

   ```bash
   # Namecheap
   CNAME: app → contrezz.com
   ```

2. **Add domain in DigitalOcean:**

   - Frontend app → Settings → Domains → Add `app.contrezz.com`

3. **Update frontend routing:**

   - Detect domain in your React router
   - Show public routes on `contrezz.com`
   - Show app routes on `app.contrezz.com`

4. **Test:**
   - `https://contrezz.com` → Public pages
   - `https://app.contrezz.com` → Login/Dashboard

### Phase 2: True Split (Option 2) - Later

When ready for full separation:

1. Create separate frontend deployment
2. Update DNS to point to new app
3. Configure different environment variables
4. Deploy independently

---

## 📝 Frontend Routing Implementation

### Example: Domain-Based Routing

```typescript
// src/App.tsx or router config
const hostname = window.location.hostname;
const isAppDomain = hostname === "app.contrezz.com" || hostname === "localhost";

const publicRoutes = [
  { path: "/", component: LandingPage },
  { path: "/careers", component: CareersPage },
  { path: "/blog", component: BlogPage },
  { path: "/about", component: AboutPage },
];

const appRoutes = [
  { path: "/login", component: LoginPage },
  { path: "/dashboard", component: Dashboard, requiresAuth: true },
  { path: "/settings", component: Settings, requiresAuth: true },
];

// Use appropriate routes based on domain
const routes = isAppDomain ? appRoutes : publicRoutes;
```

### Example: Redirect Logic

```typescript
// If user tries to access app routes on public domain
if (!isAppDomain && isAppRoute) {
  window.location.href = `https://app.contrezz.com${pathname}`;
}

// If user tries to access public routes on app domain
if (isAppDomain && isPublicRoute) {
  window.location.href = `https://contrezz.com${pathname}`;
}
```

---

## 🔐 Authentication Flow

### Login Flow

1. User visits `app.contrezz.com/login`
2. User enters credentials
3. Frontend calls: `https://api.app.contrezz.com/api/auth/login`
4. On success, redirect to `app.contrezz.com/dashboard`
5. Token stored, user authenticated

### Public API Access

1. User visits `contrezz.com/careers`
2. Frontend calls: `https://api.contrezz.com/api/careers`
3. No authentication required
4. Data loads and displays

---

## ✅ Checklist

### DNS Setup

- [ ] `contrezz.com` → Public frontend (already working)
- [ ] `www.contrezz.com` → Public frontend (add if needed)
- [ ] `app.contrezz.com` → App frontend (add DNS + domain)
- [ ] `api.contrezz.com` → Public API (already configured)
- [ ] `api.app.contrezz.com` → App API (already configured)

### Frontend Configuration

- [ ] Domain detection logic implemented
- [ ] Routing based on domain
- [ ] Public pages on `contrezz.com`
- [ ] App pages on `app.contrezz.com`
- [ ] Redirects between domains (if needed)

### Backend Configuration

- [ ] Public backend CORS includes both domains
- [ ] App backend CORS includes `app.contrezz.com`
- [ ] `FRONTEND_URL` updated if needed

### Testing

- [ ] `contrezz.com` shows public pages
- [ ] `app.contrezz.com` shows login/dashboard
- [ ] Authentication works on `app.contrezz.com`
- [ ] Public API calls work from `contrezz.com`
- [ ] App API calls work from `app.contrezz.com`

---

## 🎯 Summary

**Goal:**

- `contrezz.com` / `www.contrezz.com` → Public pages (no auth)
- `app.contrezz.com` → Application (requires auth)

**Quick Start:**

1. Add DNS: `app` CNAME → `contrezz.com`
2. Add domain: `app.contrezz.com` in DigitalOcean
3. Implement domain-based routing in frontend
4. Test both domains

**Later:**

- Optionally split into separate deployments for true separation

---

**Last Updated:** December 14, 2025
