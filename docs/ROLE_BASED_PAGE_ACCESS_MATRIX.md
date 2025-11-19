# Role-Based Page Access Matrix 🎯

## 📋 Overview

This document defines which pages and features each team member role can access in the Developer Dashboard. All roles see the same projects (filtered by `customerId`), but their ability to VIEW and INTERACT with different pages varies based on their role permissions.

---

## 🏗️ System Roles

| Role                | Primary Function                         | Access Level                                       |
| ------------------- | ---------------------------------------- | -------------------------------------------------- |
| **Developer Owner** | Primary developer admin & account holder | All developer dashboard pages, Billing, Team, etc. |
| **Owner**           | Full system control                      | All pages, all actions                             |
| **Finance Manager** | Financial oversight & approval           | Financial pages + limited project access           |
| **Project Manager** | Project operations                       | Project pages + invoice creation                   |
| **Accountant**      | Financial records & reporting            | Financial pages (read/limited write)               |
| **Viewer**          | Read-only monitoring                     | All pages (read-only)                              |

---

## 📊 Complete Page Access Matrix

### **Legend:**

- ✅ **Full Access**: Can view and perform all actions
- 👁️ **View Only**: Can see but cannot edit/create/delete
- 📝 **Limited Access**: Can view and perform specific actions only
- ❌ **No Access**: Cannot see this page

---

## 0️⃣ **DEVELOPER OWNER** (Primary Developer Admin)

### **Navigation Sidebar (Developer Dashboard):**

```
✅ Portfolio Overview
✅ Project Dashboard
✅ Budgets
✅ Purchase Orders
✅ Project Invoices
✅ Vendors
✅ Reports & Analytics
✅ Storage Quota Monitor
✅ Settings
   ✅ Profile
   ✅ Organization
   ✅ Billing & Plans
   ✅ Storage Quota Details
   ✅ Team Management
   ✅ Notification Preferences
```

### **Detailed Permissions:**

| Page/Feature              | Access  | Can Do                                                                   |
| ------------------------- | ------- | ------------------------------------------------------------------------ |
| **Portfolio Overview**    | ✅ Full | View KPIs, launch project/invoice workflows                              |
| **Project Dashboard**     | ✅ Full | Create, edit, delete projects; control lifecycle                         |
| **Budgets**               | ✅ Full | Create, edit, delete budgets; set limits per project                     |
| **Purchase Orders**       | ✅ Full | Create PO, edit, cancel, archive                                         |
| **Project Invoices**      | ✅ Full | Create, edit, approve, reject, delete, mark as paid                      |
| **Vendors**               | ✅ Full | Create vendors, edit contacts, archive vendors                           |
| **Reports & Analytics**   | ✅ Full | Access all developer financial and operational reports, export data      |
| **Storage Quota Monitor** | ✅ Full | View usage, launch storage test tooling, upgrade plan                    |
| **Team Management**       | ✅ Full | Invite/disable team members, assign roles, configure approval delegation |
| **Notification Prefs**    | ✅ Full | Configure global email/in-app templates, queue processing                |
| **Settings**              | ✅ Full | Manage profile, org info, billing, storage, team, notifications          |

**Key Privileges:**

- 🔐 **Single source of truth** for plan/billing and quota changes.
- 🧑‍🤝‍🧑 Responsible for all team invitations, role assignments, and approval workflow setup.
- 📦 Oversees Digital Ocean Spaces usage per customer, can access storage tooling and upgrade paths.
- 📨 Can manage notification templates and trigger test notifications.

---

## 1️⃣ **OWNER** (Full System Access)

### **Navigation Sidebar:**

```
✅ Dashboard (Portfolio Overview)
✅ Projects
✅ Purchase Orders
✅ Invoices
✅ Vendors
✅ Reports & Analytics
✅ Settings
   ✅ Profile
   ✅ Organization
   ✅ Billing & Plans
   ✅ Storage Quota
   ✅ Team Management
   ✅ Notifications
```

### **Detailed Permissions:**

| Page/Feature          | Access  | Can Do                                                                 |
| --------------------- | ------- | ---------------------------------------------------------------------- |
| **Dashboard**         | ✅ Full | View all metrics, KPIs, charts                                         |
| **Projects List**     | ✅ Full | Create, edit, delete, archive projects                                 |
| **Project Details**   | ✅ Full | View all tabs, edit all fields                                         |
| **Budget Management** | ✅ Full | Create, edit, delete budget items                                      |
| **Expenses**          | ✅ Full | Create, edit, delete expenses                                          |
| **Forecasts**         | ✅ Full | Create, edit, delete forecasts                                         |
| **Milestones**        | ✅ Full | Create, edit, delete milestones                                        |
| **Purchase Orders**   | ✅ Full | Create, edit, delete POs                                               |
| **Invoices**          | ✅ Full | Create, edit, delete, approve, reject, mark as paid (unlimited amount) |
| **Vendors**           | ✅ Full | Create, edit, delete vendors                                           |
| **Reports**           | ✅ Full | View all reports, export data                                          |
| **Team Management**   | ✅ Full | Invite, edit, remove team members, manage roles                        |
| **Settings**          | ✅ Full | Edit all settings, manage billing                                      |

---

## 2️⃣ **FINANCE MANAGER** (Financial Oversight)

### **Navigation Sidebar:**

```
✅ Dashboard (Portfolio Overview)
✅ Projects
✅ Purchase Orders (View only)
✅ Invoices
✅ Vendors (View only)
✅ Reports & Analytics
❌ Settings (Hidden - Owner only)
```

### **Detailed Permissions:**

| Page/Feature          | Access       | Can Do                                                   |
| --------------------- | ------------ | -------------------------------------------------------- |
| **Dashboard**         | ✅ Full      | View all financial metrics, KPIs                         |
| **Projects List**     | 👁️ View      | View all projects, cannot create/edit/delete             |
| **Project Details**   | 📝 Limited   | View all tabs, edit budget only                          |
| **Budget Management** | ✅ Full      | Create, edit, delete budget items                        |
| **Expenses**          | 👁️ View      | View expenses, cannot create/edit/delete                 |
| **Forecasts**         | 👁️ View      | View forecasts, cannot create/edit/delete                |
| **Milestones**        | 👁️ View      | View milestones, cannot create/edit/delete               |
| **Purchase Orders**   | 👁️ View      | View POs, cannot create/edit/delete                      |
| **Invoices**          | ✅ Full      | Create, view, approve/reject up to $50,000, mark as paid |
| **Vendors**           | 👁️ View      | View vendor list, cannot create/edit/delete              |
| **Reports**           | ✅ Full      | View all financial reports, export data                  |
| **Team Management**   | ❌ No Access | Cannot manage team                                       |
| **Settings**          | 📝 Limited   | Edit profile only, view organization details             |

**Key Restrictions:**

- ⚠️ Cannot approve invoices over $50,000 (approval limit)
- ⚠️ Cannot create/edit/delete projects
- ⚠️ Cannot manage team members

---

## 3️⃣ **PROJECT MANAGER** (Project Operations)

### **Navigation Sidebar:**

```
✅ Dashboard (Portfolio Overview)
✅ Projects
✅ Purchase Orders
✅ Invoices
✅ Vendors
✅ Reports & Analytics (Limited)
❌ Settings (Hidden - Owner only)
```

### **Detailed Permissions:**

| Page/Feature          | Access       | Can Do                                         |
| --------------------- | ------------ | ---------------------------------------------- |
| **Dashboard**         | ✅ Full      | View all project metrics, KPIs                 |
| **Projects List**     | ✅ Full      | Create, edit, delete projects                  |
| **Project Details**   | ✅ Full      | View and edit all tabs                         |
| **Budget Management** | 📝 Limited   | View budgets, create line items, cannot delete |
| **Expenses**          | ✅ Full      | Create, edit, delete expenses                  |
| **Forecasts**         | ✅ Full      | Create, edit, delete forecasts                 |
| **Milestones**        | ✅ Full      | Create, edit, delete milestones                |
| **Purchase Orders**   | ✅ Full      | Create, edit, delete POs                       |
| **Invoices**          | ✅ Full      | Create, edit, delete invoices (cannot approve) |
| **Vendors**           | ✅ Full      | Create, edit, delete vendors                   |
| **Reports**           | 📝 Limited   | View project reports only (not financial)      |
| **Team Management**   | ❌ No Access | Cannot manage team                             |
| **Settings**          | 📝 Limited   | Edit profile only                              |

**Key Restrictions:**

- ⚠️ Cannot approve/reject invoices (no approval permission)
- ⚠️ Cannot view detailed financial reports
- ⚠️ Cannot manage team members

---

## 4️⃣ **ACCOUNTANT** (Financial Records)

### **Navigation Sidebar:**

```
✅ Dashboard (Portfolio Overview)
✅ Projects (View only)
👁️ Purchase Orders (View only)
✅ Invoices
👁️ Vendors (View only)
✅ Reports & Analytics
❌ Settings (Hidden - Owner only)
```

### **Detailed Permissions:**

| Page/Feature          | Access       | Can Do                                       |
| --------------------- | ------------ | -------------------------------------------- |
| **Dashboard**         | ✅ Full      | View all financial metrics                   |
| **Projects List**     | 👁️ View      | View all projects, cannot create/edit/delete |
| **Project Details**   | 👁️ View      | View all tabs (read-only)                    |
| **Budget Management** | 👁️ View      | View budgets, cannot edit                    |
| **Expenses**          | 👁️ View      | View expenses, cannot create/edit/delete     |
| **Forecasts**         | 👁️ View      | View forecasts, cannot create/edit/delete    |
| **Milestones**        | 👁️ View      | View milestones, cannot create/edit/delete   |
| **Purchase Orders**   | 👁️ View      | View POs, cannot create/edit/delete          |
| **Invoices**          | 📝 Limited   | Create, view, approve up to $10,000 only     |
| **Vendors**           | 👁️ View      | View vendor list, cannot create/edit/delete  |
| **Reports**           | ✅ Full      | View all reports, export data                |
| **Team Management**   | ❌ No Access | Cannot manage team                           |
| **Settings**          | 📝 Limited   | Edit profile only                            |

**Key Restrictions:**

- ⚠️ Cannot approve invoices over $10,000 (approval limit)
- ⚠️ Cannot create/edit/delete projects
- ⚠️ Cannot manage expenses or POs
- ⚠️ Cannot manage team members

---

## 5️⃣ **VIEWER** (Read-Only Access)

### **Navigation Sidebar:**

```
👁️ Dashboard (Portfolio Overview)
👁️ Projects
👁️ Purchase Orders
👁️ Invoices
👁️ Vendors
👁️ Reports & Analytics
❌ Settings (Hidden - Owner only)
```

### **Detailed Permissions:**

| Page/Feature          | Access       | Can Do                                      |
| --------------------- | ------------ | ------------------------------------------- |
| **Dashboard**         | 👁️ View      | View all metrics (read-only)                |
| **Projects List**     | 👁️ View      | View all projects, no actions               |
| **Project Details**   | 👁️ View      | View all tabs (read-only)                   |
| **Budget Management** | 👁️ View      | View budgets only                           |
| **Expenses**          | 👁️ View      | View expenses only                          |
| **Forecasts**         | 👁️ View      | View forecasts only                         |
| **Milestones**        | 👁️ View      | View milestones only                        |
| **Purchase Orders**   | 👁️ View      | View POs only                               |
| **Invoices**          | 👁️ View      | View invoices only (no create/approve/edit) |
| **Vendors**           | 👁️ View      | View vendor list only                       |
| **Reports**           | 👁️ View      | View reports only (cannot export)           |
| **Team Management**   | ❌ No Access | Cannot manage team                          |
| **Settings**          | 📝 Limited   | Edit profile only                           |

**Key Restrictions:**

- ⚠️ Cannot create, edit, or delete ANYTHING
- ⚠️ Cannot approve invoices
- ⚠️ Cannot export reports
- ⚠️ Read-only access to all pages

---

## 🎨 UI Implementation Guide

### **1. Navigation Sidebar**

```typescript
// Example: Conditional rendering based on permissions
const NavigationSidebar = () => {
  const { user } = useAuth();
  const permissions = user.permissions;

  return (
    <nav>
      {/* Everyone sees Dashboard */}
      <NavItem to="/dashboard" icon={<LayoutDashboard />}>
        Dashboard
      </NavItem>

      {/* Everyone sees Projects */}
      <NavItem to="/projects" icon={<FolderKanban />}>
        Projects
      </NavItem>

      {/* Everyone sees Purchase Orders */}
      <NavItem to="/purchase-orders" icon={<ShoppingCart />}>
        Purchase Orders
      </NavItem>

      {/* Everyone sees Invoices */}
      <NavItem to="/invoices" icon={<FileText />}>
        Invoices
      </NavItem>

      {/* Everyone sees Vendors */}
      <NavItem to="/vendors" icon={<Users />}>
        Vendors
      </NavItem>

      {/* Everyone sees Reports */}
      <NavItem to="/reports" icon={<BarChart />}>
        Reports & Analytics
      </NavItem>

      {/* Settings always visible */}
      <NavItem to="/settings" icon={<Settings />}>
        Settings
      </NavItem>

      {/* Team Management - Owner only */}
      {user.teamMemberRole?.name === "Owner" && (
        <NavItem to="/settings/team" icon={<Users />}>
          Team Management
        </NavItem>
      )}
    </nav>
  );
};
```

### **2. Action Buttons**

```typescript
// Example: Project page action buttons
const ProjectActions = ({ project }) => {
  const { user } = useAuth();
  const permissions = user.permissions;

  return (
    <div className="action-buttons">
      {/* Edit - Only if can manage projects */}
      {permissions.canManageProjects && (
        <Button onClick={editProject}>
          <Edit /> Edit Project
        </Button>
      )}

      {/* Delete - Only if can manage projects */}
      {permissions.canManageProjects && (
        <Button variant="destructive" onClick={deleteProject}>
          <Trash /> Delete Project
        </Button>
      )}

      {/* View - Everyone can view */}
      <Button variant="outline" onClick={viewProject}>
        <Eye /> View Details
      </Button>
    </div>
  );
};
```

### **3. Invoice Approval**

```typescript
// Example: Invoice approval buttons
const InvoiceActions = ({ invoice }) => {
  const { user } = useAuth();
  const permissions = user.permissions;

  // Check if user can approve this invoice
  const canApprove =
    permissions.canApproveInvoices &&
    invoice.amount <= permissions.approvalLimit;

  return (
    <div className="invoice-actions">
      {/* Approve - Only if can approve and within limit */}
      {canApprove && invoice.status === "pending" && (
        <Button onClick={approveInvoice}>
          <Check /> Approve
        </Button>
      )}

      {/* Reject - Only if can approve */}
      {permissions.canApproveInvoices && invoice.status === "pending" && (
        <Button variant="destructive" onClick={rejectInvoice}>
          <X /> Reject
        </Button>
      )}

      {/* Show limit warning */}
      {permissions.canApproveInvoices &&
        invoice.amount > permissions.approvalLimit && (
          <Alert variant="warning">
            Amount exceeds your approval limit of $
            {permissions.approvalLimit.toLocaleString()}
          </Alert>
        )}
    </div>
  );
};
```

### **4. Settings Tabs**

```typescript
// Example: Settings page tabs
const SettingsTabs = () => {
  const { user } = useAuth();
  const isOwner = user.teamMemberRole?.name === "Owner";

  return (
    <Tabs>
      {/* Everyone sees Profile */}
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>

        {/* Owner sees Organization */}
        {isOwner && (
          <TabsTrigger value="organization">Organization</TabsTrigger>
        )}

        {/* Owner sees Billing */}
        {isOwner && <TabsTrigger value="billing">Billing & Plans</TabsTrigger>}

        {/* Everyone sees Notifications */}
        <TabsTrigger value="notifications">Notifications</TabsTrigger>

        {/* Owner sees Team */}
        {isOwner && <TabsTrigger value="team">Team Management</TabsTrigger>}
      </TabsList>
    </Tabs>
  );
};
```

---

## 🔐 Backend Validation

### **Example: Project Creation Endpoint**

```typescript
router.post("/projects", authMiddleware, async (req, res) => {
  const user = req.user;

  // Check if user can manage projects
  if (!user.permissions.canManageProjects) {
    return res.status(403).json({
      error: "You do not have permission to create projects",
      requiredPermission: "canManageProjects",
      yourRole: user.teamMemberRole?.name,
    });
  }

  // Proceed with project creation
  const project = await prisma.developer_projects.create({
    data: {
      customerId: user.customerId,
      developerId: user.id,
      ...req.body,
    },
  });

  res.json({ success: true, project });
});
```

### **Example: Invoice Approval Endpoint**

```typescript
router.post("/invoices/:id/approve", authMiddleware, async (req, res) => {
  const user = req.user;
  const invoice = await getInvoice(req.params.id);

  // Check if user can approve invoices
  if (!user.permissions.canApproveInvoices) {
    return res.status(403).json({
      error: "You do not have permission to approve invoices",
      requiredPermission: "canApproveInvoices",
      yourRole: user.teamMemberRole?.name,
    });
  }

  // Check approval limit
  if (invoice.amount > user.permissions.approvalLimit) {
    return res.status(403).json({
      error: `Invoice amount ($${invoice.amount}) exceeds your approval limit ($${user.permissions.approvalLimit})`,
      invoiceAmount: invoice.amount,
      yourLimit: user.permissions.approvalLimit,
      yourRole: user.teamMemberRole?.name,
    });
  }

  // Proceed with approval
  await approveInvoice(invoice.id, user.id);
  res.json({ success: true });
});
```

---

## 📋 Quick Reference Table

| Feature             | Owner          | Finance Mgr | Project Mgr | Accountant | Viewer |
| ------------------- | -------------- | ----------- | ----------- | ---------- | ------ |
| **View Dashboard**  | ✅             | ✅          | ✅          | ✅         | 👁️     |
| **Create Project**  | ✅             | ❌          | ✅          | ❌         | ❌     |
| **Edit Project**    | ✅             | ❌          | ✅          | ❌         | ❌     |
| **Delete Project**  | ✅             | ❌          | ✅          | ❌         | ❌     |
| **View Budget**     | ✅             | ✅          | ✅          | 👁️         | 👁️     |
| **Edit Budget**     | ✅             | ✅          | 📝          | ❌         | ❌     |
| **Create Expense**  | ✅             | ❌          | ✅          | ❌         | ❌     |
| **Create Invoice**  | ✅             | ✅          | ✅          | ✅         | ❌     |
| **Approve Invoice** | ✅ (Unlimited) | ✅ ($50k)   | ❌          | ✅ ($10k)  | ❌     |
| **Create PO**       | ✅             | ❌          | ✅          | ❌         | ❌     |
| **Manage Vendors**  | ✅             | ❌          | ✅          | ❌         | ❌     |
| **View Reports**    | ✅             | ✅          | 📝          | ✅         | 👁️     |
| **Export Reports**  | ✅             | ✅          | ✅          | ✅         | ❌     |
| **Manage Team**     | ✅             | ❌          | ❌          | ❌         | ❌     |
| **Settings Access** | ✅             | ❌          | ❌          | ❌         | ❌     |

---

## ✅ Summary

- ✅ **Owner**: Full access to everything
- ✅ **Finance Manager**: Financial oversight, approve up to $50k
- ✅ **Project Manager**: Project operations, cannot approve invoices
- ✅ **Accountant**: Financial records, approve up to $10k
- ✅ **Viewer**: Read-only access to everything

**All roles see the SAME projects** (filtered by `customerId`), but their **actions are controlled by role permissions**.

---

**Status**: ROLE-BASED PAGE ACCESS MATRIX COMPLETE ✅  
**Frontend**: Ready for implementation 🎨  
**Backend**: Validation in place 🔐  
**Documentation**: Comprehensive guide 📚  
**Ready for**: DEVELOPMENT 🚀
