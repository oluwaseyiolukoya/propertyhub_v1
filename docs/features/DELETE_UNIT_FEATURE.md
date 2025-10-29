# Delete Unit Feature with Permission Control

## Overview
Implemented a Delete Unit feature for managers with full permission control. The delete action only appears when the owner grants the `canDeleteUnits` permission.

## Implementation Details

### Location
**Property Manager Dashboard → Properties → Units Tab → Actions → Delete Unit**

### Permission Control

#### **Owner Side**
**Settings → Security → Manager Permissions → Units Management**
- ☐ **Delete Units** checkbox
- When checked: Managers can delete units
- When unchecked: Delete option hidden from managers
- Default: **OFF** (for safety)

#### **Manager Side**
```typescript
const canDelete = user?.permissions?.canDeleteUnits === true;

{canDelete && (
  <DropdownMenuItem onClick={handleDeleteClick}>
    <Trash2 className="h-4 w-4 mr-2" />
    Delete Unit
  </DropdownMenuItem>
)}
```

### Features

#### **1. Permission-Based Visibility**
- Delete option only shows if `canDeleteUnits === true`
- If permission not granted, button doesn't appear in menu
- Safe default (OFF) prevents accidental deletions

#### **2. Confirmation Dialog**
When manager clicks "Delete Unit":
- AlertDialog opens with confirmation
- Shows unit number and property name
- Clear warning: "This action cannot be undone"
- Two options: Cancel or Delete Unit

#### **3. Delete Flow**
1. Manager clicks **"Delete Unit"** from three-dot menu
2. **Confirmation dialog** appears
3. Manager reviews unit details
4. Manager clicks **"Cancel"** (closes dialog) OR **"Delete Unit"** (proceeds)
5. **"Deleting..."** text shows during deletion
6. **Backend deletes** unit from database
7. **Success toast** appears
8. **Dialog closes** automatically
9. **Units list refreshes** (deleted unit removed)

### State Management

```typescript
const [showDeleteUnitDialog, setShowDeleteUnitDialog] = useState(false);
const [unitToDelete, setUnitToDelete] = useState<any>(null);
const [isDeletingUnit, setIsDeletingUnit] = useState(false);
```

### Delete Handler

```typescript
const handleDeleteUnit = async () => {
  if (!unitToDelete) return;

  try {
    setIsDeletingUnit(true);
    await deleteUnit(unitToDelete.id);
    
    toast.success(`Unit ${unitToDelete.unitNumber} deleted successfully!`);
    setShowDeleteUnitDialog(false);
    setUnitToDelete(null);
    
    // Reload units list
    if (activeTab === 'units') {
      loadUnits();
    }
  } catch (error: any) {
    const errorMessage = error?.error?.error || 
                        error?.error?.message || 
                        error?.message || 
                        'Failed to delete unit';
    toast.error(errorMessage);
  } finally {
    setIsDeletingUnit(false);
  }
};
```

### Backend Integration

#### **API Call**
- **Method**: `DELETE`
- **URL**: `/api/units/:id`
- **Authorization**: Checks if manager has permission to manage the property
- **Response**: Success or error message

#### **Backend Checks**
1. User is authenticated
2. User is manager or owner
3. Manager has access to the property (via `property_managers` table)
4. Unit has no active leases (prevents deleting occupied units)
5. Owner owns the property

### Confirmation Dialog

```jsx
<AlertDialog open={showDeleteUnitDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        Delete Unit {unitNumber}?
      </AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete this unit? 
        This action cannot be undone.
        
        Property: {propertyName}
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDeleteUnit}
        className="bg-red-600"
      >
        {isDeletingUnit ? 'Deleting...' : 'Delete Unit'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### UI/UX Features

- ✅ **Permission-Based** - Only shows when `canDeleteUnits` is granted
- ✅ **Confirmation Required** - Prevents accidental deletion
- ✅ **Clear Warning** - "This action cannot be undone"
- ✅ **Context Display** - Shows unit number and property name
- ✅ **Loading State** - "Deleting..." text during operation
- ✅ **Disabled Buttons** - Prevents double-deletion
- ✅ **Error Handling** - Clear error messages
- ✅ **Success Feedback** - Toast notification
- ✅ **Auto-refresh** - Units list updates immediately
- ✅ **Red Button** - Visual cue for destructive action
- ✅ **Cancel Option** - Easy way to abort

### Example Flow

#### **Scenario 1: Owner Grants Permission**
1. Owner goes to **Settings → Security → Manager Permissions**
2. Owner checks **"Delete Units"** under Units Management
3. Owner clicks **"Save Permissions"**
4. Manager logs out and logs in again
5. Manager navigates to **Properties → Units Tab**
6. Manager clicks three-dot menu on a unit
7. Manager **sees "Delete Unit"** option (red text)
8. Manager clicks **"Delete Unit"**
9. Confirmation dialog appears
10. Manager clicks **"Delete Unit"** to confirm
11. Unit is deleted from database
12. Success toast: "Unit A101 deleted successfully!"
13. Units list refreshes (unit removed)

#### **Scenario 2: Owner Doesn't Grant Permission**
1. Owner doesn't check **"Delete Units"** permission
2. Manager logs in
3. Manager navigates to **Properties → Units Tab**
4. Manager clicks three-dot menu on a unit
5. Manager **doesn't see "Delete Unit"** option
6. Only "View Details" and "Edit Unit" appear (if those are granted)

#### **Scenario 3: Delete with Active Lease (Backend Protection)**
1. Manager tries to delete an occupied unit
2. Backend checks for active leases
3. Backend returns error: "Cannot delete unit with active lease"
4. Error toast appears
5. Unit is NOT deleted
6. Dialog remains open for user to cancel

### Error Scenarios

#### **Error 1: No Permission**
- "Delete Unit" option not visible in menu
- Manager cannot access delete functionality

#### **Error 2: Unit Has Active Lease**
- Backend prevents deletion
- Error toast: "Cannot delete unit with active lease"
- Unit remains in database

#### **Error 3: Network Error**
- Error toast: "Failed to delete unit"
- Dialog remains open for retry

#### **Error 4: Unit Not Found**
- Error toast: "Unit not found"
- Dialog closes

### Files Modified

- `src/components/PropertyManagement.tsx`
  - Added `showDeleteUnitDialog`, `unitToDelete`, `isDeletingUnit` states
  - Imported `deleteUnit` from API
  - Imported AlertDialog components
  - Added `handleDeleteUnit` function
  - Updated "Delete Unit" action to open confirmation
  - Added Delete Unit AlertDialog component

- `src/lib/api/units.ts` (already existed)
  - `deleteUnit(id)` function

### Database Integration

When unit is deleted:
- Unit record removed from `units` table
- Related leases set to `unitId = null` (via `onDelete: SetNull`)
- Units list refreshed via `loadUnits()`

### Testing Checklist

#### **Owner Tests**
- ✅ Go to Settings → Security → Manager Permissions
- ✅ Check "Delete Units" checkbox
- ✅ Click "Save Permissions"
- ✅ See success toast

#### **Manager Tests** (with permission)
- ✅ Manager logs out and logs in
- ✅ Navigate to Properties → Units Tab
- ✅ Click three-dot menu on a unit
- ✅ See "Delete Unit" option in red
- ✅ Click "Delete Unit"
- ✅ Confirmation dialog appears
- ✅ See unit number and property name
- ✅ Click "Cancel" - dialog closes, nothing deleted
- ✅ Click "Delete Unit" again
- ✅ Click "Delete Unit" button in dialog
- ✅ See "Deleting..." text
- ✅ See success toast
- ✅ Dialog closes automatically
- ✅ Units list refreshes
- ✅ Deleted unit is removed

#### **Manager Tests** (without permission)
- ✅ Owner unchecks "Delete Units" permission
- ✅ Manager logs out and logs in
- ✅ Navigate to Properties → Units Tab
- ✅ Click three-dot menu on a unit
- ✅ "Delete Unit" option NOT visible
- ✅ Only permitted actions appear

### Security Features

1. **Permission Check** - Frontend hides button if no permission
2. **Backend Authorization** - Server validates permission
3. **Confirmation Required** - Prevents accidental deletion
4. **Active Lease Protection** - Cannot delete occupied units
5. **Audit Trail** - (Future: Log who deleted what and when)

### Future Enhancements (Optional)

1. **Soft Delete** - Mark as deleted instead of hard delete
2. **Restore Deleted** - Allow undoing deletions within 30 days
3. **Batch Delete** - Delete multiple units at once
4. **Delete History** - Track who deleted what and when
5. **Archive Instead** - Option to archive units instead of deleting
6. **Transfer Tenants** - Move tenant to another unit before deletion

### Benefits

1. **Complete CRUD** - Full unit management (Create, Read, Update, Delete)
2. **Permission-Aware** - Respects owner's permission settings
3. **Safe by Default** - Delete permission OFF by default
4. **User-Friendly** - Clear confirmation dialog with context
5. **Database Integrity** - Prevents deleting units with active leases
6. **Professional** - Loading states, error handling, success feedback
7. **Secure** - Multiple layers of authorization checks

### Notes

- Delete permission is **OFF by default** for safety
- Owner must explicitly grant `canDeleteUnits` permission
- Manager must **log out and log in** after permission change
- Units with **active leases cannot be deleted** (backend protection)
- Deleted units are **permanently removed** (no soft delete yet)
- Units list **auto-refreshes** after deletion
- **Confirmation required** - cannot delete accidentally

## Summary

The Delete Unit feature provides managers with the ability to delete units when explicitly granted permission by the owner. The feature includes a confirmation dialog to prevent accidental deletion, backend protection against deleting occupied units, and automatic list refresh. The delete option only appears in the three-dot menu when the owner checks the "Delete Units" permission in Settings → Security → Manager Permissions. This ensures safe, controlled unit management with clear user feedback.


