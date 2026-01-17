# Career Post Creation - Debugging Guide

## Issue
Career posts are not being submitted when created in the public admin.

## Diagnostic Steps

### Step 1: Check Browser Console

1. **Open the public admin**: `https://admin.contrezz.com/`
2. **Login** with your credentials
3. **Open DevTools**: Press F12 (or Cmd+Option+I on Mac)
4. **Go to Console tab**
5. **Click on "Careers"** in the sidebar
6. **Click "Create New Posting"** button
7. **Fill in the form**:
   - Title: Test Position
   - Department: Engineering
   - Location: Lagos, Nigeria
   - Type: Full-time
   - Remote: Hybrid
   - Experience: Mid-level
   - Description: (Write at least 50 characters)
   - Requirements: Test requirements
   - Responsibilities: Test responsibilities
8. **Click "Create Posting"**
9. **Check the Console tab** for any errors

### What to Look For:

#### Possible Error 1: Network Error
```
Failed to fetch
ERR_CONNECTION_REFUSED
```
**Meaning**: Backend is not reachable  
**Solution**: Check if production backend is running

#### Possible Error 2: CORS Error
```
Access to fetch at 'https://api.contrezz.com/api/admin/careers' from origin 'https://admin.contrezz.com' has been blocked by CORS policy
```
**Meaning**: CORS not configured for admin.contrezz.com  
**Solution**: Add `https://admin.contrezz.com` to `ALLOWED_ORIGINS`

#### Possible Error 3: Authentication Error
```
{"error":"Invalid token","code":"INVALID_TOKEN"}
{"error":"No token provided"}
```
**Meaning**: Not logged in or session expired  
**Solution**: Logout and login again

#### Possible Error 4: Validation Error
```
{"error":"Description must be at least 50 characters"}
{"error":"Please fill in all required fields"}
```
**Meaning**: Form validation failed  
**Solution**: Fill in all required fields properly

#### Possible Error 5: Database Error
```
{"error":"Failed to create career posting"}
```
**Meaning**: Database issue or missing table  
**Solution**: Check if migrations are applied

### Step 2: Check Network Tab

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Click "Create Posting"**
4. **Look for the POST request** to `/api/admin/careers`
5. **Click on it** to see details

**Check**:
- **Status Code**: Should be 201 (Created) if successful
- **Request Headers**: Should include `Authorization: Bearer <token>`
- **Request Payload**: Should include all form data
- **Response**: What error message is returned?

### Step 3: Test API Directly

#### Test 1: Check if backend is running
```bash
curl https://api.contrezz.com/health
```
Expected: `{"status":"ok",...}`

#### Test 2: Check if careers endpoint exists
```bash
curl https://api.contrezz.com/api/admin/careers
```
Expected: `{"error":"No token provided"}` (this is good - means endpoint exists)

#### Test 3: Test with authentication
You need to get your token first:

```bash
# Login to get token
TOKEN=$(curl -s -X POST https://api.contrezz.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@email.com","password":"your-password"}' \
  | jq -r '.token')

# Try to create a career posting
curl -X POST https://api.contrezz.com/api/admin/careers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Position",
    "department": "Engineering",
    "location": "Lagos, Nigeria",
    "type": "Full-time",
    "remote": "Hybrid",
    "experience": "Mid-level",
    "description": "This is a test description that is longer than 50 characters to meet the minimum requirements for posting",
    "requirements": "Test requirements for this position",
    "responsibilities": "Test responsibilities for this position",
    "status": "draft",
    "benefits": "Test benefits for this position"
  }'
```

### Step 4: Check Production Logs

If you have access to DigitalOcean:

```bash
# Get your app ID
doctl apps list

# View logs
doctl apps logs <YOUR_APP_ID> --follow
```

Look for:
- `Create career error:` - Shows the actual error
- Database connection errors
- Validation errors

## Common Issues and Solutions

### Issue 1: "benefits" field is required but empty

**Problem**: The schema requires `benefits` to be a non-null Text field, but frontend might send empty string or null.

**Check in code**:
```typescript
// In CareerManagement.tsx line 305
payload.benefits = formData.benefits || "";
```

**Solution**: Make sure benefits field is always a string (even if empty).

**Fix**: Update the backend to handle empty benefits:

```typescript
// public-backend/src/routes/admin/careers.ts
router.post("/", adminAuthMiddleware, requireEditor, async (req, res) => {
  try {
    const data = {
      ...req.body,
      benefits: req.body.benefits || "", // Ensure it's never null
      postedBy: req.admin?.id,
    };
    
    const posting = await prisma.career_postings.create({ data });
    // ...
  }
});
```

### Issue 2: Date format issue with expiresAt

**Problem**: Frontend sends date as string, backend expects DateTime.

**Check**: Line 307 in CareerManagement.tsx:
```typescript
if (formData.expiresAt) {
  payload.expiresAt = new Date(formData.expiresAt);
}
```

**Solution**: Ensure date is properly formatted or omitted if empty.

### Issue 3: Missing required fields

**Problem**: Some fields might be undefined instead of empty string.

**Solution**: Check all required fields in the schema:
- ✅ title (required)
- ✅ department (required)
- ✅ location (required)
- ✅ type (required)
- ✅ remote (required)
- ✅ experience (required)
- ✅ description (required, min 50 chars)
- ✅ requirements (required)
- ✅ responsibilities (required)
- ✅ benefits (required, can be empty string)

### Issue 4: CORS not configured

**Problem**: `admin.contrezz.com` not in ALLOWED_ORIGINS.

**Check production environment**:
```bash
doctl apps get <APP_ID> --format Spec
```

Look for `ALLOWED_ORIGINS` environment variable.

**Should include**:
```
ALLOWED_ORIGINS=https://contrezz.com,https://www.contrezz.com,https://admin.contrezz.com
```

**Fix**:
1. Go to DigitalOcean Dashboard
2. Apps → Your App → Settings → Environment Variables
3. Edit `ALLOWED_ORIGINS`
4. Add `https://admin.contrezz.com`
5. Save and redeploy

## Quick Test Script

Save this as `test-career-creation.sh`:

```bash
#!/bin/bash

echo "Testing Career Creation..."
echo ""

# Test 1: Health check
echo "1. Testing backend health..."
HEALTH=$(curl -s https://api.contrezz.com/health)
echo "Response: $HEALTH"
echo ""

# Test 2: Check careers endpoint
echo "2. Testing careers endpoint..."
CAREERS=$(curl -s https://api.contrezz.com/api/admin/careers)
echo "Response: $CAREERS"
echo ""

# Test 3: Try to create (will fail without auth, but shows if endpoint exists)
echo "3. Testing create endpoint..."
CREATE=$(curl -s -X POST https://api.contrezz.com/api/admin/careers \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}')
echo "Response: $CREATE"
echo ""

echo "If you see 'No token provided' or 'Invalid token', the endpoint is working!"
echo "If you see 'Endpoint not found', there's a routing issue."
```

Run it:
```bash
chmod +x test-career-creation.sh
./test-career-creation.sh
```

## What to Share for Further Debugging

If the issue persists, please share:

1. **Screenshot of browser console** when you click "Create Posting"
2. **Screenshot of Network tab** showing the failed request
3. **The exact error message** you see (if any)
4. **Production logs** (if you have access):
   ```bash
   doctl apps logs <APP_ID> --tail 50
   ```

## Temporary Workaround

While debugging, you can create career postings directly in the database:

```sql
-- Connect to production database
-- Then run:

INSERT INTO career_postings (
  id,
  title,
  department,
  location,
  type,
  remote,
  experience,
  description,
  requirements,
  responsibilities,
  benefits,
  status,
  "postedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Software Engineer',
  'Engineering',
  'Lagos, Nigeria',
  'Full-time',
  'Hybrid',
  'Mid-level',
  '<p>We are looking for a talented software engineer...</p>',
  '<p>- 3+ years of experience<br>- Strong problem-solving skills</p>',
  '<p>- Design and develop features<br>- Collaborate with team</p>',
  '<p>- Competitive salary<br>- Health insurance<br>- Remote work</p>',
  'active',
  NOW(),
  NOW(),
  NOW()
);
```

---

**Next Steps**: Please follow Step 1 and Step 2 above and share what you find!

