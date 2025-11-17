# View Archived Tickets Feature

## ✅ Feature Implemented

You can now **view and manage archived tickets** in the admin dashboard!

---

## 🎯 Key Features

### 1. **Toggle Between Active and Archived**
- New button in the header: **"Show Archived"** / **"Show Active"**
- Click to switch between viewing active submissions and archived submissions
- Button highlights when viewing archived tickets

### 2. **View Archived Tickets**
- All archived tickets are displayed with the same details as active ones
- See Ticket ID, name, email, subject, status, priority, and date
- Pagination works the same way (5 items per page)

### 3. **Restore Archived Tickets**
- When viewing archived tickets, the **"Restore"** button replaces the **"Archive"** button
- Click "Restore" to unarchive and return the ticket to active submissions
- Restored tickets immediately appear in the active list

### 4. **Visual Indicators**
- **"Show Archived"** button: Outlined when viewing active tickets
- **"Show Active"** button: Solid/filled when viewing archived tickets
- Clear visual feedback about which view you're in

---

## 🎨 UI Changes

### Header Section
```
┌────────────────────────────────────────────────────┐
│ Contact Form Submissions                           │
│ Manage and track contact form submissions         │
│                                                    │
│  [🗄️ Show Archived] [🔄 Refresh] [📥 Export]      │
└────────────────────────────────────────────────────┘
```

**When viewing archived:**
```
│  [🗄️ Show Active] [🔄 Refresh] [📥 Export]        │
```

### Detail Modal Actions
**Active Tickets:**
```
│ [📧 Send Email] [📞 Call]              [🗄️ Archive] │
```

**Archived Tickets:**
```
│ [📧 Send Email] [📞 Call]              [🔄 Restore] │
```

---

## 📋 How to Use

### Viewing Archived Tickets:

1. Go to **Admin Dashboard** → **Landing Page** → **Contact** tab
2. Click the **"Show Archived"** button in the top right
3. The list updates to show only archived submissions
4. Button changes to **"Show Active"** (solid blue)

### Restoring an Archived Ticket:

1. While viewing archived tickets, click the **view icon (👁️)** on any ticket
2. Scroll to the bottom of the modal
3. Click the **"Restore"** button (blue, on the right)
4. Confirm the restoration
5. Ticket returns to active submissions list
6. View switches back to active tickets automatically

### Archiving a Ticket:

1. While viewing active tickets, click the **view icon (👁️)** on any ticket
2. Scroll to the bottom of the modal
3. Click the **"Archive"** button (red, on the right)
4. Confirm the archive action
5. Ticket is archived and removed from active list

---

## 🔧 Technical Details

### Frontend Changes

**New State:**
```typescript
const [showArchived, setShowArchived] = useState(false);
```

**Toggle Button:**
```typescript
<Button 
  variant={showArchived ? "default" : "outline"}
  size="sm" 
  onClick={() => setShowArchived(!showArchived)}
>
  <Archive className="h-4 w-4 mr-2" />
  {showArchived ? 'Show Active' : 'Show Archived'}
</Button>
```

**Conditional Action Button:**
```typescript
{showArchived ? (
  <Button onClick={() => handleUnarchive(id)}>
    <RefreshCw className="h-4 w-4 mr-2" />
    Restore
  </Button>
) : (
  <Button onClick={() => handleArchive(id)}>
    <Archive className="h-4 w-4 mr-2" />
    Archive
  </Button>
)}
```

### Backend Changes

**FilterOptions Interface:**
```typescript
export interface FilterOptions {
  // ... other filters
  showArchived?: boolean;
}
```

**Query Logic:**
```typescript
const where: any = {
  // Show archived or active based on filter
  deletedAt: showArchived ? { not: null } : null,
};
```

**Auto-Unarchive on Update:**
```typescript
// When updating an archived submission, automatically unarchive it
if (existingSubmission?.deletedAt) {
  updateData.deletedAt = null;
}
```

---

## 🧪 Testing Checklist

- [x] ✅ Click "Show Archived" button
- [x] ✅ View archived tickets list
- [x] ✅ Button changes to "Show Active"
- [x] ✅ Click on archived ticket to view details
- [x] ✅ See "Restore" button instead of "Archive"
- [x] ✅ Click "Restore" to unarchive
- [x] ✅ Verify ticket appears in active list
- [x] ✅ Archive a ticket and verify it appears in archived view
- [x] ✅ Pagination works correctly in both views

---

## 📊 Data Flow

### Archive Flow:
```
Active Ticket
    ↓
[Archive Button]
    ↓
Set deletedAt = now()
    ↓
Hidden from active list
    ↓
Visible in archived view
```

### Restore Flow:
```
Archived Ticket
    ↓
[Restore Button]
    ↓
Set deletedAt = null
    ↓
Returns to active list
    ↓
Hidden from archived view
```

---

## 🎯 Benefits

1. **No Data Loss**: Archived tickets are never permanently deleted
2. **Clean Interface**: Active tickets list remains uncluttered
3. **Easy Recovery**: Restore any archived ticket with one click
4. **Audit Trail**: Maintain history of all submissions
5. **Flexible Management**: View active or archived at any time

---

## 🔐 Security & Data Integrity

- **Soft Delete**: Uses `deletedAt` timestamp (data preserved)
- **Automatic Restoration**: Updating archived tickets auto-restores them
- **Confirmation Dialogs**: Prevents accidental archive/restore
- **Audit Ready**: All timestamps preserved for tracking

---

## Status: ✅ Ready for Use

**Both Archive and View Archived features are now live!**

Refresh your browser and navigate to the Contact tab to try it out! 🎉

