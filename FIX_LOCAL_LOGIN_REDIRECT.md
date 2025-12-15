# Fix Local Login Redirect (Best Practice)

## Problem

When clicking "Login" in local development, it redirects to `https://app.contrezz.com/login` (production URL) instead of staying on `localhost:5173/login`.

## Root Cause

Hardcoded production URLs in navigation handlers:

- `handleNavigateToLogin()` → `https://app.contrezz.com/login`
- `handleNavigateToContact()` → `https://contrezz.com/contact`
- `handleBackToHome()` → `https://contrezz.com`
- Redirect logic → `https://app.contrezz.com/`

## Best Practice Solution

✅ **Environment-aware URL helpers** - Detect local vs production and use appropriate URLs.

### Implementation

Added helper functions that detect the environment:

```typescript
// Detect if we're in local development
const isLocalDev =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "contrezz.local" ||
  hostname === "app.contrezz.local";

// Get base URLs based on environment
const getAppUrl = () => {
  if (isLocalDev) {
    return `http://localhost:${port || "5173"}`;
  }
  return "https://app.contrezz.com";
};

const getPublicUrl = () => {
  if (isLocalDev) {
    // If using contrezz.local, use that; otherwise use localhost with ?public=true
    if (hostname === "contrezz.local") {
      return `http://contrezz.local:${port || "5173"}`;
    }
    return `http://localhost:${port || "5173"}?public=true`;
  }
  return "https://contrezz.com";
};
```

### Updated Functions

All navigation handlers now use these helpers:

1. **`handleNavigateToLogin()`**

   - Before: `https://app.contrezz.com/login` (hardcoded)
   - After: `${getAppUrl()}/login` (environment-aware)

2. **`handleNavigateToContact()`**

   - Before: `https://contrezz.com/contact` (hardcoded)
   - After: `${getPublicUrl()}/contact` (environment-aware)

3. **`handleBackToHome()`**

   - Before: `https://contrezz.com` (hardcoded)
   - After: `getPublicUrl()` (environment-aware)

4. **Redirect logic in `useEffect`**
   - Before: Hardcoded production URLs
   - After: Uses `getAppUrl()` and `getPublicUrl()`

## Behavior

### Local Development

- **Login from public page:**

  - `http://contrezz.local:5173` → Click Login → `http://localhost:5173/login` ✅
  - `http://localhost:5173?public=true` → Click Login → `http://localhost:5173/login` ✅

- **Contact from login page:**

  - `http://localhost:5173/login` → Click Contact → `http://localhost:5173?public=true/contact` ✅

- **Back to Home from login:**
  - `http://localhost:5173/login` → Click Back to Home → `http://localhost:5173?public=true` ✅

### Production

- **Login from public page:**

  - `https://contrezz.com` → Click Login → `https://app.contrezz.com/login` ✅

- **Contact from login page:**

  - `https://app.contrezz.com/login` → Click Contact → `https://contrezz.com/contact` ✅

- **Back to Home from login:**
  - `https://app.contrezz.com/login` → Click Back to Home → `https://contrezz.com` ✅

## Benefits

1. ✅ **No hardcoded URLs** - All URLs are environment-aware
2. ✅ **Works in local dev** - Stays on localhost
3. ✅ **Works in production** - Uses production domains
4. ✅ **Maintainable** - Single source of truth for URLs
5. ✅ **Follows best practices** - Environment detection pattern

## Testing

### Local Development

1. **Start frontend:**

   ```bash
   npm run dev
   ```

2. **Access public landing:**

   - `http://localhost:5173?public=true` or
   - `http://contrezz.local:5173` (after adding to /etc/hosts)

3. **Click "Login":**

   - Should redirect to: `http://localhost:5173/login` ✅
   - Should NOT redirect to: `https://app.contrezz.com/login` ❌

4. **From login page, click "Contact Sales":**

   - Should redirect to: `http://localhost:5173?public=true/contact` ✅

5. **From login page, click "Back to Home":**
   - Should redirect to: `http://localhost:5173?public=true` ✅

### Production

All redirects should use production domains:

- Login → `https://app.contrezz.com/login`
- Contact → `https://contrezz.com/contact`
- Home → `https://contrezz.com`

---

**Status:** ✅ Fixed - All navigation is now environment-aware
**Best Practice:** ✅ Follows environment detection pattern
