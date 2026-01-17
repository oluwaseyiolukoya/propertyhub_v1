# Quick Fix: Career Creation Issue

## Most Likely Issue

Based on the code review, the issue is likely one of these:

### 1. **Empty `benefits` field causing database error**

The Prisma schema requires `benefits` to be a non-null `Text` field:

```prisma
benefits String @db.Text // Required, not nullable
```

But the frontend might be sending an empty string or the field might be missing, causing a database constraint violation.

### 2. **CORS issue with admin.contrezz.com**

The `ALLOWED_ORIGINS` environment variable might not include `https://admin.contrezz.com`.

## Immediate Fix

### Option 1: Update Backend to Handle Empty Benefits (Recommended)

Update `public-backend/src/routes/admin/careers.ts`:

```typescript
// Around line 156-192
router.post(
  "/",
  adminAuthMiddleware,
  requireEditor,
  async (req: AdminAuthRequest, res: Response): Promise<Response | void> => {
    try {
      console.log("[Career Creation] Received request:", {
        title: req.body.title,
        department: req.body.department,
        hasBenefits: !!req.body.benefits,
        benefitsLength: req.body.benefits?.length,
      });

      // Ensure benefits is never null or undefined
      const data = {
        ...req.body,
        benefits: req.body.benefits || "", // Default to empty string
        postedBy: req.admin?.id,
      };

      const posting = await prisma.career_postings.create({
        data,
      });

      console.log("[Career Creation] Success:", posting.id);

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          "create",
          "career_posting",
          posting.id,
          { title: posting.title, department: posting.department },
          req.ip,
          req.headers["user-agent"]
        );
      }

      return res.status(201).json({
        message: "Career posting created successfully",
        posting,
      });
    } catch (error: any) {
      console.error("[Career Creation] Error:", error);
      console.error("[Career Creation] Error details:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      return res.status(500).json({
        error: error.message || "Failed to create career posting",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);
```

### Option 2: Check and Fix CORS

1. **Check current ALLOWED_ORIGINS**:
   ```bash
   doctl apps get <YOUR_APP_ID> --format Spec | grep -A 5 "ALLOWED_ORIGINS"
   ```

2. **Update if needed**:
   - Go to DigitalOcean Dashboard
   - Apps → contrezz-public-api → Settings → Environment Variables
   - Find `ALLOWED_ORIGINS`
   - Update to: `https://contrezz.com,https://www.contrezz.com,https://admin.contrezz.com`
   - Save and redeploy

## Testing the Fix

### Test 1: Check if it's a CORS issue

Open browser console on `https://admin.contrezz.com/` and run:

```javascript
fetch('https://api.contrezz.com/health')
  .then(r => r.json())
  .then(d => console.log('✅ CORS OK:', d))
  .catch(e => console.error('❌ CORS Error:', e));
```

If you see a CORS error, that's the issue.

### Test 2: Check if it's a validation issue

In the browser console:

```javascript
// Get your token from localStorage
const token = localStorage.getItem('public_admin_token');

// Try to create a career posting
fetch('https://api.contrezz.com/api/admin/careers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Test Position',
    department: 'Engineering',
    location: 'Lagos, Nigeria',
    type: 'Full-time',
    remote: 'Hybrid',
    experience: 'Mid-level',
    description: 'This is a test description that is longer than 50 characters to meet requirements',
    requirements: 'Test requirements',
    responsibilities: 'Test responsibilities',
    benefits: 'Test benefits', // Make sure this is included
    status: 'draft'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

## Deploy the Fix

If you apply Option 1 (backend code change):

```bash
cd public-backend
git add src/routes/admin/careers.ts
git commit -m "fix: Handle empty benefits field in career creation"
git push origin main

# Wait for auto-deployment or trigger manually:
doctl apps create-deployment <YOUR_APP_ID>

# Monitor deployment:
doctl apps logs <YOUR_APP_ID> --follow
```

## Verify the Fix

1. Go to `https://admin.contrezz.com/`
2. Login
3. Click "Careers"
4. Click "Create New Posting"
5. Fill in the form (make sure description is at least 50 characters)
6. Click "Create Posting"
7. Check if it succeeds

If it still fails, check the production logs:

```bash
doctl apps logs <YOUR_APP_ID> --tail 100 | grep -i "career"
```

---

**Most likely culprit**: Empty `benefits` field or CORS configuration.  
**Quick test**: Use browser console test above to identify which one.

