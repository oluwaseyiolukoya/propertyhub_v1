# Route Conflict Resolution - Stage Templates 404 Error

## Issue Summary

The `/api/developer-dashboard/projects/stage-templates` endpoint was returning **404 "Project not found"** errors, preventing the frontend from loading stage templates.

## Root Cause Analysis

### The Problem

Express.js was matching the wrong route due to **route mounting order**. Here's what was happening:

1. **Request:** `GET /api/developer-dashboard/projects/stage-templates`

2. **Route Matching Process:**
   - Express checks routes in the order they're mounted
   - `developerDashboardRoutes` was mounted first at `/api/developer-dashboard`
   - This router contains a route: `/projects/:projectId` (line 334)
   - Express matched `/projects/stage-templates` to `/projects/:projectId` where `projectId` = "stage-templates"
   - The handler tried to find a project with ID "stage-templates"
   - It didn't exist, so returned **404 "Project not found"**

3. **Why the Specific Route Never Matched:**
   - `projectStagesRoutes` was mounted AFTER `developerDashboardRoutes`
   - By the time Express checked `projectStagesRoutes`, it had already matched a route
   - Express stops at the first match, so `/stage-templates` was never evaluated

### Code Evidence

**Before (Incorrect Order):**
```typescript
// backend/src/index.ts (lines 309-312)
app.use("/api/developer-dashboard", developerDashboardRoutes);  // ❌ Mounted first
app.use("/api/developer-dashboard/projects", projectStagesRoutes);  // ❌ Never reached
```

**developer-dashboard.ts route that was matching:**
```typescript
// backend/src/routes/developer-dashboard.ts (line 334)
router.get('/projects/:projectId', async (req: Request, res: Response) => {
  // This matched /projects/stage-templates where projectId = "stage-templates"
  // Returned 404 "Project not found"
});
```

## Solution

**Mounted specific routes BEFORE general routes** to ensure Express checks specific patterns first:

```typescript
// backend/src/index.ts (lines 311-313)
// IMPORTANT: Mount specific project routes BEFORE the general developer-dashboard routes
// to prevent wildcard routes like /projects/:projectId from matching /projects/stage-templates
app.use("/api/developer-dashboard/projects", projectStagesRoutes);  // ✅ Mounted first
app.use("/api/developer-dashboard/projects", developerProjectsProgressRoutes);
app.use("/api/developer-dashboard", developerDashboardRoutes);  // ✅ Mounted last
```

### Why This Works

1. **Route Specificity:** Express matches routes in order, so more specific routes should be mounted first
2. **Path Matching:** When Express evaluates `/api/developer-dashboard/projects/stage-templates`:
   - First checks `projectStagesRoutes` (mounted at `/api/developer-dashboard/projects`)
   - Matches `/stage-templates` route ✅
   - Returns templates successfully
   - Never reaches the wildcard route in `developerDashboardRoutes`

## Testing Results

**Before Fix:**
```bash
$ curl http://localhost:5000/api/developer-dashboard/projects/stage-templates
{"error":"Project not found"}  # ❌ Wrong route matched
```

**After Fix:**
```bash
$ curl http://localhost:5000/api/developer-dashboard/projects/stage-templates
{"templates":[...]}  # ✅ Correct route matched, returns templates
```

## Key Learnings

### Express.js Route Matching Rules

1. **Order Matters:** Routes are matched in the order they're mounted
2. **First Match Wins:** Express stops at the first matching route
3. **Specific Before General:** Always mount specific routes before wildcard routes
4. **Path Prefix Matching:** When a router is mounted at a path, Express strips that prefix before matching routes within the router

### Best Practices Applied

1. ✅ **Mount specific routes before wildcard routes**
2. ✅ **Use descriptive comments explaining route order importance**
3. ✅ **Test route matching with different path patterns**
4. ✅ **Verify route order in production-like environments**

## Files Modified

1. **`backend/src/index.ts`**
   - Changed route mounting order (lines 311-313)
   - Added explanatory comment about route order importance

## Related Issues

This fix resolves:
- ✅ Frontend error: `Failed to load resource: 404 (Not Found)`
- ✅ Frontend error: `Error loading templates: Error: Project not found`
- ✅ Backend route matching conflicts

## Verification Steps

1. ✅ Backend restarted with new route order
2. ✅ Endpoint `/api/developer-dashboard/projects/stage-templates` returns templates
3. ✅ Frontend can now successfully load stage templates
4. ✅ Other project routes (`/:projectId/dashboard`, etc.) still work correctly

## Conclusion

The issue was a classic Express.js route ordering problem. By mounting specific routes before general wildcard routes, we ensured that `/stage-templates` matches correctly before `/projects/:projectId` can intercept it.

**Status:** ✅ **RESOLVED**

The stage templates feature is now fully functional! 🎉

