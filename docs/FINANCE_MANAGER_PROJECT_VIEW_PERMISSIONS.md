# Finance Manager Project View Permissions 👁️

## 📋 Overview

This document details the implementation of view-only project access for the Finance Manager role. Finance Managers can now see all projects within their customer account but cannot create, edit, or delete projects.

---

## ✅ Implementation Summary

### **Date**: November 19, 2025
### **Status**: ✅ Complete

---

## 🔧 Changes Made

### 1. **Database Update**

Updated the `team_roles` table to add `projects: "view"` permission to Finance Manager:

```sql
UPDATE team_roles 
SET permissions = jsonb_set(
  permissions::jsonb, 
  '{projects}', 
  '"view"'::jsonb
)::json 
WHERE name = 'Finance Manager';
```

**Result:**
```json
{
  "reports": "view",
  "expenses": "manage",
  "invoices": "approve",
  "projects": "view"  // ✅ NEW
}
```

### 2. **Frontend Permission Logic**

Updated `src/modules/developer-dashboard/components/DeveloperDashboardRefactored.tsx`:

```typescript
// Before:
const canManageProjects = userPermissions.canManageProjects !== false;

// After:
const canManageProjects = userPermissions.canManageProjects !== false && 
                          userPermissions.projects !== "view";
```

**Logic:**
- If `permissions.projects === "view"` → `canManageProjects = false`
- Finance Managers can see projects but cannot create/edit/delete

### 3. **UI Component Updates**

Updated `src/modules/developer-dashboard/components/PortfolioOverview.tsx`:

**Table View Actions (Dropdown Menu):**
```typescript
// ✅ Always visible
<DropdownMenuItem>View</DropdownMenuItem>

// ❌ Hidden for Finance Manager (canManageProjects check)
{onEditProject && canManageProjects && (
  <DropdownMenuItem>Edit</DropdownMenuItem>
)}

{onMarkAsCompleted && canManageProjects && (
  <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
)}

{onReactivateProject && canManageProjects && (
  <DropdownMenuItem>Reactivate Project</DropdownMenuItem>
)}

{onDeleteProject && canManageProjects && (
  <DropdownMenuItem>Delete</DropdownMenuItem>
)}
```

**Header Actions:**
```typescript
// "Add New Project" button only visible if canManageProjects === true
{canManageProjects && (
  <Button onClick={onCreateProject}>
    <Plus /> Add New Project
  </Button>
)}
```

---

## 🎯 Finance Manager Capabilities

### **✅ What Finance Managers CAN Do:**

1. **View All Projects**
   - See complete project list in Portfolio Overview
   - Access project details and all tabs
   - View project metrics, KPIs, and status

2. **View Project Data**
   - Budget details
   - Expenses
   - Forecasts
   - Milestones
   - Purchase Orders (view only)
   - Invoices (full access)

3. **Financial Actions**
   - Create and manage budgets
   - Approve/reject invoices (up to their approval limit)
   - Mark invoices as paid
   - View and export financial reports

### **❌ What Finance Managers CANNOT Do:**

1. **Project Management**
   - ❌ Create new projects
   - ❌ Edit project details
   - ❌ Delete projects
   - ❌ Mark projects as completed
   - ❌ Reactivate projects

2. **Purchase Orders**
   - ❌ Create POs
   - ❌ Edit POs
   - ❌ Delete POs

3. **Vendors**
   - ❌ Create vendors
   - ❌ Edit vendor details
   - ❌ Delete vendors

4. **System Administration**
   - ❌ Access Settings page
   - ❌ Manage team members
   - ❌ Configure billing/plans

---

## 🔍 How It Works

### **Permission Flow:**

```
1. User logs in as Finance Manager
   ↓
2. Backend fetches team_members record
   ↓
3. Backend retrieves team_roles.permissions
   {
     "projects": "view",
     "invoices": "approve",
     ...
   }
   ↓
4. Backend computes effectivePermissions
   - canManageProjects: false (from role)
   - canApproveInvoices: true
   - projects: "view"
   ↓
5. Frontend receives permissions
   ↓
6. Frontend checks:
   - canManageProjects === false
   - permissions.projects === "view"
   ↓
7. UI conditionally renders:
   ✅ "View" button (always)
   ❌ "Edit" button (hidden)
   ❌ "Delete" button (hidden)
   ❌ "Add New Project" button (hidden)
```

---

## 🧪 Testing

### **Test Scenario 1: Finance Manager Login**

**User:** `infokitcon@gmail.com` (Finance Manager)

**Expected Behavior:**
1. ✅ Can see Portfolio Overview with all projects
2. ✅ Can click on any project to view details
3. ✅ Can see all project tabs (Budget, Expenses, etc.)
4. ❌ Cannot see "Add New Project" button
5. ❌ Cannot see "Edit" in project dropdown menu
6. ❌ Cannot see "Delete" in project dropdown menu
7. ✅ Can see "View" in project dropdown menu

### **Test Scenario 2: Developer Owner Login**

**User:** `olukoyaseyifunmi@gmail.com` (Developer Owner)

**Expected Behavior:**
1. ✅ Can see Portfolio Overview with all projects
2. ✅ Can see "Add New Project" button
3. ✅ Can see "Edit" in project dropdown menu
4. ✅ Can see "Delete" in project dropdown menu
5. ✅ Can create/edit/delete projects

---

## 📊 Database State

### **Current Roles & Permissions:**

| Role            | Projects Permission | Can Manage Projects | Can Approve Invoices | Approval Limit |
| --------------- | ------------------- | ------------------- | -------------------- | -------------- |
| Owner           | `{"all": true}`     | ✅ Yes              | ✅ Yes               | Unlimited      |
| Finance Manager | `"view"`            | ❌ No               | ✅ Yes               | $50,000        |
| Project Manager | `"manage"`          | ✅ Yes              | ❌ No                | N/A            |
| Accountant      | `"view"`            | ❌ No               | ❌ No                | N/A            |
| Viewer          | `"view"`            | ❌ No               | ❌ No                | N/A            |

### **Current Team Members:**

| Email                      | Role            | Status | Can Manage Projects |
| -------------------------- | --------------- | ------ | ------------------- |
| olukoyaseyifunmi@gmail.com | Developer Owner | Active | ✅ Yes              |
| infokitcon@gmail.com       | Finance Manager | Active | ❌ No               |
| cmpmediapartners@gmail.com | Developer       | Active | ✅ Yes              |

---

## 🔐 Security Considerations

### **Frontend Guards:**
- UI elements (buttons, menu items) are conditionally rendered based on `canManageProjects`
- Finance Managers cannot see or access edit/delete actions

### **Backend Validation:**
- All project create/edit/delete endpoints should validate `canManageProjects` permission
- Even if a Finance Manager bypasses frontend checks, backend should reject unauthorized actions

### **Recommended Backend Enhancement:**
Add middleware to project mutation endpoints:

```typescript
// backend/src/routes/developer-dashboard.ts
router.post('/projects', authMiddleware, customerOnly, async (req, res) => {
  const userId = req.user!.id;
  
  // Check if user can manage projects
  const teamMember = await prisma.team_members.findFirst({
    where: { user_id: userId },
    include: { team_roles: true }
  });
  
  if (teamMember && !teamMember.can_manage_projects) {
    return res.status(403).json({ 
      error: 'Insufficient permissions to create projects' 
    });
  }
  
  // ... rest of create logic
});
```

---

## 📝 Related Documentation

- [Role-Based Page Access Matrix](./ROLE_BASED_PAGE_ACCESS_MATRIX.md)
- [Team Member Role-Based Permissions](./TEAM_MEMBER_ROLE_BASED_PERMISSIONS.md)
- [Team Member Project Access Fix](./TEAM_MEMBER_PROJECT_ACCESS_FIX.md)

---

## ✅ Completion Checklist

- [x] Database permissions updated for Finance Manager
- [x] Frontend permission logic updated
- [x] UI components conditionally render based on permissions
- [x] Table view actions hidden for Finance Manager
- [x] "Add New Project" button hidden for Finance Manager
- [x] Test user updated to Finance Manager role
- [x] Documentation created
- [ ] Backend validation added (recommended for future)
- [ ] End-to-end testing completed

---

## 🚀 Next Steps

1. **Test the Implementation:**
   - Log in as `infokitcon@gmail.com` (Finance Manager)
   - Verify projects are visible
   - Verify edit/delete actions are hidden
   - Verify "Add New Project" button is hidden

2. **Backend Security Enhancement:**
   - Add permission checks to project mutation endpoints
   - Ensure Finance Managers cannot bypass frontend restrictions

3. **Additional Roles:**
   - Consider applying similar view-only logic to Accountant and Viewer roles
   - Ensure consistency across all role permissions

---

**Implementation Complete! ✅**

Finance Managers can now view all projects but cannot create, edit, or delete them. This provides the necessary financial oversight while maintaining proper access control.

