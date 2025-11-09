# Onboarding Applications - Delete Feature & Compact UI

## Summary
Updated the Onboarding page in the Admin Dashboard to display applications in a more compact single-row format and added a delete action icon for each application.

## Changes Made

### 1. Backend API (`backend/src/routes/admin-onboarding.ts`)
Added a new DELETE endpoint:

```typescript
/**
 * DELETE /api/admin/onboarding/applications/:id
 * Delete an application
 */
router.delete('/applications/:id', async (req: Request, res: Response) => {
  // Calls onboardingService.deleteApplication(id)
});
```

### 2. Backend Service (`backend/src/services/onboarding.service.ts`)
Added `deleteApplication` method with safety checks:

```typescript
async deleteApplication(id: string): Promise<{ success: boolean }> {
  // Prevents deletion of activated applications with associated accounts
  if (application.status === 'activated' && (application.customerId || application.userId)) {
    throw new Error('Cannot delete activated applications with associated accounts');
  }
  
  await prisma.onboarding_applications.delete({ where: { id } });
  return { success: true };
}
```

**Safety Features:**
- ✅ Checks if application exists
- ✅ Prevents deletion of activated applications that have customer/user accounts
- ✅ Allows deletion of pending, rejected, or approved (but not activated) applications

### 3. Frontend API (`src/lib/api/admin-onboarding.ts`)
Added delete function:

```typescript
export async function deleteOnboardingApplication(id: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/api/admin/onboarding/applications/${id}`);
  // Returns success or throws error
}
```

### 4. Frontend UI (`src/components/admin/OnboardingDashboard.tsx`)

#### Compact Single-Row Layout
**Before:**
- Large cards with multiple lines
- Icon in a big circle
- Lots of vertical spacing
- Submitted date on separate line

**After:**
- Compact single-row display
- Smaller icon circle
- All info on one line (name, email, company, type, date)
- Reduced padding and spacing
- Better use of screen space

#### Delete Icon
- **Trash icon** appears on hover (right side of each row)
- Red color to indicate destructive action
- Confirmation dialog before deletion
- Prevents accidental clicks by using `e.stopPropagation()`
- Success/error toast notifications

#### UI Improvements
- `group` class for hover effects
- `opacity-0 group-hover:opacity-100` for smooth delete icon reveal
- `truncate` classes for long text
- `whitespace-nowrap` for dates and types
- Smaller "View" button to save space

## User Flow

### Viewing Applications
1. Admin goes to **Admin Dashboard → Onboarding** tab
2. Applications displayed in compact single rows
3. Each row shows:
   - Icon (property owner/manager/tenant)
   - Name
   - Status badge
   - Email
   - Company (if provided)
   - Application type
   - Submission date

### Deleting an Application
1. Hover over an application row
2. **Trash icon** appears on the right
3. Click the trash icon
4. Confirmation dialog: "Are you sure you want to delete the application from [Name]? This action cannot be undone."
5. Click OK → Application deleted, list refreshes
6. Click Cancel → No action taken

### Safety Restrictions
**Can Delete:**
- ✅ Pending applications
- ✅ Under review applications
- ✅ Info requested applications
- ✅ Approved (but not activated) applications
- ✅ Rejected applications

**Cannot Delete:**
- ❌ Activated applications with customer accounts
- ❌ Activated applications with user accounts

**Error Message:** "Cannot delete activated applications with associated accounts"

## Files Modified

1. **Backend:**
   - `/backend/src/routes/admin-onboarding.ts` - Added DELETE endpoint
   - `/backend/src/services/onboarding.service.ts` - Added deleteApplication method

2. **Frontend:**
   - `/src/lib/api/admin-onboarding.ts` - Added deleteOnboardingApplication function
   - `/src/components/admin/OnboardingDashboard.tsx` - Updated UI and added delete handler

## Testing Checklist

- [ ] Applications display in compact single-row format
- [ ] All information is visible and properly truncated
- [ ] Hover over a row shows the delete icon
- [ ] Click delete icon shows confirmation dialog
- [ ] Confirm deletion removes the application and refreshes list
- [ ] Cancel deletion keeps the application
- [ ] Success toast appears after deletion
- [ ] Error toast appears if deletion fails
- [ ] Cannot delete activated applications (shows error message)
- [ ] Can delete pending/rejected/approved applications
- [ ] View button still works correctly
- [ ] Clicking delete icon doesn't trigger view action

## Benefits

1. **Space Efficiency**: More applications visible on screen
2. **Better Scanning**: Easier to scan through applications quickly
3. **Clean Interface**: Less visual clutter
4. **Quick Actions**: Delete icon appears on hover for easy access
5. **Safety**: Confirmation dialog prevents accidental deletions
6. **Data Integrity**: Cannot delete applications with associated accounts

## Future Enhancements

Potential additions:
- [ ] Bulk delete (select multiple applications)
- [ ] Soft delete (mark as deleted instead of permanent deletion)
- [ ] Delete with reason (audit trail)
- [ ] Restore deleted applications
- [ ] Filter to show/hide deleted applications
- [ ] Export deleted applications log

