# Edit Unit Feature Implementation

## Overview
Implemented a full Edit Unit feature that allows managers (with permission) to edit unit information and save changes to the database.

## Implementation Details

### Location
**Property Manager Dashboard → Properties → Units Tab → Actions → Edit Unit**

### Features

#### **Edit Unit Dialog**
A comprehensive edit form dialog with all unit fields:

1. **Property** (disabled - cannot change)
2. **Unit Number** *
3. **Type** * (e.g., 2-bedroom)
4. **Floor**
5. **Bedrooms** *
6. **Bathrooms** *
7. **Size** (sq ft)
8. **Status** (Vacant/Occupied/Maintenance)
9. **Monthly Rent** *
10. **Security Deposit**

*\* = Required fields*

### Permission-Based Access

The "Edit Unit" action is controlled by the `canEditUnits` permission:

```typescript
const canEdit = user?.permissions?.canEditUnits !== false;

{canEdit && (
  <DropdownMenuItem onClick={handleEditClick}>
    <Edit className="h-4 w-4 mr-2" />
    Edit Unit
  </DropdownMenuItem>
)}
```

### State Management

Added new state variables:
```typescript
const [showEditUnit, setShowEditUnit] = useState(false);
const [editUnitForm, setEditUnitForm] = useState<any>({});
const [savingEditUnit, setSavingEditUnit] = useState(false);
```

### Flow

#### 1. **User Clicks "Edit Unit"**
```typescript
<DropdownMenuItem onClick={() => {
  setSelectedUnit({ ...unit, property, unitNumber });
  setEditUnitForm({
    propertyId: property.id.toString(),
    unitNumber: unit.unitNumber || unit.id,
    type: unit.type || '',
    floor: unit.floor?.toString() || '',
    bedrooms: unit.bedrooms?.toString() || '',
    bathrooms: unit.bathrooms?.toString() || '',
    size: unit.size?.toString() || '',
    monthlyRent: unit.monthlyRent?.toString() || '',
    securityDeposit: unit.securityDeposit?.toString() || '',
    status: unit.status || 'vacant'
  });
  setShowEditUnit(true);
}}>
```

#### 2. **Dialog Opens with Pre-filled Data**
- All fields populated with current unit data
- Property field is disabled (cannot change unit's property)
- User can modify any other field

#### 3. **User Makes Changes**
- Input fields update `editUnitForm` state
- Real-time validation (required fields)
- Status dropdown for easy selection

#### 4. **User Clicks "Update Unit"**
- Validation runs (all required fields must be filled)
- Data sent to backend via `updateUnit(unitId, data)`
- Loading state: "Updating..." button text
- Success: Toast notification + dialog closes + units list refreshes
- Error: Toast notification with error message

### Backend Integration

#### **API Call**
```typescript
await updateUnit(selectedUnit.id, {
  propertyId: editUnitForm.propertyId,
  unitNumber: editUnitForm.unitNumber,
  type: editUnitForm.type,
  floor: editUnitForm.floor ? parseInt(editUnitForm.floor) : null,
  bedrooms: parseInt(editUnitForm.bedrooms),
  bathrooms: parseFloat(editUnitForm.bathrooms),
  size: editUnitForm.size ? parseFloat(editUnitForm.size) : null,
  monthlyRent: parseFloat(editUnitForm.monthlyRent),
  securityDeposit: editUnitForm.securityDeposit ? parseFloat(editUnitForm.securityDeposit) : null,
  status: editUnitForm.status
});
```

#### **Endpoint**
- **Method**: `PUT`
- **URL**: `/api/units/:id`
- **Body**: Updated unit data
- **Response**: Updated unit object

### Validation

#### **Frontend Validation**
```typescript
if (!editUnitForm.unitNumber || !editUnitForm.type || 
    !editUnitForm.bedrooms || !editUnitForm.bathrooms || !editUnitForm.monthlyRent) {
  toast.error('Please fill in all required fields');
  return;
}
```

#### **Backend Validation**
- Unit ID must exist
- Unit must belong to a property the manager has access to
- Required fields validation
- Data type validation

### Data Refresh

After successful update:
1. Close dialog
2. Clear selected unit
3. Reload units list (`loadUnits()`)
4. Show success toast

### UI/UX Features

- ✅ **Pre-filled Form** - Current values loaded automatically
- ✅ **Disabled Property Field** - Cannot change unit's parent property
- ✅ **Validation** - Required fields marked with *
- ✅ **Loading State** - "Updating..." text during save
- ✅ **Disabled Buttons** - Prevent double-submission
- ✅ **Error Handling** - Clear error messages
- ✅ **Auto-refresh** - Units list updates after save
- ✅ **Success Feedback** - Toast notification on success
- ✅ **Cancel Option** - Can close without saving

### Example Edit Flow

**Before:**
- Unit A101
- Type: 2-bedroom
- Floor: 1
- Bedrooms: 2
- Bathrooms: 1
- Size: 800 sq ft
- Monthly Rent: $1,000
- Status: Vacant

**User edits:**
- Changes Monthly Rent to $1,200
- Changes Floor to 2
- Changes Status to Occupied

**After Save:**
- Database updated
- Units list refreshed
- New values displayed immediately
- Success toast: "Unit updated successfully!"

### Error Scenarios

#### **Scenario 1: Missing Required Fields**
- User leaves Unit Number blank
- Clicks "Update Unit"
- Error toast: "Please fill in all required fields"
- Dialog remains open for correction

#### **Scenario 2: Invalid Data**
- User enters "abc" for Monthly Rent
- Clicks "Update Unit"
- Frontend converts to NaN
- Backend validation fails
- Error toast: "Invalid data"

#### **Scenario 3: No Permission**
- Manager doesn't have `canEditUnits` permission
- "Edit Unit" button not visible in menu
- Cannot access edit dialog

#### **Scenario 4: Backend Error**
- Network error
- Database error
- Error toast: "Failed to update unit"
- Dialog remains open for retry

### Files Modified

- `src/components/PropertyManagement.tsx`
  - Added `showEditUnit`, `editUnitForm`, `savingEditUnit` states
  - Imported `updateUnit` from API
  - Added `handleUpdateUnit` function
  - Updated "Edit Unit" action to populate form and open dialog
  - Added Edit Unit Dialog component

- `src/lib/api/units.ts` (already existed)
  - `updateUnit(id, data)` function

### Testing Checklist

- ✅ Click "Edit Unit" from action menu
- ✅ Dialog opens with pre-filled data
- ✅ Property field is disabled
- ✅ All other fields are editable
- ✅ Change some values
- ✅ Click "Update Unit"
- ✅ See "Updating..." text
- ✅ Success toast appears
- ✅ Dialog closes automatically
- ✅ Units list refreshes with new data
- ⏳ Verify changes persisted in database
- ⏳ Try leaving required fields blank
- ⏳ Verify validation error shows
- ⏳ Test cancel button
- ⏳ Test without `canEditUnits` permission

### Database Schema

The `units` table stores:
```sql
id, propertyId, unitNumber, type, floor, bedrooms, bathrooms, 
size, monthlyRent, securityDeposit, status, createdAt, updatedAt
```

### Backend Authorization

The backend checks:
1. User is authenticated
2. User is a manager or owner
3. Manager has access to the property (via `property_managers` table)
4. Owner owns the property (via `properties.ownerId`)

### Future Enhancements (Optional)

1. **Inline Editing** - Edit directly in table row
2. **Batch Edit** - Edit multiple units at once
3. **Edit History** - Track who changed what and when
4. **Conflict Detection** - Warn if unit was edited by someone else
5. **Image Upload** - Add/edit unit photos
6. **Features List** - Edit unit amenities/features
7. **Auto-save Draft** - Save changes as draft before final submit

### Benefits

1. **Full CRUD** - Complete unit management (Create, Read, Update, Delete)
2. **Permission-Aware** - Respects manager permissions
3. **Database Integration** - Changes persist to PostgreSQL
4. **User-Friendly** - Pre-filled form, clear validation
5. **Professional** - Loading states, error handling, success feedback
6. **Secure** - Backend authorization checks
7. **Responsive** - Works on mobile and desktop

### Notes

- Property field is intentionally disabled to prevent moving units between properties
- To change a unit's property, use the backend directly or implement a separate "Move Unit" feature
- Manager must have `canEditUnits` permission (set by owner in Settings → Security)
- Changes are immediate after successful save
- Unit ID is never changed (primary key)

## Summary

The Edit Unit feature provides managers with a professional, user-friendly way to update unit information. When managers click "Edit Unit" from the action menu, they see a dialog with all unit fields pre-filled. They can modify values, click "Update Unit", and the changes are saved to the database. The units list refreshes automatically to show the updates. This feature respects permission controls and includes proper validation, error handling, and user feedback.


