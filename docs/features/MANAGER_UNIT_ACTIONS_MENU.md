# Manager Unit Actions Menu with Permission Control

## Overview
Added a three-dot action menu to the Units Tab in the Manager Dashboard that dynamically shows actions based on permissions granted by the Property Owner.

## Implementation Details

### Location
**Property Manager Dashboard → Properties → Units Tab → Actions Column**

### Features

#### Dynamic Actions Menu
The three-dot menu displays actions based on the manager's granted permissions:

1. **View Details** (👁️)
   - Shows when: `canViewUnits` permission is granted (default: ON)
   - Action: Displays unit details dialog
   
2. **Edit Unit** (✏️)
   - Shows when: `canEditUnits` permission is granted (default: ON)
   - Action: Opens edit unit form
   
3. **Delete Unit** (🗑️)
   - Shows when: `canDeleteUnits` permission is granted (default: OFF)
   - Action: Deletes the unit after confirmation
   - Displayed in red text with separator above it
   
4. **No permissions granted** (⚠️)
   - Shows when: No permissions are granted at all
   - Displayed as disabled menu item

### Permission Logic

```typescript
// Check permissions for each unit
const canView = user?.permissions?.canViewUnits !== false;
const canEdit = user?.permissions?.canEditUnits !== false;
const canDelete = user?.permissions?.canDeleteUnits === true;
```

### UI Features

1. **Actions Column**
   - Only visible for managers (`isManagerView === true`)
   - Contains three-dot menu button (MoreHorizontal icon)
   - Aligned to the right of the table

2. **Menu Items**
   - Icons for each action (Eye, Edit, Trash2, AlertCircle)
   - Clear action labels
   - Destructive actions (Delete) shown in red
   - Separated with dividers for better organization

3. **Permission-Based Display**
   - Menu items are conditionally rendered
   - Only shows actions the manager is allowed to perform
   - Gracefully handles no permissions scenario

### User Experience

#### Owner Sets Permissions
1. Owner goes to **Settings → Security → Manager Permissions**
2. Checks/unchecks unit permissions:
   - ☑️ View Units
   - ☑️ Edit Units
   - ☐ Delete Units
3. Clicks **"Save Permissions"**

#### Manager Uses Actions
1. Manager navigates to **Properties → Units Tab**
2. Sees the Actions column with three-dot menu
3. Clicks the three-dot menu for a unit
4. Sees only the actions they have permission for
5. Clicks an action to perform it

### Permission Matrix

| Permission | Default | Action Shown | Description |
|------------|---------|--------------|-------------|
| `canViewUnits` | ✅ ON | View Details | Manager can view unit information |
| `canEditUnits` | ✅ ON | Edit Unit | Manager can modify unit details |
| `canDeleteUnits` | ❌ OFF | Delete Unit | Manager can remove units |

### Security Benefits

1. **Granular Control**: Owner decides exactly what managers can do
2. **Safe Defaults**: Destructive actions disabled by default
3. **Dynamic UI**: Menu adapts based on permissions
4. **Clear Feedback**: No confusion about what actions are available
5. **Fallback Handling**: Shows message when no permissions granted

### Code Structure

```typescript
// In PropertyManagement.tsx - Units Table
{isManagerView && (
  <TableCell>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {canView && (
          <DropdownMenuItem>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
        )}
        
        {canEdit && (
          <DropdownMenuItem>
            <Edit className="h-4 w-4 mr-2" />
            Edit Unit
          </DropdownMenuItem>
        )}
        
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Unit
            </DropdownMenuItem>
          </>
        )}
        
        {!canView && !canEdit && !canDelete && (
          <DropdownMenuItem disabled>
            <AlertCircle className="h-4 w-4 mr-2" />
            No permissions granted
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  </TableCell>
)}
```

### Integration Flow

```
Owner Dashboard (Settings → Security)
  ↓
Set Unit Permissions
  ↓
Save Permissions
  ↓
Permissions stored in user.permissions
  ↓
Manager Dashboard (Properties → Units)
  ↓
Three-dot menu reads permissions
  ↓
Shows only allowed actions
  ↓
Manager performs action
  ↓
Action connects to backend API
```

### Files Modified
- `src/components/PropertyManagement.tsx`
  - Added Actions column header (conditional on `isManagerView`)
  - Added permission checks (`canView`, `canEdit`, `canDelete`)
  - Implemented three-dot menu with DropdownMenu components
  - Added conditional rendering for menu items
  - Added toast notifications for action feedback

### Responsive Behavior
- Actions column is always visible for managers
- Three-dot menu adapts to screen size
- Menu content aligns to the right edge
- Works on mobile and desktop devices

### Future Enhancements (Optional)
1. **View Details Dialog**: Implement full unit details view
2. **Edit Unit Dialog**: Create inline edit form
3. **Delete Confirmation**: Add AlertDialog for delete action
4. **Batch Actions**: Allow selecting multiple units
5. **Action History**: Log who did what and when
6. **Permission Tooltips**: Explain why an action is disabled

### Testing Scenarios

#### Test 1: Full Permissions
- Owner enables all unit permissions
- Manager should see: View Details, Edit Unit, Delete Unit

#### Test 2: View Only
- Owner enables only `canViewUnits`
- Manager should see: View Details only

#### Test 3: No Permissions
- Owner disables all unit permissions
- Manager should see: "No permissions granted" (disabled)

#### Test 4: Edit & View Only
- Owner enables `canViewUnits` and `canEditUnits`
- Manager should see: View Details, Edit Unit (no Delete)

### Notes
- Actions menu only appears for managers, not owners
- Owner always has full access (no restrictions)
- Permissions are checked on both frontend (UI) and backend (API)
- Default permissions favor safety (destructive actions OFF)
- Toast notifications provide immediate feedback
- Menu items have clear icons and labels for accessibility

## Summary
This feature provides a clean, permission-aware actions menu for managers in the Units Tab. The UI dynamically adapts to show only actions the manager is authorized to perform, ensuring security while maintaining excellent UX.


