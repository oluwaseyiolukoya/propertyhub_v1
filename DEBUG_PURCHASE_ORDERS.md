# 🔍 Debugging Purchase Orders 500 Error

## Steps to Debug

### 1. Check Backend Server Logs
Look at your backend terminal/console for the detailed error message. The error handler now logs:
- Error message
- Stack trace
- Error code
- Meta information

### 2. Verify Backend Server Restarted
After adding `authMiddleware`, the backend server needs to be restarted:

```bash
# Stop the backend server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### 3. Check Prisma Client
Make sure Prisma Client is up to date:

```bash
cd backend
npx prisma generate
```

### 4. Test the Endpoint Directly
You can test the endpoint with curl (replace TOKEN with your auth token):

```bash
curl -X GET "http://localhost:5000/api/developer-dashboard/projects/d2024f0c-4f5c-4b74-bcb6-7f23a96ec9ef/purchase-orders" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 5. Common Issues

#### Issue: `req.user` is undefined
**Solution**: Make sure `authMiddleware` is applied BEFORE the route handler

#### Issue: Prisma relation error
**Solution**: Run `npx prisma generate` to regenerate Prisma Client

#### Issue: Database connection error
**Solution**: Check `DATABASE_URL` in `.env` file

#### Issue: Missing `customerId` or `userId`
**Solution**: Check that the user is properly authenticated and has a `customerId`

## Current Error Handling

The route now:
- ✅ Checks for `userId` and `customerId` before proceeding
- ✅ Returns 401 if user info is missing
- ✅ Logs detailed error information to console
- ✅ Returns error details in response

## Next Steps

1. **Restart backend server** (most likely needed)
2. **Check backend console** for the actual error message
3. **Verify authentication** - make sure you're logged in
4. **Check database** - verify the `purchase_orders` table exists

