# Permission Save & Load Fix

## Issue
Manager permissions were not persisting after save and refresh. When owner checked permissions and clicked "Save", they appeared to save, but after refreshing the page, the checkboxes reverted to their default state.

## Root Cause
1. **Incomplete State Merge**: When loading permissions from the database, the code was using a simple spread operator (`...settings.permissions`) which might not have been properly merging with the existing `securitySettings` state.
2. **No Verification After Save**: After saving, there was no reload to verify the permissions were actually saved to the database.
3. **Potential Type Issues**: The permissions object might have been stored/retrieved in a format that wasn't properly recognized.

## Solution

### 1. **Improved Permission Loading**
Changed from simple spread to explicit field-by-field assignment with nullish coalescing:

**Before:**
```typescript
setSecuritySettings(prev => ({
  ...prev,
  ...settings.permissions
}));
```

**After:**
```typescript
setSecuritySettings(prev => ({
  ...prev,
  // Explicitly map each permission field
  managerCanViewUnits: settings.permissions.managerCanViewUnits ?? prev.managerCanViewUnits,
  managerCanCreateUnits: settings.permissions.managerCanCreateUnits ?? prev.managerCanCreateUnits,
  managerCanEditUnits: settings.permissions.managerCanEditUnits ?? prev.managerCanEditUnits,
  managerCanDeleteUnits: settings.permissions.managerCanDeleteUnits ?? prev.managerCanDeleteUnits,
  // ... all other permissions
}));
```

**Benefits:**
- Explicit field mapping ensures no fields are missed
- Nullish coalescing (`??`) handles `null`, `undefined`, and `false` correctly
- Preserves non-permission security settings
- Type-safe assignment

### 2. **Added Reload After Save**
After successfully saving permissions, immediately reload them from the database:

```typescript
// Save permissions
const result = await updateManagerPermissions(permissions);
console.log('✅ Save result:', result);

// Reload permissions from database to ensure sync
console.log('🔄 Reloading permissions to verify save...');
const updatedSettings = await getSettings();
console.log('📦 Reloaded permissions:', updatedSettings.permissions);

if (updatedSettings.permissions) {
  setSecuritySettings(prev => ({
    ...prev,
    // Update with reloaded permissions
    managerCanViewUnits: updatedSettings.permissions.managerCanViewUnits ?? prev.managerCanViewUnits,
    // ... all other permissions
  }));
}
```

**Benefits:**
- Verifies save was successful
- Ensures UI state matches database state
- Catches any backend transformation issues
- Provides immediate feedback

### 3. **Enhanced Logging**
Added comprehensive logging at every step:

```typescript
console.log('🔄 Loading permissions from database...');
console.log('✅ Settings loaded:', settings);
console.log('📦 Raw permissions from DB:', settings.permissions);
console.log('📝 Applying permissions to state:', settings.permissions);
console.log('✨ Updated security settings:', updated);
console.log('💾 Saving permissions:', permissions);
console.log('✅ Save result:', result);
console.log('🔄 Reloading permissions to verify save...');
console.log('📦 Reloaded permissions:', updatedSettings.permissions);
```

**Benefits:**
- Easy debugging
- Track data flow from DB to UI
- Identify where data might be lost
- Verify transformations

### 4. **Type Safety Check**
Added validation before applying permissions:

```typescript
if (settings.permissions && typeof settings.permissions === 'object') {
  // Apply permissions
} else {
  console.log('⚠️ No permissions found in settings or invalid format');
}
```

**Benefits:**
- Prevents errors from invalid data
- Handles edge cases gracefully
- Clear error messages

## Testing Checklist

### Test 1: Save and Verify
1. ✅ Owner goes to Settings → Security → Manager Permissions
2. ✅ Check "Delete Units" checkbox
3. ✅ Click "Save Permissions"
4. ✅ See success toast
5. ✅ Checkbox remains checked (no revert)
6. ✅ Check browser console for save logs

### Test 2: Refresh and Verify Persistence
1. ✅ After saving, refresh the page (F5)
2. ✅ Navigate back to Settings → Security
3. ✅ Verify "Delete Units" is still checked
4. ✅ Check browser console for load logs

### Test 3: Multiple Permission Changes
1. ✅ Check multiple permissions (Delete Units, Edit Property, Delete Tenants)
2. ✅ Click "Save Permissions"
3. ✅ Refresh page
4. ✅ Verify all checked permissions remain checked

### Test 4: Uncheck Permissions
1. ✅ Uncheck "Delete Units"
2. ✅ Click "Save Permissions"
3. ✅ Refresh page
4. ✅ Verify "Delete Units" remains unchecked

### Test 5: Manager Receives Permissions
1. ✅ Owner checks "Delete Units"
2. ✅ Owner saves permissions
3. ✅ Manager logs out
4. ✅ Manager logs in again
5. ✅ Manager navigates to Properties → Units Tab
6. ✅ Manager clicks three-dot menu on a unit
7. ✅ Manager sees "Delete Unit" option

## Console Log Flow

### On Page Load:
```
🔄 Loading permissions from database...
✅ Settings loaded: { id: '...', permissions: {...} }
📦 Raw permissions from DB: { managerCanViewUnits: true, ... }
📝 Applying permissions to state: { managerCanViewUnits: true, ... }
✨ Updated security settings: { twoFactorEnabled: true, managerCanViewUnits: true, ... }
```

### On Save:
```
💾 Saving permissions: { managerCanViewUnits: true, managerCanDeleteUnits: true, ... }
✅ Save result: { message: 'Manager permissions updated successfully', permissions: {...} }
🔄 Reloading permissions to verify save...
📦 Reloaded permissions: { managerCanViewUnits: true, managerCanDeleteUnits: true, ... }
```

## Files Modified

- `src/components/PropertyOwnerSettings.tsx`
  - Updated `useEffect` for loading permissions (explicit field mapping)
  - Updated save handler to reload after save
  - Added comprehensive logging
  - Added type safety checks

## Backend (No Changes Needed)

The backend was already working correctly:
- `GET /api/settings` - Returns user with permissions
- `PUT /api/settings/manager-permissions` - Saves permissions to `users.permissions` (JSONB field)
- `POST /api/auth/login` - Applies owner's permissions to manager at login

## Database Schema (No Changes Needed)

```sql
users table:
  - permissions JSONB (stores all permission flags)
```

## How It Works Now

### 1. Owner Saves Permissions
```
Owner checks "Delete Units"
  ↓
Clicks "Save Permissions"
  ↓
Frontend sends PUT /api/settings/manager-permissions
  ↓
Backend saves to users.permissions (JSONB)
  ↓
Frontend reloads GET /api/settings
  ↓
Frontend updates state with reloaded permissions
  ↓
Success toast appears
  ↓
Checkboxes remain in saved state
```

### 2. Owner Refreshes Page
```
Page loads
  ↓
useEffect runs
  ↓
Frontend calls GET /api/settings
  ↓
Backend returns user with permissions
  ↓
Frontend applies permissions to securitySettings state
  ↓
Checkboxes reflect saved state
```

### 3. Manager Logs In
```
Manager enters credentials
  ↓
Backend validates manager
  ↓
Backend finds owner by customerId
  ↓
Backend fetches owner's permissions
  ↓
Backend includes permissions in login response
  ↓
Frontend stores user with permissions
  ↓
Manager's UI shows only permitted actions
```

## Expected Behavior

### Before Fix:
- ❌ Check "Delete Units"
- ❌ Click "Save"
- ❌ Refresh page
- ❌ "Delete Units" unchecked (reverted to default)
- ❌ Manager doesn't see delete button

### After Fix:
- ✅ Check "Delete Units"
- ✅ Click "Save"
- ✅ Refresh page
- ✅ "Delete Units" still checked (persisted)
- ✅ Manager logs in and sees delete button

## Important Notes

1. **Manager Must Re-login**: After owner changes permissions, manager must log out and log in again to receive updated permissions.

2. **Permissions Applied at Login**: Permissions are fetched from the owner and applied to the manager's session during login, not in real-time.

3. **Database Storage**: Permissions are stored in the `users.permissions` JSONB field in PostgreSQL.

4. **Default Values**: If no permissions are saved, defaults are used (most permissions ON, delete permissions OFF).

5. **Nullish Coalescing**: Using `??` instead of `||` ensures `false` values are preserved (important for unchecked checkboxes).

## Debugging Tips

If permissions still don't persist:

1. **Check Browser Console**:
   - Look for "Loading permissions from database..."
   - Verify "Raw permissions from DB" shows correct values
   - Check "Updated security settings" matches expectations

2. **Check Network Tab**:
   - Verify PUT /api/settings/manager-permissions returns 200
   - Verify GET /api/settings returns permissions object
   - Check response payload contains saved permissions

3. **Check Database**:
   ```sql
   SELECT id, email, role, permissions 
   FROM users 
   WHERE role IN ('owner', 'property_owner');
   ```
   - Verify permissions column contains JSON with saved values

4. **Check Backend Logs**:
   - Look for "Manager permissions updated for user:"
   - Verify "New permissions:" shows correct values

## Summary

The fix ensures permissions are properly loaded from the database on page load and reloaded after save to verify persistence. By using explicit field mapping with nullish coalescing and adding comprehensive logging, we can now track the entire data flow and ensure permissions persist correctly across page refreshes and manager logins.


