# Access Public Landing Page in Local Development

## Problem

By default, `localhost` is treated as the app domain (`isAppDomain`), so the landing page doesn't show. The landing page only shows on the public domain (`contrezz.com`).

## Solution Options

### Option 1: Use Local Domain Alias (Recommended)

Add a local domain alias to your `/etc/hosts` file to simulate the public domain.

#### Step 1: Edit `/etc/hosts`

```bash
sudo nano /etc/hosts
```

Add this line:

```
127.0.0.1    contrezz.local
```

Save and exit (Ctrl+X, then Y, then Enter).

#### Step 2: Update Vite Config (Optional - for better dev experience)

You can configure Vite to accept the custom hostname:

```typescript
// vite.config.ts
server: {
  port: 5173,
  host: true, // Allow access from network
  // ... rest of config
}
```

#### Step 3: Access via Custom Domain

```bash
# Start frontend
npm run dev

# Access at:
http://contrezz.local:5173
```

**Note:** You'll need to update the domain detection in `App.tsx` to recognize `contrezz.local` as public domain.

---

### Option 2: Update Domain Detection for Local Dev

Modify `src/App.tsx` to treat a specific localhost port as public domain:

```typescript
// In src/App.tsx
const hostname = window.location.hostname;
const port = window.location.port;

const isAppDomain =
  hostname === "app.contrezz.com" ||
  (hostname === "localhost" && port === "5173"); // App on default port

const isPublicDomain =
  hostname === "contrezz.com" ||
  hostname === "www.contrezz.com" ||
  (hostname === "localhost" && port === "5174"); // Public on different port
```

Then run frontend on port 5174 for public:

```bash
npm run dev -- --port 5174
```

Access: `http://localhost:5174` (public landing page)

---

### Option 3: Use Query Parameter (Quick Fix)

Add a query parameter check to force show landing page:

```typescript
// In src/App.tsx, add this check:
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("public") === "true") {
    setShowLanding(true);
  }
}, []);
```

Then access: `http://localhost:5173?public=true`

---

### Option 4: Use 127.0.0.1 with Domain Alias (Best for Testing)

This is the cleanest approach for local development:

1. **Add to `/etc/hosts`:**

   ```
   127.0.0.1    contrezz.local
   127.0.0.1    app.contrezz.local
   ```

2. **Update `src/App.tsx` domain detection:**

   ```typescript
   const isAppDomain =
     hostname === "app.contrezz.com" ||
     hostname === "app.contrezz.local" ||
     (hostname === "localhost" &&
       !window.location.search.includes("public=true"));

   const isPublicDomain =
     hostname === "contrezz.com" ||
     hostname === "www.contrezz.com" ||
     hostname === "contrezz.local";
   ```

3. **Access:**
   - Public landing: `http://contrezz.local:5173`
   - App/login: `http://app.contrezz.local:5173` or `http://localhost:5173`

---

## Recommended: Quick Implementation

I'll update the code to support `contrezz.local` for local development. This way you can:

- **Public landing page:** `http://contrezz.local:5173`
- **App/login page:** `http://localhost:5173`

Would you like me to implement Option 4 (the recommended approach)?

---

## Current Behavior

- `localhost:5173` → Shows login page (app domain)
- `contrezz.com` → Shows landing page (public domain)
- `app.contrezz.com` → Shows login page (app domain)

---

**Quick Test:** Add `?public=true` to URL temporarily to see landing page:
`http://localhost:5173?public=true`
