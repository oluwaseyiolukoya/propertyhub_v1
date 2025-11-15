# Project Actions Menu Implementation

## Overview
Added a three-dot menu with View, Edit, and Delete actions to the All Projects table in the portfolio page.

## Changes Made

### Frontend Changes

#### 1. PortfolioOverview Component (`src/modules/developer-dashboard/components/PortfolioOverview.tsx`)

**Added Imports:**
- `MoreVertical`, `Edit`, `Trash2` icons from `lucide-react`
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` from UI components

**Updated Interface:**
```typescript
interface PortfolioOverviewProps {
  onViewProject: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onCreateProject: () => void;
}
```

**Updated Table:**
- Changed last `<TableHead>` from empty to "Actions" with center alignment
- Replaced the "View" button with a three-dot menu dropdown containing:
  - **View**: Opens the project dashboard
  - **Edit**: Opens the edit project page (conditional)
  - **Delete**: Deletes the project with confirmation (conditional, shown in red)

#### 2. AllProjectsPage Component (`src/modules/developer-dashboard/components/AllProjectsPage.tsx`)

**Added Same Changes as PortfolioOverview:**
- Same imports for icons and dropdown menu
- Same interface updates
- Same three-dot menu implementation in the table

#### 3. DeveloperDashboardRefactored Component (`src/modules/developer-dashboard/components/DeveloperDashboardRefactored.tsx`)

**Added Delete Handler:**
```typescript
const handleDeleteProject = async (projectId: string) => {
  if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/developer-dashboard/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }

    toast.success('Project deleted successfully');
    
    // If we're viewing the deleted project, go back to portfolio
    if (selectedProjectId === projectId) {
      setCurrentPage('portfolio');
      setSelectedProjectId(null);
    }
    
    // Refresh the projects list
    window.location.reload();
  } catch (error) {
    console.error('Error deleting project:', error);
    toast.error('Failed to delete project');
  }
};
```

**Updated PortfolioOverview Calls:**
- Added `onEditProject` handler that sets the selected project and navigates to edit page
- Added `onDeleteProject` handler that calls `handleDeleteProject`

### Backend Changes

#### 4. Developer Dashboard Routes (`backend/src/routes/developer-dashboard.ts`)

**Added DELETE Endpoint:**
```typescript
router.delete('/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify ownership
    const existing = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        developerId: userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete budget line items
      await tx.budget_line_items.deleteMany({
        where: { projectId },
      });

      // Delete expenses
      await tx.project_expenses.deleteMany({
        where: { projectId },
      });

      // Delete funding
      await tx.project_funding.deleteMany({
        where: { projectId },
      });

      // Delete cash flow snapshots
      await tx.project_cash_flow_snapshots.deleteMany({
        where: { projectId },
      });

      // Delete the project itself
      await tx.developer_projects.delete({
        where: { id: projectId },
      });
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});
```

## Features

### Three-Dot Menu Actions

1. **View**
   - Icon: Eye
   - Action: Opens the project dashboard
   - Available: Always

2. **Edit**
   - Icon: Edit (pencil)
   - Action: Opens the edit project page
   - Available: When `onEditProject` handler is provided
   - Sets the selected project and navigates to the edit page

3. **Delete**
   - Icon: Trash2
   - Action: Deletes the project after confirmation
   - Available: When `onDeleteProject` handler is provided
   - Styling: Red text to indicate destructive action
   - Confirmation: Browser confirm dialog before deletion
   - Cascading Delete: Removes all related records (budget items, expenses, funding, cash flow snapshots)

## User Experience

### Delete Flow
1. User clicks the three-dot menu
2. User clicks "Delete" (shown in red)
3. Browser confirmation dialog appears: "Are you sure you want to delete this project? This action cannot be undone."
4. If confirmed:
   - Backend deletes all related records in a transaction
   - Success toast notification appears
   - If viewing the deleted project, user is redirected to portfolio
   - Page reloads to refresh the project list
5. If cancelled:
   - No action taken

### Menu Behavior
- Clicking the three-dot icon stops event propagation (doesn't trigger row click)
- Menu aligns to the right edge
- Each menu item stops event propagation when clicked
- Menu automatically closes after selection

## Security

- **Ownership Verification**: Backend verifies that the user owns the project before deletion
- **Transaction Safety**: All deletions happen in a database transaction to ensure data consistency
- **Confirmation**: User must confirm deletion before it proceeds

## Files Modified

### Frontend
1. `src/modules/developer-dashboard/components/PortfolioOverview.tsx`
2. `src/modules/developer-dashboard/components/AllProjectsPage.tsx`
3. `src/modules/developer-dashboard/components/DeveloperDashboardRefactored.tsx`

### Backend
1. `backend/src/routes/developer-dashboard.ts`

## Testing Checklist

- [ ] Three-dot menu appears in the Actions column
- [ ] View action opens the project dashboard
- [ ] Edit action opens the edit project page with correct project data
- [ ] Delete action shows confirmation dialog
- [ ] Canceling delete does nothing
- [ ] Confirming delete removes the project and all related data
- [ ] Success/error toasts appear appropriately
- [ ] Page redirects to portfolio if viewing deleted project
- [ ] Non-owners cannot delete projects (backend verification)

## Next Steps

Consider adding:
1. A more elegant confirmation modal instead of browser confirm
2. Soft delete functionality (mark as deleted instead of permanent deletion)
3. Undo functionality for accidental deletions
4. Bulk actions (select multiple projects to delete)
5. Archive functionality as an alternative to deletion

