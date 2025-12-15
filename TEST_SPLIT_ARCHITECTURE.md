# Testing Guide for Split Architecture

Complete testing checklist to verify the split architecture is working correctly.

## 🎯 Quick Test Checklist

- [ ] Public API responds (careers endpoint)
- [ ] App API responds (authenticated endpoints)
- [ ] Frontend loads careers from public API
- [ ] Frontend loads app data from app API
- [ ] DNS is correctly configured
- [ ] SSL certificates are working
- [ ] No CORS errors
- [ ] Authentication works with app API

---

## 📋 Testing Methods

### Method 1: Local Testing (Before Production)

#### Step 1: Start Both Backends

**Terminal 1 - Public Backend:**

```bash
cd public-backend
npm run dev
# Should start on http://localhost:5001
```

**Terminal 2 - App Backend:**

```bash
cd backend
npm run dev
# Should start on http://localhost:5000
```

**Terminal 3 - Frontend:**

```bash
npm run dev
# Should start on http://localhost:5173 (or 5174)
```

#### Step 2: Test Public API

```bash
# Test careers endpoint
curl http://localhost:5001/api/careers

# Test filters endpoint
curl http://localhost:5001/api/careers/filters

# Expected: JSON response with career postings
```

#### Step 3: Test App API

```bash
# Test health endpoint (no auth required)
curl http://localhost:5000/api/health

# Test authenticated endpoint (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/users
```

#### Step 4: Test Frontend

1. Open `http://localhost:5173` (or 5174)
2. Open browser DevTools → Network tab
3. Navigate to careers page
4. Verify:

   - ✅ Requests to `localhost:5001/api/careers` (public API)
   - ✅ No SSL errors
   - ✅ Careers data loads
   - ✅ Filters work

5. Log in to app
6. Navigate to dashboard
7. Verify:
   - ✅ Requests to `localhost:5000/api/*` (app API)
   - ✅ Data loads correctly
   - ✅ No authentication errors

---

### Method 2: Production Testing (After Deployment)

#### Step 1: Verify DNS

```bash
# Check public API DNS
dig api.contrezz.com +short
# Should return: contrezz-public-api-xxxxx.ondigitalocean.app

# Check app API DNS
dig api.app.contrezz.com +short
# Should return: contrezz-backend-prod-xxxxx.ondigitalocean.app
```

#### Step 2: Test Public API

```bash
# Test careers endpoint
curl https://api.contrezz.com/api/careers

# Test filters endpoint
curl https://api.contrezz.com/api/careers/filters

# Expected: JSON response, no SSL errors
```

#### Step 3: Test App API

```bash
# Test health endpoint
curl https://api.app.contrezz.com/api/health

# Test authenticated endpoint (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.app.contrezz.com/api/users
```

#### Step 4: Test Frontend in Production

1. Open `https://contrezz.com` (or your frontend URL)
2. Open browser DevTools → Network tab
3. Navigate to careers page
4. Verify:

   - ✅ Requests to `https://api.contrezz.com/api/careers`
   - ✅ No SSL errors
   - ✅ No CORS errors
   - ✅ Careers data loads

5. Log in to app
6. Navigate to dashboard
7. Verify:
   - ✅ Requests to `https://api.app.contrezz.com/api/*`
   - ✅ Data loads correctly
   - ✅ Authentication works

---

## 🔍 Detailed Testing Scenarios

### Scenario 1: Public Careers Page

**Test Steps:**

1. Visit careers page (no login required)
2. Check Network tab
3. Verify API calls

**Expected Results:**

- ✅ API calls go to `api.contrezz.com/api/careers`
- ✅ No authentication required
- ✅ Careers list displays
- ✅ Filters work (department, location)
- ✅ Search works
- ✅ No console errors

**If Failing:**

- Check `VITE_PUBLIC_API_URL` environment variable
- Check public backend is running
- Check DNS for `api.contrezz.com`
- Check CORS settings in public backend

---

### Scenario 2: App Dashboard (Authenticated)

**Test Steps:**

1. Log in to app
2. Navigate to dashboard
3. Check Network tab
4. Verify API calls

**Expected Results:**

- ✅ API calls go to `api.app.contrezz.com/api/*`
- ✅ Authentication token included in headers
- ✅ Data loads (users, customers, etc.)
- ✅ No 401/403 errors

**If Failing:**

- Check `VITE_API_URL` environment variable
- Check app backend is running
- Check DNS for `api.app.contrezz.com`
- Check JWT token is valid

---

### Scenario 3: Cross-Domain Navigation

**Test Steps:**

1. Visit `contrezz.com` (public site)
2. Click "Log In" or "Get Started"
3. Should navigate to `app.contrezz.com`
4. Log in
5. Should work correctly

**Expected Results:**

- ✅ Navigation between domains works
- ✅ Authentication persists
- ✅ No redirect loops
- ✅ No CORS errors

---

## 🛠️ Quick Test Script

Create a test script to verify everything:

```bash
#!/bin/bash
# test-split-architecture.sh

echo "🧪 Testing Split Architecture"
echo ""

# Test Public API
echo "1. Testing Public API..."
PUBLIC_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.contrezz.com/api/careers)
if [ "$PUBLIC_RESPONSE" = "200" ]; then
  echo "   ✅ Public API is working"
else
  echo "   ❌ Public API failed (HTTP $PUBLIC_RESPONSE)"
fi

# Test App API
echo "2. Testing App API..."
APP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.app.contrezz.com/api/health)
if [ "$APP_RESPONSE" = "200" ]; then
  echo "   ✅ App API is working"
else
  echo "   ❌ App API failed (HTTP $APP_RESPONSE)"
fi

# Test DNS
echo "3. Testing DNS..."
PUBLIC_DNS=$(dig +short api.contrezz.com | head -1)
APP_DNS=$(dig +short api.app.contrezz.com | head -1)

if [[ "$PUBLIC_DNS" == *"ondigitalocean.app"* ]]; then
  echo "   ✅ Public API DNS is correct: $PUBLIC_DNS"
else
  echo "   ❌ Public API DNS is incorrect: $PUBLIC_DNS"
fi

if [[ "$APP_DNS" == *"ondigitalocean.app"* ]]; then
  echo "   ✅ App API DNS is correct: $APP_DNS"
else
  echo "   ❌ App API DNS is incorrect: $APP_DNS"
fi

echo ""
echo "✅ Testing complete!"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: SSL Certificate Error

**Error:** `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`

**Solution:**

- Check DNS is pointing to correct DigitalOcean app
- Wait for SSL certificate to be issued (can take 5-10 minutes)
- Verify domain is added in DigitalOcean app settings

---

### Issue 2: CORS Error

**Error:** `Access to fetch at 'https://api.contrezz.com' from origin 'https://contrezz.com' has been blocked by CORS policy`

**Solution:**

- Check `ALLOWED_ORIGINS` in public backend environment variables
- Should include: `https://contrezz.com,https://app.contrezz.com`
- Restart public backend after updating

---

### Issue 3: 404 Not Found

**Error:** `404 Not Found` for API endpoints

**Solution:**

- Check DNS is correctly configured
- Verify app is deployed and running
- Check routes are registered in backend code

---

### Issue 4: Wrong API Being Called

**Error:** Careers page calling app API instead of public API

**Solution:**

- Check `VITE_PUBLIC_API_URL` is set correctly
- Verify `publicApi.ts` is using correct URL
- Check browser console for actual API calls
- Rebuild frontend after changing environment variables

---

## ✅ Success Criteria

Your split architecture is working correctly when:

1. ✅ Public pages (careers, landing) use `api.contrezz.com`
2. ✅ App pages (dashboard, settings) use `api.app.contrezz.com`
3. ✅ No SSL errors
4. ✅ No CORS errors
5. ✅ Authentication works with app API
6. ✅ Public endpoints work without authentication
7. ✅ DNS resolves correctly
8. ✅ Both backends are accessible

---

## 📝 Testing Checklist

Use this checklist to verify everything:

### Local Testing

- [ ] Public backend runs on port 5001
- [ ] App backend runs on port 5000
- [ ] Frontend runs on port 5173/5174
- [ ] Careers page loads from public API
- [ ] App dashboard loads from app API
- [ ] No console errors

### Production Testing

- [ ] `api.contrezz.com` resolves correctly
- [ ] `api.app.contrezz.com` resolves correctly
- [ ] Public API responds with 200
- [ ] App API responds with 200
- [ ] SSL certificates are valid
- [ ] Frontend uses correct APIs
- [ ] Authentication works
- [ ] No CORS errors

### Integration Testing

- [ ] Careers page works
- [ ] Landing page works
- [ ] App login works
- [ ] App dashboard works
- [ ] Navigation between domains works
- [ ] Data loads correctly

---

## 🚀 Next Steps After Testing

Once everything is working:

1. ✅ Monitor for errors in production
2. ✅ Set up error tracking (Sentry, etc.)
3. ✅ Set up analytics
4. ✅ Document any custom configurations
5. ✅ Update team on new architecture

---

**Last Updated:** December 14, 2025
