# Team Member Role-Based Permissions System

## 📋 Overview

When a Developer Admin creates a team member, the team member's permissions are **determined by the ROLE assigned to them**, NOT by copying the admin's permissions. This ensures proper access control and scalability.

---

## 🏗️ Architecture

### **1. System Roles (Predefined)**

The system comes with 5 predefined roles stored in the `team_roles` table:

| Role                | Description         | Key Permissions                                      |
| ------------------- | ------------------- | ---------------------------------------------------- |
| **Owner**           | Full system access  | All permissions, unlimited approval                  |
| **Finance Manager** | Financial oversight | Approve invoices up to $50,000, manage budgets       |
| **Project Manager** | Project operations  | Create invoices, manage projects, view reports       |
| **Accountant**      | Financial records   | View/create invoices, view reports, limited approval |
| **Viewer**          | Read-only access    | View-only permissions                                |

### **2. Permission Structure**

Each role defines:

- **Base Permissions**: JSON object with permission flags
- **Approval Limit**: Maximum invoice amount they can approve
- **Specific Capabilities**:
  - `can_approve_invoices`: Can approve/reject invoices
  - `can_create_invoices`: Can create new invoices
  - `can_manage_projects`: Can create/edit projects
  - `can_view_reports`: Can access financial reports

### **3. Permission Hierarchy**

```
Team Role (team_roles)
    ↓
Base Permissions + Capabilities
    ↓
Individual Overrides (team_members)
    ↓
Effective Permissions (computed at login)
```

---

## 🔐 How It Works

### **Step 1: Admin Invites Team Member**

```typescript
// Admin selects a role when inviting
POST /api/team/members
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "roleId": "finance-manager-role-id",
  // Optional: Individual overrides
  "canApproveInvoices": true,
  "approvalLimit": 75000  // Override role's $50k limit
}
```

### **Step 2: Team Member Logs In**

```typescript
// Backend fetches team member's role and permissions
const teamMember = await prisma.team_members.findFirst({
  where: { user_id: user.id, customer_id: user.customerId },
  include: { team_roles: true },
});

// Compute effective permissions
const permissions = {
  // Base permissions from role
  ...(teamMember.team_roles?.permissions || {}),

  // Individual overrides (if set)
  canApproveInvoices:
    teamMember.can_approve_invoices ??
    teamMember.team_roles?.can_approve_invoices,
  approvalLimit:
    teamMember.approval_limit ?? teamMember.team_roles?.approval_limit,
  canCreateInvoices:
    teamMember.can_create_invoices ??
    teamMember.team_roles?.can_create_invoices,
  canManageProjects:
    teamMember.can_manage_projects ??
    teamMember.team_roles?.can_manage_projects,
  canViewReports:
    teamMember.can_view_reports ?? teamMember.team_roles?.can_view_reports,
};
```

### **Step 3: Frontend Uses Permissions**

```typescript
// Login response includes computed permissions
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "role": "developer",
    "permissions": {
      "canApproveInvoices": true,
      "approvalLimit": 75000,
      "canCreateInvoices": true,
      "canManageProjects": false,
      "canViewReports": true
    },
    "teamMemberRole": {
      "id": "role-id",
      "name": "Finance Manager",
      "description": "Manages financial operations"
    }
  }
}
```

---

## 📊 Database Schema

### **team_roles Table**

```sql
CREATE TABLE team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT REFERENCES customers(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  can_approve_invoices BOOLEAN DEFAULT false,
  approval_limit DECIMAL(15,2),
  can_create_invoices BOOLEAN DEFAULT false,
  can_manage_projects BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **team_members Table**

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES team_roles(id),

  -- Individual permission overrides (NULL = use role's default)
  can_approve_invoices BOOLEAN,
  approval_limit DECIMAL(15,2),
  can_create_invoices BOOLEAN,
  can_manage_projects BOOLEAN,
  can_view_reports BOOLEAN,

  status VARCHAR(20) DEFAULT 'invited',
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Use Cases

### **Use Case 1: Standard Role Assignment**

**Scenario**: Admin invites an accountant with standard permissions.

```typescript
// Admin action
inviteMember({
  firstName: "Jane",
  lastName: "Smith",
  email: "jane@example.com",
  roleId: "accountant-role-id"  // Uses Accountant role's default permissions
});

// Jane's effective permissions (from Accountant role)
{
  canApproveInvoices: true,
  approvalLimit: 10000,
  canCreateInvoices: true,
  canManageProjects: false,
  canViewReports: true
}
```

### **Use Case 2: Custom Permission Override**

**Scenario**: Admin invites a senior accountant with higher approval limit.

```typescript
// Admin action
inviteMember({
  firstName: "John",
  lastName: "Senior",
  email: "john@example.com",
  roleId: "accountant-role-id",
  approvalLimit: 50000  // Override: $50k instead of $10k
});

// John's effective permissions
{
  canApproveInvoices: true,
  approvalLimit: 50000,  // ✅ Overridden
  canCreateInvoices: true,
  canManageProjects: false,
  canViewReports: true
}
```

### **Use Case 3: Custom Role Creation**

**Scenario**: Admin creates a custom "Senior Project Manager" role.

```typescript
// Admin action
createRole({
  name: "Senior Project Manager",
  description: "Manages multiple projects with approval authority",
  canApproveInvoices: true,
  approvalLimit: 25000,
  canCreateInvoices: true,
  canManageProjects: true,
  canViewReports: true,
  permissions: {
    canDeleteProjects: true,
    canAssignTasks: true,
  },
});

// Invite team member with this custom role
inviteMember({
  firstName: "Sarah",
  lastName: "Lead",
  email: "sarah@example.com",
  roleId: "senior-pm-role-id",
});
```

---

## 🔄 Permission Updates

### **Updating a Team Member's Role**

```typescript
// Admin changes team member's role
PUT /api/team/members/:memberId
{
  "roleId": "finance-manager-role-id"  // Change from Accountant to Finance Manager
}

// Team member must re-login to get new permissions
// OR frontend calls /api/auth/account to refresh
```

### **Updating Individual Permissions**

```typescript
// Admin grants additional permissions
PUT /api/team/members/:memberId
{
  "canManageProjects": true,  // Grant project management
  "approvalLimit": 100000     // Increase approval limit
}

// Effective immediately on next /api/auth/account call
```

---

## 🛡️ Security Considerations

### **1. Permission Validation**

Every API endpoint must validate permissions:

```typescript
// Example: Invoice approval endpoint
router.post("/invoices/:id/approve", authMiddleware, async (req, res) => {
  const user = req.user;
  const invoice = await getInvoice(req.params.id);

  // Check if user can approve invoices
  if (!user.permissions.canApproveInvoices) {
    return res.status(403).json({ error: "No approval permission" });
  }

  // Check approval limit
  if (invoice.amount > user.permissions.approvalLimit) {
    return res.status(403).json({
      error: `Amount exceeds approval limit of ${user.permissions.approvalLimit}`,
    });
  }

  // Proceed with approval
  await approveInvoice(invoice.id, user.id);
  res.json({ success: true });
});
```

### **2. Frontend Permission Checks**

Hide/disable UI elements based on permissions:

```typescript
// React component
const InvoiceActions = ({ invoice }) => {
  const { user } = useAuth();

  return (
    <>
      {user.permissions.canCreateInvoices && (
        <Button onClick={createInvoice}>Create Invoice</Button>
      )}

      {user.permissions.canApproveInvoices &&
        invoice.amount <= user.permissions.approvalLimit && (
          <Button onClick={approveInvoice}>Approve</Button>
        )}

      {user.permissions.canManageProjects && (
        <Button onClick={editProject}>Edit Project</Button>
      )}
    </>
  );
};
```

### **3. Audit Trail**

All permission-based actions are logged:

```typescript
// Logged in approval_history table
{
  action: 'approved',
  invoice_id: 'inv-123',
  user_id: 'user-456',
  user_role: 'Finance Manager',
  approval_limit: 50000,
  invoice_amount: 35000,
  timestamp: '2025-11-19T19:00:00Z'
}
```

---

## 🧪 Testing Scenarios

### **Test 1: Role-Based Access**

1. Admin invites team member with "Viewer" role
2. Team member logs in
3. Verify: Can view invoices but cannot approve/create
4. Verify: UI shows read-only interface

### **Test 2: Approval Limits**

1. Admin invites team member with "Accountant" role ($10k limit)
2. Team member tries to approve $5k invoice → ✅ Success
3. Team member tries to approve $15k invoice → ❌ Denied

### **Test 3: Permission Updates**

1. Admin changes team member's role from "Viewer" to "Project Manager"
2. Team member refreshes page (calls /api/auth/account)
3. Verify: New permissions applied
4. Verify: UI shows new capabilities

### **Test 4: Custom Overrides**

1. Admin invites team member with "Accountant" role
2. Admin sets custom `approvalLimit: 25000` (override)
3. Team member logs in
4. Verify: Can approve up to $25k (not default $10k)

---

## 📈 Best Practices

### **1. Use System Roles First**

Start with predefined roles before creating custom ones.

### **2. Minimal Overrides**

Only override individual permissions when necessary. Keep role definitions clean.

### **3. Regular Audits**

Review team member permissions quarterly to ensure they're still appropriate.

### **4. Principle of Least Privilege**

Grant only the permissions needed for the job.

### **5. Document Custom Roles**

If creating custom roles, document their purpose and use cases.

---

## 🔧 API Endpoints

### **Get Team Member Permissions**

```bash
GET /api/auth/account
Authorization: Bearer <token>

Response:
{
  "user": {
    "permissions": {
      "canApproveInvoices": true,
      "approvalLimit": 50000,
      "canCreateInvoices": true,
      "canManageProjects": false,
      "canViewReports": true
    },
    "teamMemberRole": {
      "id": "role-id",
      "name": "Finance Manager",
      "description": "Manages financial operations"
    }
  }
}
```

### **Update Team Member Permissions**

```bash
PUT /api/team/members/:memberId
Authorization: Bearer <token>

Body:
{
  "roleId": "new-role-id",  // Change role
  "approvalLimit": 75000    // Or override specific permission
}
```

---

## ✅ Summary

- ✅ **Team members get permissions from their assigned ROLE**
- ✅ **5 predefined system roles** (Owner, Finance Manager, Project Manager, Accountant, Viewer)
- ✅ **Individual overrides** possible for specific cases
- ✅ **Permissions computed at login** and refreshed via `/api/auth/account`
- ✅ **Frontend and backend** both enforce permissions
- ✅ **Audit trail** tracks all permission-based actions
- ✅ **Scalable and maintainable** architecture

---

**Status**: ROLE-BASED PERMISSIONS SYSTEM COMPLETE ✅  
**Backend**: Enforces permissions on all endpoints 🔐  
**Frontend**: Shows/hides UI based on permissions 🎨  
**Security**: Multi-layer validation 🛡️  
**Ready for**: PRODUCTION 🚀
