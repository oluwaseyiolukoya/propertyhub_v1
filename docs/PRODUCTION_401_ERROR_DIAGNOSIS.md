# Production 401 Error on `/api/auth/validate-session` - Diagnosis Guide

## Error

```
api.app.contrezz.com/api/auth/validate-session:1  Failed to load resource: the server responded with a status of 401 ()
```

## Potential Causes & Solutions

### 1. **JWT_SECRET Mismatch** ⚠️ MOST COMMON

**Symptom:** Token verification fails immediately in `authMiddleware`

**Cause:**

- Production backend has different `JWT_SECRET` than the one used to sign tokens
- Token was signed with one secret, but backend is verifying with another

**Check:**

```bash
# On production server
echo $JWT_SECRET
# Compare with the JWT_SECRET used when tokens were issued
```

**Solution:**

- Ensure `JWT_SECRET` is consistent across all environments
- If changed, all users need to re-login
- Use environment-specific secrets managed via secrets manager

**Code Location:** `backend/src/middleware/auth.ts:44`

---

### 2. **Token Expired (JWT exp claim)**

**Symptom:** JWT verification fails with "TokenExpiredError"

**Cause:**

- JWT token has expired (check `exp` claim in token)
- Default token expiration may be too short

**Check:**

```javascript
// Decode token (without verification) to see expiration
const decoded = jwt.decode(token);
console.log("Expires at:", new Date(decoded.exp * 1000));
console.log("Current time:", new Date());
```

**Solution:**

- Increase token expiration time in login endpoint
- Implement token refresh mechanism
- Check `JWT_EXPIRES_IN` environment variable

**Code Location:** `backend/src/middleware/auth.ts:44` (jwt.verify throws TokenExpiredError)

---

### 3. **Session Revoked in Database**

**Symptom:** Token is valid but session check fails

**Cause:**

- Session record exists in database with `isActive = false`
- User was logged out or session was manually revoked

**Check:**

```sql
SELECT * FROM sessions
WHERE token = '<token>'
AND userId = '<user_id>';
-- Check isActive and expiresAt columns
```

**Solution:**

- This is expected behavior - user needs to re-login
- Check if sessions are being incorrectly revoked
- Verify session cleanup logic isn't too aggressive

**Code Location:** `backend/src/middleware/auth.ts:63-68`

---

### 4. **Session Expired in Database**

**Symptom:** Token valid but `expiresAt < now()`

**Cause:**

- Database session has expired even if JWT hasn't
- Session expiration time is shorter than JWT expiration

**Check:**

```sql
SELECT expiresAt, NOW() as current_time
FROM sessions
WHERE token = '<token>';
```

**Solution:**

- Align session expiration with JWT expiration
- Extend session expiration time
- Implement session refresh on activity

**Code Location:** `backend/src/middleware/auth.ts:72-77`

---

### 5. **Token Not Sent in Request**

**Symptom:** "No token provided" error

**Cause:**

- Frontend not sending Authorization header
- Token lost from localStorage/sessionStorage
- CORS preflight stripping headers

**Check:**

```javascript
// In browser console
console.log("Token:", localStorage.getItem("auth_token"));
// Check Network tab - Request Headers should have:
// Authorization: Bearer <token>
```

**Solution:**

- Verify token is stored and retrieved correctly
- Check CORS configuration allows Authorization header
- Ensure token is sent on all requests

**Code Location:** `backend/src/middleware/auth.ts:28-30`

---

### 6. **User Not Found in Database**

**Symptom:** Token valid but user doesn't exist

**Cause:**

- User was deleted from database
- Database connection issue
- User ID in token doesn't match database

**Check:**

```sql
SELECT id, email, role, isActive, status
FROM users
WHERE id = '<user_id_from_token>';
```

**Solution:**

- Verify user exists in production database
- Check database connection
- Ensure user wasn't accidentally deleted

**Code Location:** `backend/src/routes/auth.ts:746-751`

---

### 7. **Database Connection Issues**

**Symptom:** Session check fails silently or times out

**Cause:**

- Production database is down or unreachable
- Connection pool exhausted
- Network issues between backend and database

**Check:**

```bash
# On production server
# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check backend logs for database errors
tail -f /var/log/backend.log | grep -i "database\|prisma\|connection"
```

**Solution:**

- Verify database is running and accessible
- Check connection pool settings
- Monitor database connection metrics
- Add retry logic for transient failures

**Code Location:** `backend/src/middleware/auth.ts:50-90` (session check)

---

### 8. **CORS Configuration Issues**

**Symptom:** Preflight request fails or headers stripped

**Cause:**

- CORS not configured to allow Authorization header
- Preflight OPTIONS request failing
- Frontend origin not whitelisted

**Check:**

```bash
# Test CORS
curl -X OPTIONS https://api.app.contrezz.com/api/auth/validate-session \
  -H "Origin: https://app.contrezz.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  -v
```

**Solution:**

- Verify CORS allows `Authorization` header
- Check `FRONTEND_URL` environment variable
- Ensure preflight requests are handled correctly

**Code Location:** `backend/src/index.ts` (CORS middleware)

---

### 9. **Token Format Issues**

**Symptom:** Token exists but format is invalid

**Cause:**

- Token corrupted in storage
- Token not properly formatted (missing "Bearer " prefix)
- Token truncated

**Check:**

```javascript
// In browser console
const token = localStorage.getItem("auth_token");
console.log("Token length:", token?.length);
console.log("Token format:", token?.substring(0, 20) + "...");
// Should start with something like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

**Solution:**

- Clear localStorage and re-login
- Verify token storage/retrieval logic
- Check for token truncation issues

**Code Location:** `backend/src/middleware/auth.ts:23-26`

---

### 10. **Environment Variable Missing**

**Symptom:** "JWT_SECRET environment variable is not set"

**Cause:**

- `JWT_SECRET` not set in production environment
- Environment variables not loaded properly

**Check:**

```bash
# On production server
echo $JWT_SECRET
# Should output a secret string, not empty
```

**Solution:**

- Set `JWT_SECRET` in production environment
- Verify `.env` file is loaded or use environment variable injection
- Restart backend after setting

**Code Location:** `backend/src/middleware/auth.ts:36-42`

---

## Diagnostic Steps

### Step 1: Check Backend Logs

```bash
# On production server
tail -f /var/log/backend.log | grep -E "Auth|validate-session|401"
```

Look for:

- `❌ Auth failed: No token provided`
- `❌ Auth failed: Invalid token`
- `❌ Session revoked`
- `❌ Session expired`
- `❌ Token error details`

### Step 2: Test Token Manually

```bash
# Get token from browser localStorage
# Then test on production:
curl -X GET https://api.app.contrezz.com/api/auth/validate-session \
  -H "Authorization: Bearer <token>" \
  -v
```

### Step 3: Check Database

```sql
-- Check if user exists
SELECT id, email, role, isActive, status
FROM users
WHERE email = '<user_email>';

-- Check sessions
SELECT token, userId, isActive, expiresAt, lastActive
FROM sessions
WHERE userId = '<user_id>'
ORDER BY lastActive DESC
LIMIT 5;
```

### Step 4: Verify Environment Variables

```bash
# On production server
env | grep -E "JWT_SECRET|DATABASE_URL|FRONTEND_URL|NODE_ENV"
```

### Step 5: Check Frontend Token Storage

```javascript
// In browser console on app.contrezz.com
console.log("Token exists:", !!localStorage.getItem("auth_token"));
console.log("Token length:", localStorage.getItem("auth_token")?.length);
```

---

## Quick Fixes

### If JWT_SECRET Mismatch:

1. Identify which secret was used to sign tokens
2. Update production `JWT_SECRET` to match
3. OR force all users to re-login

### If Token Expired:

1. Increase token expiration in login endpoint
2. Implement token refresh mechanism
3. Clear localStorage and re-login

### If Session Issues:

1. Check session cleanup logic
2. Extend session expiration time
3. Verify session table isn't being truncated

### If Database Connection:

1. Check database status
2. Verify connection string
3. Check connection pool limits
4. Restart backend service

---

## Prevention

1. **Monitor 401 rates** - Alert if 401 rate spikes
2. **Log all auth failures** - Include token prefix, user ID, reason
3. **Token refresh** - Implement automatic token refresh before expiration
4. **Session health checks** - Monitor session table size and cleanup
5. **Environment validation** - Verify all required env vars on startup

---

## Related Files

- `backend/src/middleware/auth.ts` - Authentication middleware
- `backend/src/routes/auth.ts` - Validate session endpoint
- `src/lib/sessionValidator.ts` - Frontend session validation
- `src/lib/api-client.ts` - API client with auth headers

---

**Last Updated:** December 22, 2025


