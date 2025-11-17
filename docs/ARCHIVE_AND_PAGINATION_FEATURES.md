# Archive and Pagination Features

## Features Implemented

### 1. Archive Functionality ✅

**What it does:**
- Allows admins to archive contact form submissions after they've been treated
- Uses soft delete (sets `deletedAt` timestamp) - data is not permanently deleted
- Archived submissions are automatically hidden from the list
- Can be accessed later if needed (data still in database)

**How to use:**
1. Click on a submission to view details
2. Scroll to the bottom of the modal
3. Click the red **"Archive"** button
4. Confirm the action
5. Submission will be archived and removed from the list

**Implementation details:**
- Frontend: Added Archive button in Quick Actions section of detail modal
- Backend: Already implemented soft delete by setting `deletedAt` timestamp
- Database: `deletedAt` field in `landing_page_submissions` table
- Query: `getSubmissions()` automatically filters out archived items (`deletedAt: null`)

---

### 2. Pagination (5 items per page) ✅

**What changed:**
- **Before**: 20 submissions per page
- **After**: 5 submissions per page

**Benefits:**
- Easier to scan through submissions
- Faster page load
- Better mobile experience
- More focused view

**Implementation:**
- Changed default `limit` from 20 to 5 in filters state
- Pagination controls automatically adjust to show correct number of pages
- Shows "Showing 1 to 5 of X submissions" at bottom

---

## UI Changes

### Submissions Table
- Now shows only 5 items at a time
- Next/Previous buttons for navigation
- Page indicator shows current page

### Detail Modal
- New **Archive** button in Quick Actions section
- Red/destructive variant to indicate it's a significant action
- Positioned at the far right (using `ml-auto`)
- Shows confirmation dialog before archiving

---

## Technical Details

### Frontend (`FormSubmissions.tsx`)
```typescript
// Pagination limit changed to 5
const [filters, setFilters] = useState({
  status: 'all',
  priority: 'all',
  search: '',
  page: 1,
  limit: 5, // Changed from 20
});

// Archive handler
const handleArchive = async (id: string) => {
  if (!confirm('Are you sure you want to archive this submission?')) {
    return;
  }
  await deleteSubmission(id);
  toast.success('Submission archived successfully');
  setShowDetailModal(false);
  loadSubmissions();
};
```

### Backend (`landing-forms.service.ts`)
```typescript
// Soft delete implementation
async deleteSubmission(id: string): Promise<void> {
  await prisma.landing_page_submissions.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

// Query filters out archived submissions
const where: any = {
  deletedAt: null, // Exclude soft-deleted
};
```

---

## Testing

### Test Archive Feature:
1. Open Admin Dashboard → Landing Page → Contact tab
2. Click view icon (👁️) on any submission
3. Click the **Archive** button at the bottom right
4. Confirm the action
5. Verify submission disappears from the list

### Test Pagination:
1. Open Contact tab
2. Verify only 5 submissions show per page
3. Click **Next** to go to page 2
4. Click **Previous** to go back
5. Verify page counter updates correctly

---

## Recovery

Archived submissions are not permanently deleted. To recover:
1. Database query: `SELECT * FROM landing_page_submissions WHERE deletedAt IS NOT NULL`
2. To restore: `UPDATE landing_page_submissions SET deletedAt = NULL WHERE id = 'submission_id'`

---

## Status: ✅ Ready for Testing

