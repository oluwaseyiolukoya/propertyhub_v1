# Frontend Integration Guide for Split Architecture

How to update your frontend to work with the new split backend architecture.

## 🎯 Overview

With the split architecture, your frontend needs to know which API to call:

- **Public pages** (contrezz.com) → `api.contrezz.com`
- **App pages** (app.contrezz.com) → `api.app.contrezz.com`

## 📋 Changes Required

### 1. Environment Variables

**Public Frontend (.env):**

```bash
# Vite/React
VITE_PUBLIC_API_URL=https://api.contrezz.com/api
VITE_APP_SIGNUP_URL=https://app.contrezz.com/signup

# Next.js
NEXT_PUBLIC_API_URL=https://api.contrezz.com/api
NEXT_PUBLIC_APP_SIGNUP_URL=https://app.contrezz.com/signup
```

**App Frontend (.env):**

```bash
# Existing - no changes
VITE_API_URL=https://api.app.contrezz.com/api
```

### 2. API Client Updates

**Option A: Separate API Clients (Recommended)**

```typescript
// src/lib/api/publicApi.ts
const PUBLIC_API_URL =
  import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:5001/api";

export const publicApi = {
  get: async (endpoint: string) => {
    const response = await fetch(`${PUBLIC_API_URL}${endpoint}`);
    if (!response.ok) throw new Error("API request failed");
    return response.json();
  },
  // No auth headers needed
};

// src/lib/api/appApi.ts
const APP_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const appApi = {
  get: async (endpoint: string, token?: string) => {
    const response = await fetch(`${APP_API_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) throw new Error("API request failed");
    return response.json();
  },
  // Auth headers included
};
```

**Option B: Unified Client with Context**

```typescript
// src/lib/api/client.ts
type APIContext = "public" | "app";

const getBaseURL = (context: APIContext) => {
  if (context === "public") {
    return import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:5001/api";
  }
  return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
};

export const apiClient = {
  get: async (
    endpoint: string,
    context: APIContext = "app",
    token?: string
  ) => {
    const baseURL = getBaseURL(context);
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Only add auth for app context
    if (context === "app" && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseURL}${endpoint}`, { headers });
    if (!response.ok) throw new Error("API request failed");
    return response.json();
  },
};
```

### 3. Update Career Pages (Public)

**Before:**

```typescript
// src/lib/api/careers.ts
import { apiClient } from "./client";

export const getCareers = async (filters?: CareerFilters) => {
  const params = new URLSearchParams(filters as any);
  const response = await apiClient.get(`/careers?${params}`, getAuthToken());
  return response.data;
};
```

**After:**

```typescript
// src/lib/api/careers.ts
import { publicApi } from "./publicApi";

export const getCareers = async (filters?: CareerFilters) => {
  const params = new URLSearchParams(filters as any);
  // No auth token needed - public API
  const response = await publicApi.get(`/careers?${params}`);
  return response.data;
};

export const getCareerFilters = async () => {
  const response = await publicApi.get("/careers/filters");
  return response.data;
};

export const getCareerStats = async () => {
  const response = await publicApi.get("/careers/stats");
  return response.data;
};

export const getCareer = async (id: string) => {
  const response = await publicApi.get(`/careers/${id}`);
  return response.data;
};
```

### 4. Update Career Components

**CareersPage.tsx:**

```typescript
import { useState, useEffect } from "react";
import { getCareers, getCareerFilters } from "@/lib/api/careers";

export function CareersPage() {
  const [careers, setCareers] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // No auth needed - public API
        const [careersData, filtersData] = await Promise.all([
          getCareers(filters),
          getCareerFilters(),
        ]);

        setCareers(careersData.postings);
      } catch (error) {
        console.error("Failed to load careers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  // ... rest of component
}
```

### 5. Admin Career Management (App)

**Admin stays in app backend - no changes needed:**

```typescript
// src/lib/api/admin/careers.ts
import { appApi } from "../appApi";
import { getAuthToken } from "@/lib/auth";

// These continue using app API with auth
export const createCareer = async (data: CareerData) => {
  const token = getAuthToken();
  return appApi.post("/admin/careers", data, token);
};

export const updateCareer = async (id: string, data: CareerData) => {
  const token = getAuthToken();
  return appApi.put(`/admin/careers/${id}`, data, token);
};

export const deleteCareer = async (id: string) => {
  const token = getAuthToken();
  return appApi.delete(`/admin/careers/${id}`, token);
};
```

### 6. Cross-Domain Navigation

**From Public to App (Signup/Login):**

```typescript
// src/components/HeroSection.tsx
export function HeroSection() {
  const handleGetStarted = () => {
    // Redirect to app domain
    window.location.href =
      import.meta.env.VITE_APP_SIGNUP_URL || "https://app.contrezz.com/signup";
  };

  return (
    <div className="hero">
      <h1>Welcome to Contrezz</h1>
      <button onClick={handleGetStarted}>Get Started</button>
    </div>
  );
}
```

**From App to Public (View Careers):**

```typescript
// src/components/CareerLink.tsx
export function CareerLink() {
  const handleViewCareers = () => {
    // Open public site in new tab
    window.open("https://contrezz.com/careers", "_blank");
  };

  return <button onClick={handleViewCareers}>View Open Positions</button>;
}
```

### 7. Update Deployment Configs

**Vercel (vercel.json):**

```json
{
  "env": {
    "VITE_PUBLIC_API_URL": "https://api.contrezz.com/api",
    "VITE_API_URL": "https://api.app.contrezz.com/api",
    "VITE_APP_SIGNUP_URL": "https://app.contrezz.com/signup"
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://api.contrezz.com/api/$1"
    }
  ]
}
```

**Netlify (netlify.toml):**

```toml
[build.environment]
  VITE_PUBLIC_API_URL = "https://api.contrezz.com/api"
  VITE_API_URL = "https://api.app.contrezz.com/api"
  VITE_APP_SIGNUP_URL = "https://app.contrezz.com/signup"

[[redirects]]
  from = "/api/*"
  to = "https://api.contrezz.com/api/:splat"
  status = 200
```

## 🧪 Testing

### Local Development

```bash
# Terminal 1: Public Backend
cd public-backend
npm run dev
# Runs on http://localhost:5001

# Terminal 2: App Backend
cd backend
npm run dev
# Runs on http://localhost:5000

# Terminal 3: Public Frontend
cd public-frontend
VITE_PUBLIC_API_URL=http://localhost:5001/api npm run dev

# Terminal 4: App Frontend
cd app-frontend
VITE_API_URL=http://localhost:5000/api npm run dev
```

### Test Public API Calls

```typescript
// Test in browser console
fetch("https://api.contrezz.com/api/careers")
  .then((r) => r.json())
  .then(console.log);
```

### Test App API Calls

```typescript
// Test with auth token
const token = localStorage.getItem("authToken");
fetch("https://api.app.contrezz.com/api/customers", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((r) => r.json())
  .then(console.log);
```

## 🔐 Security Considerations

### 1. No Credentials on Public API

```typescript
// ❌ WRONG - Don't send auth to public API
fetch("https://api.contrezz.com/api/careers", {
  credentials: "include", // DON'T DO THIS
  headers: {
    Authorization: "Bearer token", // DON'T DO THIS
  },
});

// ✅ CORRECT - No auth for public API
fetch("https://api.contrezz.com/api/careers");
```

### 2. Separate Auth Tokens

```typescript
// Store tokens separately
const publicCache = {}; // No tokens
const appAuth = {
  token: localStorage.getItem("authToken"),
  refreshToken: localStorage.getItem("refreshToken"),
};
```

### 3. CORS Configuration

Public backend allows any origin (public content):

```typescript
// public-backend CORS
ALLOWED_ORIGINS=https://contrezz.com,https://www.contrezz.com
```

App backend restricts to app domain:

```typescript
// app-backend CORS
ALLOWED_ORIGINS=https://app.contrezz.com
```

## 📊 Analytics Integration

Track API calls separately:

```typescript
// src/lib/analytics.ts
export const trackAPICall = (apiType: "public" | "app", endpoint: string) => {
  if (import.meta.env.PROD) {
    // Track in analytics
    gtag("event", "api_call", {
      api_type: apiType,
      endpoint: endpoint,
    });
  }
};

// Usage
const careers = await getCareers(filters);
trackAPICall("public", "/careers");
```

## 🎨 UI Updates

### Loading States

```typescript
function CareersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCareers()
      .then((data) => setCareers(data.postings))
      .catch((err) => setError("Failed to load careers"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <CareersList careers={careers} />;
}
```

### Error Handling

```typescript
// src/lib/api/errorHandler.ts
export const handleAPIError = (error: any, context: "public" | "app") => {
  if (context === "public") {
    // Public errors - show user-friendly message
    return "Unable to load content. Please try again later.";
  } else {
    // App errors - might need logout
    if (error.status === 401) {
      logout();
      return "Session expired. Please log in again.";
    }
    return error.message || "An error occurred";
  }
};
```

## ✅ Migration Checklist

- [ ] Update environment variables
- [ ] Create separate API clients
- [ ] Update career API calls
- [ ] Update career components
- [ ] Test locally with both backends
- [ ] Update deployment configs
- [ ] Test CORS in production
- [ ] Verify analytics tracking
- [ ] Test cross-domain navigation
- [ ] Update error handling

## 🚀 Deployment Order

1. Deploy public backend
2. Deploy app backend (if changes)
3. Update DNS
4. Deploy public frontend
5. Deploy app frontend
6. Test all flows

## 📚 Example Files

See these example implementations:

- `src/lib/api/publicApi.ts` - Public API client
- `src/lib/api/careers.ts` - Career API calls
- `src/components/CareersPage.tsx` - Career listings page

---

**Last Updated:** December 2024  
**Status:** Ready for Implementation
