# Manager Permissions Control Feature

## Overview
This feature allows Property Owners to control what permissions Property Managers have, including the ability to create units on behalf of the owner.

## Implementation Summary

### 1. Owner Dashboard - Security Settings (Manager Permissions)

**Location:** `src/components/PropertyOwnerSettings.tsx`

#### Added Manager Permissions Section
- **Allow Unit Creation**: Toggle to enable/disable managers creating units
- **Allow Property Editing**: Toggle to enable/disable property editing
- **Allow Tenant Management**: Toggle to enable/disable tenant management
- **Allow Financial Access**: Toggle to enable/disable financial reports access

#### Default Permission Settings
```typescript
managerCanCreateUnits: true,      // Enabled by default
managerCanEditProperty: false,    // Disabled by default
managerCanManageTenants: true,    // Enabled by default
managerCanViewFinancials: true    // Enabled by default
```

#### Features
- Clean card-based UI with toggle switches
- Clear descriptions for each permission
- Info note explaining that these are default permissions that can be overridden per manager
- Located in Security page of Owner Settings

---

### 2. Manager Dashboard - Unit Creation

**Location:** `src/components/PropertyManagement.tsx`

#### Add Unit Button
- Appears in the Units Tab header for managers
- Only visible when `user.permissions.canCreateUnits !== false`
- Opens a comprehensive Add Unit Dialog

#### Add Unit Dialog Features
- **Property Selection**: Dropdown to select from managed properties
- **Required Fields**:
  - Property *
  - Unit Number *
  - Type *
  - Bedrooms *
  - Bathrooms *
  - Monthly Rent *
- **Optional Fields**:
  - Floor
  - Size (sq ft)
  - Status (Vacant/Occupied/Maintenance)
  - Security Deposit

#### Validation
- Checks all required fields before submission
- Shows error toast if required fields are missing
- Displays loading state during unit creation
- Shows success message on completion
- Automatically refreshes unit list after creation

#### Backend Integration
- Uses `createUnit` API from `src/lib/api/units.ts`
- Properly formats numeric values (bedrooms, bathrooms, rent, etc.)
- Handles errors gracefully with user-friendly messages

---

## Permission Flow

### For Property Owners
1. Navigate to **Dashboard → Settings → Security**
2. Scroll to **Manager Permissions** section
3. Toggle desired permissions on/off
4. Changes apply as default for all new manager assignments
5. Can override per-manager in **Property Manager Management** page

### For Property Managers
1. If granted `canCreateUnits` permission:
   - See "Add Unit" button in Properties → Units Tab
   - Can create units for any property they manage
   - Created units are immediately available to the owner
2. If permission is revoked:
   - "Add Unit" button is hidden
   - Cannot create new units (view-only access)

---

## Technical Details

### State Management
```typescript
// Unit Form State
const [unitForm, setUnitForm] = useState({
  propertyId: '',
  unitNumber: '',
  type: '',
  floor: '',
  bedrooms: '',
  bathrooms: '',
  size: '',
  monthlyRent: '',
  securityDeposit: '',
  status: 'vacant'
});
const [savingUnit, setSavingUnit] = useState(false);
```

### Permission Check
```typescript
{isManagerView && user?.permissions?.canCreateUnits !== false && (
  <Button onClick={() => setShowAddUnit(true)}>
    <Plus className="h-4 w-4 mr-2" />
    Add Unit
  </Button>
)}
```

### Unit Creation Handler
```typescript
const handleCreateUnit = async () => {
  // Validation
  if (!unitForm.propertyId || !unitForm.unitNumber || !unitForm.type || 
      !unitForm.bedrooms || !unitForm.bathrooms || !unitForm.monthlyRent) {
    toast.error('Please fill in all required fields');
    return;
  }

  try {
    setSavingUnit(true);
    
    const unitData = {
      propertyId: unitForm.propertyId,
      unitNumber: unitForm.unitNumber,
      type: unitForm.type,
      floor: unitForm.floor ? parseInt(unitForm.floor) : undefined,
      bedrooms: parseInt(unitForm.bedrooms),
      bathrooms: parseFloat(unitForm.bathrooms),
      size: unitForm.size ? parseFloat(unitForm.size) : undefined,
      monthlyRent: parseFloat(unitForm.monthlyRent),
      securityDeposit: unitForm.securityDeposit ? parseFloat(unitForm.securityDeposit) : undefined,
      status: unitForm.status
    };

    await createUnit(unitData);
    
    toast.success('Unit created successfully!');
    setShowAddUnit(false);
    
    // Reset form and reload units
    setUnitForm({ /* reset to defaults */ });
    if (activeTab === 'units') {
      loadUnits();
    }
  } catch (error: any) {
    toast.error(error?.message || 'Failed to create unit');
  } finally {
    setSavingUnit(false);
  }
};
```

---

## UI Components Used

### Owner Settings
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Switch` (for permission toggles)
- Info banner with blue background for notes

### Manager Dashboard
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
- `Button` (Add Unit, Cancel, Create)
- `Label`, `Input`, `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- Toast notifications (success/error)

---

## Benefits

### For Property Owners
- **Granular Control**: Decide exactly what managers can do
- **Security**: Prevent unauthorized actions by limiting permissions
- **Flexibility**: Enable/disable permissions as trust grows
- **Scalability**: Set default permissions for all managers at once

### For Property Managers
- **Efficiency**: Create units directly without waiting for owner
- **Autonomy**: Manage properties more independently when trusted
- **Clear Boundaries**: Know exactly what actions are permitted
- **Better UX**: Seamless workflow when permissions are granted

---

## Future Enhancements

### Potential Additions
1. **Per-Manager Overrides**: Individual permission settings per manager
2. **Permission History**: Track when permissions were changed
3. **Approval Workflows**: Require owner approval for certain actions
4. **Bulk Unit Creation**: Create multiple units at once
5. **Unit Templates**: Save common unit configurations
6. **Audit Logs**: Track who created which units and when
7. **Notification System**: Alert owners when managers create units

---

## Testing Checklist

### Owner Side
- [ ] Can access Security → Manager Permissions
- [ ] Can toggle each permission on/off
- [ ] Toggles save correctly
- [ ] Info banner displays correctly

### Manager Side
- [ ] "Add Unit" button appears when permission is granted
- [ ] "Add Unit" button is hidden when permission is revoked
- [ ] Dialog opens when clicking "Add Unit"
- [ ] All form fields work correctly
- [ ] Required field validation works
- [ ] Unit creation succeeds with valid data
- [ ] Error handling works with invalid data
- [ ] Unit list refreshes after creation
- [ ] Form resets after successful creation

---

## Files Modified

1. **src/components/PropertyOwnerSettings.tsx**
   - Added Manager Permissions section to SecuritySection
   - Added default permission state values
   - Added Switch components for each permission

2. **src/components/PropertyManagement.tsx**
   - Added "Add Unit" button to Units Tab (with permission check)
   - Added Add Unit Dialog with complete form
   - Added `unitForm` state and `handleCreateUnit` handler
   - Added `savingUnit` loading state
   - Imported `createUnit` from units API

---

## API Integration

The feature integrates with the following backend endpoints:

- **POST /api/units**: Create a new unit
  - Requires: `propertyId`, `unitNumber`, `type`, `bedrooms`, `bathrooms`, `monthlyRent`
  - Optional: `floor`, `size`, `securityDeposit`, `status`
  - Returns: Created unit object

---

## Notes

- The permission system is designed to be extensible for future permission types
- Default permissions apply to all managers unless overridden individually
- The UI is consistent with existing patterns in the application
- All user actions provide immediate feedback via toast notifications
- Form validation ensures data integrity before submission


