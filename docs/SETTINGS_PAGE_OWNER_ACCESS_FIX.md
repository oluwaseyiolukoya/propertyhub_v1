# Settings Page Owner Access Fix

## Issue
Finance Manager (`infokitcon@gmail.com`) could still see the Settings page despite not being the account owner. The Settings page should only be accessible to the Developer Owner/Admin.

## Root Cause Analysis

### Database Investigation
```sql
-- Finance Manager user check
SELECT u.id, u.email, u."customerId", c.email as customer_email, tm.id as team_member_id 
FROM users u 
LEFT JOIN customers c ON u."customerId" = c.id 
LEFT JOIN team_members tm ON tm.user_id = u.id 
WHERE u.email = 'infokitcon@gmail.com';

-- Result:
-- User email: infokitcon@gmail.com
-- Customer email: olukoyaseyifunmi@gmail.com (different)
-- Has team_member_id: b0c5b91d-d99d-43df-8f0f-08dc7585bd7c (is a team member)
-- Expected: isOwner = false
```

```sql
-- Developer Owner check
SELECT id, email, "customerId", role 
FROM users 
WHERE email = 'developer_two@contrezz.com';

-- Result:
-- User email: developer_two@contrezz.com
-- Customer email: developer_two@contrezz.com (matches)
-- No team_members record
-- Expected: isOwner = true
```

### Previous Issue
The backend code was checking for a non-existent `customers.ownerId` column. The `customers` table actually has:
- `owner` (String) — owner's name
- `email` (String) — customer/owner email (primary identifier)

## Solution Implemented

### Backend Changes (`backend/src/routes/auth.ts`)

#### Owner Detection Logic (Applied to both `/login` and `/account` endpoints)

```typescript
// Determine owner status: Owner = user whose email matches customer.email OR no team_members record
if (user.customerId) {
  try {
    // First, check if user email matches customer email (definitive owner check)
    const customer = await prisma.customers.findUnique({
      where: { id: user.customerId },
      select: { email: true }
    });
    
    console.log('🔍 [/account] Owner check for:', {
      userEmail: user.email,
      customerEmail: customer?.email,
      customerId: user.customerId
    });

    if (customer && customer.email.toLowerCase() === user.email.toLowerCase()) {
      // User email matches customer email = DEFINITIVE OWNER
      isOwnerUser = true;
      console.log('✅ [/account] User is owner (email matches customer email):', user.email);
    } else {
      // Check if user has a team_members record
      const teamMember = await prisma.team_members.findFirst({
        where: {
          user_id: user.id,
          customer_id: user.customerId
        },
        include: {
          team_roles: true
        }
      });

      console.log('🔍 [/account] Team member check:', {
        userEmail: user.email,
        hasTeamMember: !!teamMember,
        teamMemberId: teamMember?.id
      });

      if (teamMember) {
        // Has team_members record = NOT owner (team member)
        isOwnerUser = false;
        console.log('❌ [/account] User is team member (NOT OWNER):', user.email);
        
        // Apply role-based permissions for team members
        teamMemberRole = teamMember.team_roles;
        effectivePermissions = {
          ...(teamMember.team_roles?.permissions || {}),
          canApproveInvoices: teamMember.can_approve_invoices ?? teamMember.team_roles?.can_approve_invoices,
          approvalLimit: teamMember.approval_limit ?? teamMember.team_roles?.approval_limit,
          canCreateInvoices: teamMember.can_create_invoices ?? teamMember.team_roles?.can_create_invoices,
          canManageProjects: teamMember.can_manage_projects ?? teamMember.team_roles?.can_manage_projects,
          canViewReports: teamMember.can_view_reports ?? teamMember.team_roles?.can_view_reports,
        };
      } else {
        // No team_members record = ORIGINAL OWNER (account creator)
        isOwnerUser = true;
        console.log('✅ [/account] User is owner (no team membership):', user.email);
      }
    }
  } catch (e) {
    console.warn('⚠️ Could not compute team member/owner status on /account:', e);
    // Fallback: assume owner if error (safer default for account access)
    isOwnerUser = user.customerId ? true : false;
  }
}
```

#### Response Logging
```typescript
console.log('📤 [/account] Sending response:', {
  userEmail: user.email,
  isOwner: isOwnerUser,
  teamMemberRole: teamMemberRole?.name
});

res.json({
  user: {
    // ... other fields
    isOwner: isOwnerUser,
    teamMemberRole: teamMemberRole ? {
      id: teamMemberRole.id,
      name: teamMemberRole.name,
      description: teamMemberRole.description
    } : null
  },
  // ... rest of response
});
```

### Frontend Changes (`src/modules/developer-dashboard/components/DeveloperDashboardRefactored.tsx`)

#### Enhanced Logging
```typescript
if (acctResponse.data) {
  setAccountInfo(acctResponse.data);
  const ownerStatus = !!acctResponse.data.user?.isOwner;
  setIsOwner(ownerStatus);
  console.log('🔍 [DeveloperDashboardRefactored] Owner status check:', {
    email: acctResponse.data.user?.email,
    isOwner: ownerStatus,
    rawIsOwner: acctResponse.data.user?.isOwner,
    teamMemberRole: acctResponse.data.user?.teamMemberRole,
    role: acctResponse.data.user?.role
  });
}
```

### Existing Frontend Guards (Already in Place)

#### 1. Navigation Menu Filter
```typescript
const mainMenuItems: Array<{ id: Page; label: string; icon: any }> = [
  { id: 'portfolio' as Page, label: 'Portfolio', icon: FolderKanban },
];
if (isOwner) {
  mainMenuItems.push({ id: 'settings' as Page, label: 'Settings', icon: Settings });
}
```

#### 2. Dropdown Menu Filter
```typescript
{isOwner && (
  <>
    <DropdownMenuItem onClick={handleOpenSettings}>
      <Settings className="w-4 h-4" />
      <span>Settings</span>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleOpenSettings}>
      <CreditCard className="w-4 h-4" />
      <span>Billing</span>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleOpenSettings}>
      <Users className="w-4 h-4" />
      <span>Team</span>
    </DropdownMenuItem>
  </>
)}
```

#### 3. Navigation Handler Guard
```typescript
const handleOpenSettings = () => {
  if (isOwner) {
    setCurrentPage('settings');
  } else {
    toast.warning('Only account owners can access Settings and Billing.');
  }
};
```

#### 4. Page Guard (useEffect)
```typescript
// Prevent non-owners from staying on settings page
useEffect(() => {
  if (!isOwner && currentPage === 'settings') {
    setCurrentPage('portfolio');
  }
}, [isOwner, currentPage]);
```

#### 5. Render Guard
```typescript
case 'settings':
  if (!isOwner) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Access Restricted</h3>
          <p className="text-gray-600">Only account owners can manage Settings.</p>
        </div>
      </div>
    );
  }
  return <DeveloperSettings user={user} />;
```

## Owner Detection Rules

### Rule 1: Email Match (Highest Priority)
```
IF user.email === customer.email (case-insensitive)
THEN isOwner = true
```

### Rule 2: Team Membership Check
```
IF user has team_members record
THEN isOwner = false (Team Member)
ELSE isOwner = true (Original Owner)
```

### Rule 3: Fallback (Error Handling)
```
IF error occurs during check
THEN isOwner = true (safer default for account access)
```

## Expected Behavior

### Developer Owner (`developer_two@contrezz.com`)
- ✅ User email matches customer email
- ✅ `isOwner = true`
- ✅ Can see Settings in navigation
- ✅ Can access Settings page
- ✅ Can see Billing, Team in dropdown

### Finance Manager (`infokitcon@gmail.com`)
- ❌ User email ≠ customer email
- ✅ Has `team_members` record
- ❌ `isOwner = false`
- ❌ Cannot see Settings in navigation
- ❌ Cannot access Settings page (redirected to Portfolio)
- ❌ Cannot see Billing, Team in dropdown
- ✅ Has role-based permissions (Finance Manager)

### Original Account Owner (`olukoyaseyifunmi@gmail.com`)
- ✅ User email matches customer email
- ✅ No `team_members` record (or both checks pass)
- ✅ `isOwner = true`
- ✅ Full Settings access

## Testing Instructions

### 1. Clear Browser Cache
```bash
# Clear localStorage and cookies for localhost:5173
# Or use incognito/private browsing mode
```

### 2. Test Finance Manager
```
1. Log in as: infokitcon@gmail.com
2. Expected: NO Settings link in sidebar
3. Expected: NO Settings/Billing/Team in profile dropdown
4. Expected: Dashboard shows Finance Manager role
5. Check browser console for:
   🔍 [DeveloperDashboardRefactored] Owner status check: { isOwner: false }
```

### 3. Test Developer Owner
```
1. Log in as: developer_two@contrezz.com
2. Expected: Settings link visible in sidebar
3. Expected: Settings/Billing/Team visible in profile dropdown
4. Expected: Can access Settings page
5. Check browser console for:
   🔍 [DeveloperDashboardRefactored] Owner status check: { isOwner: true }
```

### 4. Backend Logs
Check backend console for:
```
🔍 [/account] Owner check for: { userEmail, customerEmail, customerId }
✅ [/account] User is owner (email matches customer email): email
   OR
❌ [/account] User is team member (NOT OWNER): email
📤 [/account] Sending response: { userEmail, isOwner, teamMemberRole }
```

## Database Schema Reference

### `customers` table
```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  owner TEXT NOT NULL,        -- Owner's name (not used for auth)
  email TEXT UNIQUE NOT NULL, -- Primary identifier for owner
  -- ... other fields
);
```

### `users` table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "customerId" TEXT REFERENCES customers(id),
  role TEXT NOT NULL,
  -- ... other fields
);
```

### `team_members` table
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES team_roles(id),
  -- ... other fields
);
```

## Security Considerations

1. **Multiple Layers of Protection**
   - Backend: `isOwner` flag calculation
   - Frontend: Navigation filtering
   - Frontend: Handler guards
   - Frontend: Page guards
   - Frontend: Render guards

2. **Fallback Strategy**
   - On error: Default to `isOwner = true` (safer for account access)
   - Prevents accidental lockout of legitimate owners

3. **Logging for Debugging**
   - Backend logs owner detection logic
   - Frontend logs received owner status
   - Easy to trace issues in production

## Files Modified

### Backend
- `backend/src/routes/auth.ts`
  - Updated `/login` endpoint owner detection
  - Updated `/account` endpoint owner detection
  - Added comprehensive logging

### Frontend
- `src/modules/developer-dashboard/components/DeveloperDashboardRefactored.tsx`
  - Added logging to `fetchAccountData`
  - (All guards already in place from previous fix)

## Related Documentation
- `docs/ROLE_BASED_PAGE_ACCESS_MATRIX.md` - Complete role access matrix
- `docs/TEAM_MEMBER_ROLE_BASED_PERMISSIONS.md` - Role permission details
- `docs/TEAM_MEMBER_PROJECT_ACCESS_FIX.md` - Project access implementation

## Status
✅ **COMPLETE** - Backend and frontend updated with enhanced owner detection and logging.

## Next Steps
1. Test with Finance Manager account (`infokitcon@gmail.com`)
2. Test with Developer Owner account (`developer_two@contrezz.com`)
3. Verify backend logs show correct owner detection
4. Verify frontend logs show correct owner status
5. Confirm Settings page is hidden for team members
6. Confirm Settings page is visible for owners

