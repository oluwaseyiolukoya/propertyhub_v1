# 🐛 Debug Tenant Login Issue

## Issue
Tenant login redirects to Owner dashboard instead of Tenant dashboard.

## Debug Steps

### Step 1: Open Browser Console
1. Open http://localhost:5173
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to the "Console" tab

### Step 2: Try Tenant Login
Use one of these credentials:
```
Email: leke@gmail.com
Password: ett2gsszTLQS
User Type: Tenant
```

### Step 3: Check Console Logs
After clicking Login, you should see logs like:

```
🔐 Login - Initial Type: tenant
👤 User Data: { id: '...', email: '...', role: '...', ... }
📋 User Role: tenant
🏢 Customer ID: 710988d0-8966-4757-888b-74c5516e0b36
🎯 UserType from backend: tenant

🔍 deriveUserTypeFromUser:
   - Original role: tenant
   - Normalized role: tenant  
   - customerId: 710988d0-8966-4757-888b-74c5516e0b36
   - isInternal: false
   → Customer user (has customerId)
   → Matched: tenant

🔍 Derived Type: tenant
✅ Final UserType: tenant
```

### Step 4: Share Console Output
**Copy all the console logs and share them** so I can see exactly what's happening.

## Expected vs Actual

### Expected:
- Final UserType should be: `tenant`
- Should redirect to: Tenant Dashboard
- Should see: Property info, lease details, etc.

### Actual (Current Issue):
- Final UserType might be: `owner` or something else
- Redirects to: Owner Dashboard
- Need to see console logs to confirm

## Quick Test Commands

If you want to check the database directly:

```bash
cd backend
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.users.findFirst({
  where: { email: 'leke@gmail.com' },
  select: { email: true, role: true, customerId: true, status: true, isActive: true }
}).then(u => { 
  console.log('Tenant data:', u); 
  prisma.\$disconnect();
});
"
```

## Possible Causes

1. **Role mismatch**: Role might not be 'tenant' (checked ✅ - it is)
2. **CustomerId issue**: Tenant might not have customerId (checked ✅ - they do)
3. **UserType override**: Frontend might be overriding the userType
4. **Caching**: Old session data might be cached
5. **LoginPage issue**: LoginPage might be passing wrong user type

## Try This

### Clear Browser Cache
1. Open Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Try logging in again

### Check Local Storage
1. Open Developer Tools (F12)
2. Go to "Application" tab
3. Go to "Local Storage" → http://localhost:5173
4. Check values for:
   - `auth_token`
   - `user_data`
   - `user_type`
5. Clear all three items
6. Try logging in again

## Next Steps

After you try logging in and share the console logs, I can:
1. Identify exactly where the issue is
2. Fix the routing logic
3. Ensure tenants go to the correct dashboard

---

**Please try logging in as a tenant and share the console output!** 📋

