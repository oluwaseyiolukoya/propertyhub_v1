# Role & Permission Changes - Real-Time Best Practices

## 🎯 The Challenge

When an admin changes a user's role or permissions, that user is still logged in with their **old JWT token** containing outdated credentials. The user won't see changes until they log out and log back in.

### Example Scenario:
1. **Admin:** Changes User A's role from "Super Admin" → "Support"
2. **Database:** Updates immediately ✅
3. **User A's Token:** Still says "Super Admin" ❌
4. **User A's Dashboard:** Still has full Super Admin access ❌
5. **Security Risk:** User has unauthorized access until they manually log out

---

## 🔐 Security Considerations

### JWT Token Limitations:
- **Stateless:** JWT tokens can't be revoked without complex infrastructure
- **Embedded Data:** Role and permissions are encoded in the token
- **TTL:** Tokens are valid until expiration (typically hours/days)
- **No Database Link:** JWT doesn't check database on every request

### Security Risks:
- ❌ User retains old permissions after role downgrade
- ❌ Deactivated users can still access the system
- ❌ Permission changes don't take effect immediately
- ❌ Potential unauthorized data access

---

## 💡 Solution Approaches

### **Approach 1: Force Re-authentication (Implemented ✅)**

**How it works:**
1. Admin changes user's role/permissions
2. Backend detects the change
3. Emits `force:reauth` event via Socket.io to affected user
4. User's browser receives notification
5. Shows warning message with 15-second grace period
6. Auto-logs out user
7. User must log back in to get new token with updated role

**Pros:**
- ✅ **Most Secure:** Guarantees stale tokens are invalidated
- ✅ **Transparent:** User knows why they're being logged out
- ✅ **Simple:** No complex token management
- ✅ **Immediate:** Changes take effect right away
- ✅ **Industry Standard:** Used by most enterprise applications

**Cons:**
- ❌ User loses unsaved work (grace period minimizes this)
- ❌ Slight interruption to workflow

**Best For:** 
- Production systems
- Security-sensitive applications
- Role-based access control (RBAC)
- Multi-admin environments

---

### **Approach 2: Silent Token Refresh**

**How it works:**
1. Admin changes user's role
2. Backend emits event to user
3. Frontend automatically requests new token
4. Token refreshed in background
5. User continues working with new permissions

**Pros:**
- ✅ Seamless user experience
- ✅ No interruption to workflow
- ✅ User doesn't lose work

**Cons:**
- ❌ **Complex Implementation:** Requires refresh token infrastructure
- ❌ **Security Concerns:** Race conditions possible
- ❌ **Token Management:** Need short-lived access tokens + long-lived refresh tokens
- ❌ **More Attack Surface:** Refresh tokens can be stolen
- ❌ **Timing Issues:** User might make requests with old token during refresh

**Required Infrastructure:**
```typescript
// Need to implement:
- Refresh token table in database
- Refresh token rotation
- Refresh token expiration
- Refresh token revocation
- Token refresh endpoint
- Token refresh logic in frontend
```

**Best For:**
- High-frequency permission changes
- Systems where workflow interruption is unacceptable
- Applications with robust token management

---

### **Approach 3: Database Permission Check on Every Request**

**How it works:**
1. User makes API request
2. Backend validates JWT (authentication)
3. **Extra step:** Query database for current user permissions
4. Check if user has required permission
5. Allow or deny request

**Pros:**
- ✅ Always up-to-date permissions
- ✅ No token refresh needed
- ✅ No user logout required

**Cons:**
- ❌ **Performance Hit:** Extra database query on EVERY request
- ❌ **Database Load:** Can overwhelm database under high traffic
- ❌ **Latency:** Adds 5-50ms to every API call
- ❌ **Scaling Issues:** Database becomes bottleneck
- ❌ **Not Best Practice:** JWT defeats its purpose (stateless)

**Example:**
```typescript
// On every API call:
const user = jwt.verify(token); // ✅ Fast (no DB)
const permissions = await db.getUserPermissions(user.id); // ❌ Slow (DB query)
if (!permissions.includes('READ_CUSTOMERS')) {
  return 403; // Forbidden
}
```

**Best For:**
- Internal tools with low traffic
- Prototypes/MVP
- Systems with very frequent permission changes

---

### **Approach 4: Short-Lived Tokens + Auto-Refresh**

**How it works:**
1. Issue short-lived access tokens (5-15 minutes)
2. Issue long-lived refresh tokens (7-30 days)
3. Frontend auto-refreshes token before expiration
4. Role changes take effect at next token refresh

**Pros:**
- ✅ Changes propagate relatively quickly
- ✅ No manual logout required
- ✅ Good balance of security and UX

**Cons:**
- ❌ **Complex:** Requires full token refresh infrastructure
- ❌ **Delayed:** Changes not immediate (up to 15 min delay)
- ❌ **More Code:** Significant development overhead
- ❌ **Refresh Token Security:** Must protect refresh tokens

**Best For:**
- OAuth2-style applications
- SaaS platforms with millions of users
- When you need Netflix/Google-level auth

---

## 📊 Comparison Matrix

| Approach | Security | UX | Complexity | Performance | Recommended |
|----------|----------|-----|------------|-------------|-------------|
| **Force Re-auth** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⚪⚪ | ⭐⭐⚪⚪⚪ | ⭐⭐⭐⭐⭐ | ✅ **Yes** |
| **Silent Refresh** | ⭐⭐⭐⭐⚪ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⚪ | ⚠️ Advanced |
| **DB Check** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⚪⚪⚪ | ⭐⚪⚪⚪⚪ | ❌ No |
| **Short-Lived Tokens** | ⭐⭐⭐⭐⚪ | ⭐⭐⭐⭐⚪ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⚪ | ⚠️ Large scale |

---

## 🎯 Our Implementation: Force Re-authentication

### Backend Implementation

**Detection of Security-Sensitive Changes:**
```typescript
// backend/src/routes/users.ts

// Get existing user before update
const existingUser = await prisma.user.findUnique({ where: { id } });

// Update user
const updatedUser = await prisma.user.update({ 
  where: { id }, 
  data: { role, permissions, isActive } 
});

// Detect changes
const roleChanged = role && role !== existingUser.role;
const permissionsChanged = permissions && 
  JSON.stringify(permissions) !== JSON.stringify(existingUser.permissions);
const statusChanged = isActive !== existingUser.isActive;

// Force re-auth if needed
if (roleChanged || permissionsChanged || statusChanged) {
  const reason = roleChanged 
    ? `Your role has been changed from ${existingUser.role} to ${role}`
    : 'Your account permissions have been updated';
    
  forceUserReauth(userId, reason);
}
```

**Socket.io Event Emission:**
```typescript
// backend/src/lib/socket.ts

export const forceUserReauth = (userId: string, reason: string) => {
  emitToUser(userId, 'force:reauth', { 
    reason,
    timestamp: new Date().toISOString()
  });
  console.log(`🔐 Forcing re-authentication for user ${userId}: ${reason}`);
};
```

### Frontend Implementation

**Listen for Force Re-auth Events:**
```typescript
// src/components/SuperAdminDashboard.tsx

subscribeToForceReauth((data) => {
  // Show warning notification
  toast.warning(
    <div className="space-y-2">
      <p className="font-semibold">Account Update Required</p>
      <p className="text-sm">{data.reason}</p>
      <p className="text-xs text-gray-500">Please log in again to continue.</p>
    </div>,
    {
      duration: 10000,
      action: {
        label: 'Log Out Now',
        onClick: () => onLogout()
      }
    }
  );

  // Auto-logout after 15 seconds
  setTimeout(() => {
    toast.info('Logging out due to account changes...');
    onLogout();
  }, 15000);
});
```

---

## 🔥 User Experience Flow

### Happy Path:

```
1. Admin Dashboard:
   ┌─────────────────────────────┐
   │ Edit User: John Smith       │
   │ Role: Super Admin → Support │
   │ [Save Changes]              │
   └─────────────────────────────┘
                ↓
2. Backend:
   ✅ User updated in database
   📡 Emit 'force:reauth' to John's socket
                ↓
3. John's Dashboard:
   ⚠️  Toast Notification Appears:
   ┌─────────────────────────────────────────┐
   │ ⚠️  Account Update Required             │
   │                                         │
   │ Your role has been changed from         │
   │ Super Admin to Support                  │
   │                                         │
   │ Please log in again to continue.        │
   │                                         │
   │ [Log Out Now]    Auto-logout in 15s    │
   └─────────────────────────────────────────┘
                ↓
4. 15 seconds later:
   ✅ John is logged out automatically
   🔄 Redirected to login page
                ↓
5. John logs back in:
   ✅ Gets new JWT with "Support" role
   ✅ Dashboard shows Support-level permissions
   ✅ Can only access allowed features
```

---

## ⚡ Advanced: Implementing Silent Token Refresh

If you need to implement silent token refresh in the future, here's the architecture:

### Database Schema:
```prisma
model RefreshToken {
  id          String   @id @default(uuid())
  userId      String
  token       String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  revokedAt   DateTime?
  replacedBy  String?  // For token rotation
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
}
```

### Backend Endpoints:
```typescript
// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  // Validate refresh token
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true }
  });
  
  if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  
  // Generate new access token with current user data
  const accessToken = jwt.sign(
    { 
      id: tokenRecord.user.id, 
      role: tokenRecord.user.role,  // Fresh from database
      permissions: tokenRecord.user.permissions 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  // Token rotation: Create new refresh token
  const newRefreshToken = await prisma.refreshToken.create({
    data: {
      userId: tokenRecord.userId,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });
  
  // Revoke old refresh token
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revokedAt: new Date(), replacedBy: newRefreshToken.token }
  });
  
  res.json({ 
    accessToken, 
    refreshToken: newRefreshToken.token 
  });
});
```

### Frontend Auto-Refresh:
```typescript
// src/lib/auth.ts
let refreshTimer: NodeJS.Timeout;

export const setupTokenRefresh = (accessToken: string, refreshToken: string) => {
  // Decode to get expiration
  const decoded = jwtDecode(accessToken);
  const expiresIn = decoded.exp * 1000 - Date.now();
  
  // Refresh 1 minute before expiration
  const refreshIn = expiresIn - 60000;
  
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
        await response.json();
      
      // Store new tokens
      localStorage.setItem('token', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      // Setup next refresh
      setupTokenRefresh(newAccessToken, newRefreshToken);
    } catch (error) {
      // Refresh failed - log user out
      console.error('Token refresh failed:', error);
      window.location.href = '/login';
    }
  }, refreshIn);
};
```

---

## 🎓 Industry Examples

### How Major Platforms Handle This:

**Google Workspace:**
- Uses short-lived tokens (1 hour)
- Auto-refreshes in background
- Forces re-login for major permission changes
- **Lesson:** Hybrid approach works well

**Slack:**
- Forces logout on role/permission changes
- Shows clear notification why
- Preserves draft messages
- **Lesson:** User communication is key

**AWS Console:**
- 12-hour session tokens
- Requires re-login for security changes
- Shows countdown timer
- **Lesson:** Give users time to prepare

**Microsoft Teams:**
- Silent token refresh
- Forces re-auth for security events
- Graceful degradation
- **Lesson:** Combine multiple approaches

---

## ✅ Best Practices Summary

### ✅ DO:
1. **Force logout for security-critical changes** (role, permissions, deactivation)
2. **Give users a grace period** (10-15 seconds) to save work
3. **Explain why** in the notification (user education)
4. **Provide immediate action** (Log Out Now button)
5. **Log the events** for audit purposes
6. **Use Socket.io** for real-time notifications
7. **Test edge cases** (multiple tabs, offline users)

### ❌ DON'T:
1. **Don't check database on every request** (performance killer)
2. **Don't keep stale tokens** (security risk)
3. **Don't implement token refresh without proper infrastructure**
4. **Don't force logout without explanation** (bad UX)
5. **Don't rely only on token expiration** (too slow)
6. **Don't forget offline users** (emit event when they reconnect)

---

## 🧪 Testing Checklist

- [ ] Admin changes user role → User receives notification
- [ ] User has 15 seconds before auto-logout
- [ ] User can click "Log Out Now" for immediate logout
- [ ] After logout, user sees login page
- [ ] After re-login, new role is active
- [ ] Multiple browser tabs all logout simultaneously
- [ ] Offline users get notification when they reconnect
- [ ] Notification shows correct reason for logout
- [ ] Admin dashboard shows user was updated
- [ ] Logs show force reauth event

---

## 📚 Further Reading

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Token Refresh](https://oauth.net/2/grant-types/refresh-token/)
- [NIST Authentication Guidelines](https://pages.nist.gov/800-63-3/)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## 🎯 Conclusion

For **Contrezz** and most production applications:

✅ **Use Force Re-authentication** (our implementation)

It provides the best balance of:
- **Security:** No stale tokens
- **Simplicity:** Easy to understand and maintain
- **Transparency:** Users know what's happening
- **Performance:** No extra database queries

Only upgrade to silent token refresh if you have:
- Very frequent permission changes
- Mission-critical workflows that can't be interrupted
- Resources to build robust token management infrastructure

**The best solution is the one you can properly secure and maintain.** 🔐

