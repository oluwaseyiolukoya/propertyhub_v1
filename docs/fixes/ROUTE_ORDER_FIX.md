# Route Order Conflict Fix

## Issue Summary

The stage templates endpoint was returning 404 "Project not found" errors due to Express.js route matching conflicts.

## Root Cause

Two routers were mounted at the same path `/api/developer-dashboard/projects`:

1. **First (Line 310):** `developerProjectsProgressRoutes` - Contains `/:projectId/progress` routes
2. **Second (Line 311):** `projectStagesRoutes` - Contains `/stage-templates` and other stage routes

When the frontend called `/api/developer-dashboard/projects/stage-templates`, Express.js was matching it to the wildcard route `/:projectId/progress` in the first router, where `projectId` became "stage-templates". This caused the request to be handled by the progress route, which tried to find a project with ID "stage-templates" and returned "Project not found".

## Solution

**Swapped the mounting order** in `backend/src/index.ts`:

```typescript
// BEFORE (incorrect order)
app.use("/api/developer-dashboard/projects", developerProjectsProgressRoutes);
app.use("/api/developer-dashboard/projects", projectStagesRoutes);

// AFTER (correct order)
app.use("/api/developer-dashboard/projects", projectStagesRoutes);
app.use("/api/developer-dashboard/projects", developerProjectsProgressRoutes);
```

## Why This Works

1. **Specific routes first**: The `/stage-templates` route (no parameters) is now matched before wildcard routes
2. **Route precedence**: Express.js matches routes in the order they're mounted
3. **Avoids conflicts**: Wildcard routes like `/:projectId/progress` only match after specific routes are checked

## Testing

**Before fix:** 
- Request: `GET /api/developer-dashboard/projects/stage-templates`
- Result: 404 "Project not found" (wrong route matched)

**After fix:**
- Request: `GET /api/developer-dashboard/projects/stage-templates`  
- Result: 401 "Invalid token" (correct route matched, authentication working)

## Best Practices Applied

1. **Route Ordering**: Mount specific routes before wildcard routes
2. **Avoid Path Conflicts**: Don't mount multiple routers at the same path when they have overlapping patterns
3. **Clear Documentation**: Added comments explaining the route order importance

## Files Modified

1. **`backend/src/index.ts`** - Swapped router mounting order with explanatory comment

## Related Issues

This fix resolves the frontend error:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
Error loading templates: Error: Project not found
```

The frontend should now successfully load stage templates! 🎉
