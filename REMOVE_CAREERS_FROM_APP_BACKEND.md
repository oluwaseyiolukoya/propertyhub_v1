# Remove Careers Routes from App Backend

## ✅ Change Applied

Removed careers routes from the app backend (`backend/src/index.ts`) since they are now handled by the public-backend.

## Why

With the split architecture:

- **Public content** (careers, blog, landing pages) → `public-backend` (`api.contrezz.com`)
- **Application features** (properties, users, payments) → `app-backend` (`api.app.contrezz.com`)

Careers are public content, so they belong in the public-backend.

## What Was Removed

**From `backend/src/index.ts`:**

```typescript
// REMOVED:
import careersRoutes from "./routes/careers";
app.use("/api/careers", careersRoutes);
```

## Current Setup

### Public Backend (`public-backend`)

- ✅ Has careers routes at `/api/careers`
- ✅ Handles all public career endpoints
- ✅ No authentication required for public endpoints

### App Backend (`backend`)

- ✅ No longer has careers routes
- ✅ Focuses on application features only
- ✅ Avoids route conflicts

### Frontend

- ✅ Uses `publicApi` for career-related calls
- ✅ Uses `apiClient` for app-related calls
- ✅ Already configured correctly in `src/lib/api/careers.ts`

## Next Steps

1. **Restart app backend** to apply changes:

   ```bash
   cd backend
   npm run dev
   ```

2. **Verify careers still work:**

   - Public careers page should work (uses public-backend)
   - Admin career management should work (if it uses public-backend)

3. **Optional cleanup:**
   - Can delete `backend/src/routes/careers.ts` if no longer needed
   - Can delete `backend/src/services/career.service.ts` if no longer needed
   - **Note:** Keep them for now if admin career management still uses app backend

## Verification

After restarting backend:

```bash
# Should return 404 (careers not in app backend)
curl http://localhost:5000/api/careers

# Should work (careers in public backend)
curl http://localhost:5001/api/careers

# Should work (properties in app backend)
curl http://localhost:5000/api/properties
```

---

**Status:** ✅ Careers routes removed from app backend
**Impact:** None - careers are handled by public-backend
**Action Required:** Restart app backend
