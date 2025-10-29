# Permission Debugging Guide

## Issue
Permissions are not being saved/loaded correctly:
1. Owner sets permissions and saves
2. After refresh, permissions revert to default
3. Manager doesn't receive the permissions

## Debugging Steps

### Step 1: Check if permissions are being saved
1. Open browser console (F12)
2. Navigate to **Owner Dashboard → Settings → Security**
3. Check/uncheck any permission
4. Click **"Save Permissions"**
5. Look for these console logs:

**Frontend logs:**
```
💾 Saving permissions: { managerCanViewUnits: true, ... }
✅ Save result: { message: '...', permissions: {...} }
```

**Backend logs** (in `server-dev.log`):
```
💾 Received permissions update request: { userId: '...', userRole: 'owner', body: {...} }
📝 Built permissions object: { managerCanViewUnits: true, ... }
✅ Manager permissions updated for user: ... New permissions: { ... }
```

### Step 2: Check if permissions are being loaded
1. Refresh the page
2. Navigate back to **Settings → Security**
3. Look for these console logs:

**Frontend logs:**
```
🔄 Loading permissions from database...
✅ Settings loaded: { id: '...', permissions: {...} }
📝 Applying permissions: { managerCanViewUnits: true, ... }
```

**Backend logs:**
```
🔍 GET /settings called for user: ...
✅ Settings retrieved for user: ... Permissions: { ... }
```

### Step 3: Check database directly
Run this query in your database:

```sql
SELECT id, email, role, permissions 
FROM users 
WHERE role IN ('owner', 'property_owner', 'property owner');
```

Expected result: The `permissions` column should contain a JSON object with all permission flags.

### Step 4: Test manager login
1. Manager logs out (if logged in)
2. Manager logs in again
3. Check backend logs for:

```
✅ Applied owner permissions to manager: manager@email.com
```

4. Check frontend console for manager's user object:
```javascript
localStorage.getItem('user')
// Should contain: { ..., permissions: { managerCanViewUnits: true, ... } }
```

## Common Issues & Solutions

### Issue 1: ERR_CONNECTION_REFUSED
**Symptom:** API calls fail with connection refused error

**Solution:**
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
sleep 2
npm run dev > ../server-dev.log 2>&1 &
```

### Issue 2: Permissions not loading after refresh
**Symptom:** Checkboxes revert to defaults after page refresh

**Possible causes:**
1. GET /api/settings not being called
2. API returning empty permissions
3. Frontend not applying loaded permissions correctly

**Debug:**
- Check browser Network tab for `/api/settings` call
- Verify response contains permissions object
- Check console for "Applying permissions" log

### Issue 3: Permissions not saving
**Symptom:** Save button works but data not persisted

**Possible causes:**
1. PUT /api/settings/manager-permissions not being called
2. User role check failing (not recognized as owner)
3. Database update failing

**Debug:**
- Check browser Network tab for `/api/settings/manager-permissions` call
- Check response status (should be 200)
- Check backend logs for permission update confirmation
- Query database to verify permissions column

### Issue 4: Manager not receiving permissions
**Symptom:** Manager sees all actions as disabled

**Possible causes:**
1. Manager hasn't logged in since owner changed permissions
2. Owner's permissions not being fetched during manager login
3. Frontend not checking permissions correctly

**Solution:**
1. Manager must **log out and log back in** after owner changes permissions
2. Check backend logs during manager login for "Applied owner permissions" message
3. Check localStorage for manager's user object

## Testing Checklist

### Owner Tests
- [ ] Navigate to Settings → Security
- [ ] Verify permissions load from database (check console)
- [ ] Change some permissions
- [ ] Click "Save Permissions"
- [ ] Verify save success (check console + backend logs)
- [ ] Refresh page
- [ ] Verify changed permissions are still there
- [ ] Query database to confirm permissions saved

### Manager Tests
- [ ] Owner changes manager permissions
- [ ] Manager logs out
- [ ] Manager logs in again
- [ ] Verify manager receives owner's permissions (check console)
- [ ] Navigate to Properties → Units Tab
- [ ] Verify only permitted actions appear in three-dot menu
- [ ] Try to perform permitted action (should work)
- [ ] Verify unpermitted actions don't appear

## Quick Test Commands

### Check backend logs in real-time:
```bash
tail -f /Users/oluwaseyio/test_ui_figma_and_cursor/server-dev.log | grep -E "(💾|📝|✅|❌|🔍)"
```

### Check if backend is running:
```bash
curl http://localhost:5000/api/health
```

### Query permissions directly:
```bash
# Using psql
psql $DATABASE_URL -c "SELECT id, email, role, permissions FROM users WHERE role IN ('owner', 'property_owner');"
```

## Expected Behavior

1. **Owner saves permissions:**
   - Frontend sends PUT request to `/api/settings/manager-permissions`
   - Backend validates owner role
   - Backend saves permissions to `users.permissions` (JSONB field)
   - Backend returns success with saved permissions
   - Frontend shows success toast

2. **Owner refreshes page:**
   - Frontend sends GET request to `/api/settings`
   - Backend fetches user record with permissions
   - Frontend receives permissions object
   - Frontend applies permissions to checkboxes
   - Checkboxes reflect saved state

3. **Manager logs in:**
   - Backend validates manager credentials
   - Backend finds owner by `customerId`
   - Backend fetches owner's permissions
   - Backend includes permissions in login response
   - Frontend stores user object with permissions
   - Manager's UI shows only permitted actions

## Important Notes

- Permissions are stored at **owner level**, inherited by **all managers** under that owner
- Changes take effect for managers **on next login** (not immediately)
- Owner always has **full access** (no permission checks)
- Default permissions favor **safety** (destructive actions OFF)
- Manager must **log out and log in again** to receive updated permissions

## Files to Check

- Frontend: `src/components/PropertyOwnerSettings.tsx`
- Frontend API: `src/lib/api/settings.ts`
- Backend: `backend/src/routes/settings.ts`
- Backend Auth: `backend/src/routes/auth.ts`
- Manager UI: `src/components/PropertyManagement.tsx`
- Database: `users` table, `permissions` column (JSONB)


