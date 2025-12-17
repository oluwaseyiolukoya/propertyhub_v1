# Test Login Endpoint Directly

## Test with curl

**Test the login endpoint to see the exact error:**

```bash
curl -X POST https://api.contrezz.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@contrezz.com","password":"Korede@1988"}' \
  -v
```

This will show:

- The exact HTTP status code
- The error message from the backend
- Any CORS headers

## Expected Response

**If successful:**

```json
{
  "token": "eyJhbGc...",
  "admin": {
    "id": "...",
    "email": "admin@contrezz.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**If failed:**

```json
{
  "error": "Invalid email or password"
}
```

## Check Backend Logs

**In DigitalOcean:**

1. Go to DigitalOcean → `contrezz-public-api` app
2. Click **Runtime Logs**
3. Try logging in (or run the curl command)
4. Look for error messages in the logs

**Look for:**

- "Invalid email or password"
- "Admin account is deactivated"
- Database connection errors
- Any other authentication errors

---

**Last Updated:** December 16, 2025

