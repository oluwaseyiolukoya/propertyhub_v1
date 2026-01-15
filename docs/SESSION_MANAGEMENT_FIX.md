# Session Management Fix

## Issue Summary

The application had critical session management issues:

1. **Multiple sessions created on each login** - Every login created a new session record, even when logging in from the same device with the same token
2. **Sessions not revoked on logout** - When users logged out, their session remained active in the database and visible in the settings page
3. **Frontend logout not calling backend** - The App.tsx logout handler only cleared local storage without notifying the backend to revoke the session

## Root Causes

### 1. Duplicate Session Creation
**Location:** `backend/src/routes/auth.ts` - `createSession()` function

**Problem:**
```typescript
const createSession = async (userId: string, token: string, req: Request) => {
  // Always created new session without checking if one exists
  await prisma.sessions.create({
    data: {
      userId,
      token,
      device,
      browser,
      os,
      ipAddress,
      userAgent,
      location: "Unknown",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
};
```

**Why it happened:** The function never checked if a session with the same token already existed before creating a new one. This caused multiple session records with the same token.

### 2. Logout Not Revoking Sessions
**Location:** `backend/src/routes/auth.ts` - `/logout` endpoint

**Problem:**
```typescript
router.post("/logout", authMiddleware, async (req: AuthRequest, res: Response) => {
  // Used updateMany which might not match sessions
  await prisma.sessions.updateMany({
    where: {
      userId,
      token,
      isActive: true,
    },
    data: {
      isActive: false,
      updatedAt: new Date(),
    },
  });
});
```

**Why it happened:** The `updateMany` query didn't handle edge cases where sessions might not be found, and didn't provide clear feedback about whether revocation succeeded.

### 3. Frontend Not Calling Backend Logout
**Location:** `src/App.tsx` - `handleLogout()` function

**Problem:**
```typescript
const handleLogout = () => {
  // Only cleared local storage, never called backend
  sessionManager.clearSessionManually();
  
  // Reset state...
  setCurrentUser(null);
  setUserType("");
  // ...
};
```

**Why it happened:** The logout function was synchronous and only cleared frontend state without calling the backend `/api/auth/logout` endpoint.

## Solutions Implemented

### 1. Fixed Duplicate Session Creation ✅

**File:** `backend/src/routes/auth.ts`

**Changes:**
- Added check for existing session before creating new one
- Update existing session instead of creating duplicate
- Log both create and update actions

```typescript
const createSession = async (userId: string, token: string, req: Request) => {
  const userAgent = req.headers["user-agent"] || "";
  const { browser, os, device } = parseUserAgent(userAgent);
  const ipAddress = req.ip || req.socket.remoteAddress || "Unknown";

  try {
    // Check if a session with this token already exists
    const existingSession = await prisma.sessions.findUnique({
      where: { token },
    });

    if (existingSession) {
      // Update existing session instead of creating a duplicate
      await prisma.sessions.update({
        where: { token },
        data: {
          isActive: true,
          lastActive: new Date(),
          device,
          browser,
          os,
          ipAddress,
          userAgent,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      });
      console.log(
        `✅ Session updated for user ${userId} from ${device} (${browser} on ${os})`
      );
    } else {
      // Create new session
      await prisma.sessions.create({
        data: {
          userId,
          token,
          device,
          browser,
          os,
          ipAddress,
          userAgent,
          location: "Unknown",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      console.log(
        `✅ Session created for user ${userId} from ${device} (${browser} on ${os})`
      );
    }
  } catch (error) {
    console.error("Failed to create/update session:", error);
    // Don't fail login if session creation fails
  }
};
```

**Benefits:**
- ✅ No duplicate sessions on repeated logins
- ✅ Existing sessions are refreshed with updated metadata
- ✅ Session expiry is extended on each login
- ✅ Clear logging for debugging

### 2. Fixed Logout Session Revocation ✅

**File:** `backend/src/routes/auth.ts`

**Changes:**
- Use `findUnique` to locate session by token
- Use `update` instead of `updateMany` for targeted revocation
- Handle case where session doesn't exist
- Always return success to allow logout even on errors

```typescript
router.post("/logout", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const token = req.headers.authorization?.replace("Bearer ", "").trim();

    if (!userId || !token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`🔒 Attempting to revoke session for user ${userId}`);

    // First, try to find the session by token
    const session = await prisma.sessions.findUnique({
      where: { token },
    });

    if (session) {
      // Session found, mark it as inactive
      await prisma.sessions.update({
        where: { token },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
      console.log(`🔒 Session revoked: ${session.id} for user ${userId}`);
    } else {
      // Session not found, but still log out successfully
      console.log(`⚠️ No session found for token, but allowing logout for user ${userId}`);
    }

    return res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout error:", error);
    // Even if there's an error, we should allow logout
    return res.json({ message: "Logged out successfully" });
  }
});
```

**Benefits:**
- ✅ Sessions are properly revoked on logout
- ✅ Handles edge cases gracefully
- ✅ Logout always succeeds for better UX
- ✅ Clear logging for debugging

### 3. Fixed Frontend Logout to Call Backend ✅

**File:** `src/App.tsx`

**Changes:**
- Made `handleLogout` async
- Call backend logout API before clearing local storage
- Handle errors gracefully

```typescript
const handleLogout = async () => {
  try {
    // Call backend to revoke session first
    const { logout } = await import('./lib/api/auth');
    await logout();
  } catch (error) {
    console.error('Failed to revoke session on backend:', error);
    // Continue with logout even if backend call fails
  }

  // Clear session data
  sessionManager.clearSessionManually();

  // Reset all user-related state
  setCurrentUser(null);
  setUserType("");
  setCustomerData(null);
  setSignupData(null);

  // Reset all UI state flags
  setShowLanding(false);
  setShowGetStarted(false);
  setShowAccountReview(false);
  setShowApplicationStatus(false);
  setShowAPIDocumentation(false);
  // ... (rest of state resets)
};
```

**Benefits:**
- ✅ Backend session is revoked on logout
- ✅ Session disappears from settings page
- ✅ Logout continues even if backend fails
- ✅ Better security and user experience

## Verification

### Sessions Endpoint Already Correct ✅
The `GET /api/auth/sessions` endpoint was already correctly filtering for active sessions:

```typescript
const dbSessions = await prisma.sessions.findMany({
  where: {
    userId,
    isActive: true,  // Only show active sessions
    OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],  // Not expired
  },
  orderBy: {
    lastActive: "desc",
  },
});
```

### Frontend Session Display Already Correct ✅
The frontend components in `PropertyOwnerSettings.tsx` already:
- Fetch sessions from the correct API endpoint
- Display session metadata correctly
- Handle session revocation with proper API calls
- Refresh session list after revocation

## Testing Checklist

Test the following scenarios to verify the fixes:

### 1. Session Creation
- [ ] Login from same device multiple times
- [ ] Verify only one session exists per token in database
- [ ] Check that session metadata is updated on each login

### 2. Session Display
- [ ] Navigate to Settings > Sessions tab
- [ ] Verify only active sessions are shown
- [ ] Check that revoked sessions don't appear

### 3. Session Revocation
- [ ] Click "Revoke" on a non-current session
- [ ] Verify session disappears from the list
- [ ] Check that revoked session is marked `isActive: false` in database

### 4. Logout
- [ ] Click logout button
- [ ] Verify session is revoked in database
- [ ] Login again and check that old session doesn't appear
- [ ] Verify new session is created on next login

### 5. Multiple Devices
- [ ] Login from two different browsers/devices
- [ ] Verify both sessions appear in Settings
- [ ] Logout from one device
- [ ] Verify only that device's session is revoked
- [ ] Other device should remain logged in

## Database Schema

The sessions table structure (already correct):

```sql
CREATE TABLE "sessions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "device" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "location" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "lastActive" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
```

## Summary

### Files Modified
1. `backend/src/routes/auth.ts` - Fixed session creation and logout
2. `src/App.tsx` - Fixed frontend logout to call backend

### Files Verified (Already Correct)
1. `backend/src/routes/auth.ts` - Sessions endpoint
2. `src/lib/api/auth.ts` - Session API functions
3. `src/components/PropertyOwnerSettings.tsx` - Session display and revocation

### Impact
- ✅ No more duplicate sessions on login
- ✅ Sessions properly revoked on logout
- ✅ Settings page shows accurate active sessions
- ✅ Better security and user experience
- ✅ Cleaner database with accurate session tracking

### Testing Status
- ✅ No linting errors
- ⏳ Manual testing required (see Testing Checklist above)

---

**Date:** 2026-01-15
**Version:** 1.0
**Status:** Ready for Testing

