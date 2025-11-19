# Team Management & Invoice Approval System - Architecture Design

## Design Date

November 19, 2025

## Executive Summary

A comprehensive team management system with role-based access control (RBAC) and multi-level invoice approval workflow for property development organizations.

---

## 🎯 BUSINESS REQUIREMENTS

### **Core Objectives**:

1. **Team Management**: Add, manage, and organize team members
2. **Role-Based Access**: Define roles with specific permissions
3. **Invoice Approval**: Multi-level approval workflow for invoices
4. **Audit Trail**: Track all approvals and rejections
5. **Notifications**: Alert team members of pending approvals
6. **Delegation**: Allow approval delegation when unavailable

### **User Personas**:

1. **Owner/Admin**: Full control, can manage team and set approval rules
2. **Project Manager**: Can create invoices, manage projects
3. **Finance Manager**: Reviews and approves invoices
4. **Accountant**: Records payments, manages expenses
5. **Team Member**: View-only access to assigned projects

---

## 🏛️ SYSTEM ARCHITECTURE

### **Architecture Pattern**: Multi-Tier with RBAC

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Team         │  │ Invoice      │  │ Approval     │     │
│  │ Management   │  │ Creation     │  │ Dashboard    │     │
│  │ UI           │  │ UI           │  │ UI           │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Team         │  │ Approval     │  │ Notification │     │
│  │ Service      │  │ Workflow     │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ team_members │  │ team_roles   │  │ approval     │     │
│  │              │  │              │  │ _workflows   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA DESIGN

### **1. Team Members Table**

```sql
CREATE TABLE team_members (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id           TEXT NOT NULL REFERENCES team_roles(id),

  -- Member Details
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  job_title         TEXT,
  department        TEXT,

  -- Status & Permissions
  status            TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
  can_approve_invoices BOOLEAN DEFAULT false,
  approval_limit    DECIMAL(15,2), -- Max amount they can approve
  can_create_invoices BOOLEAN DEFAULT false,
  can_manage_projects BOOLEAN DEFAULT false,
  can_view_reports  BOOLEAN DEFAULT false,

  -- Delegation
  delegate_to       TEXT REFERENCES team_members(id),
  delegation_start  TIMESTAMP,
  delegation_end    TIMESTAMP,

  -- Audit
  invited_by        TEXT REFERENCES users(id),
  invited_at        TIMESTAMP DEFAULT NOW(),
  joined_at         TIMESTAMP,
  last_active       TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),

  UNIQUE(customer_id, email),
  INDEX idx_team_customer (customer_id),
  INDEX idx_team_user (user_id),
  INDEX idx_team_status (status),
  INDEX idx_team_approver (can_approve_invoices, status)
);

COMMENT ON TABLE team_members IS 'Team members with roles and permissions for invoice approval';
```

### **2. Team Roles Table**

```sql
CREATE TABLE team_roles (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Role Details
  name              TEXT NOT NULL, -- Owner, Finance Manager, Project Manager, Accountant, Viewer
  description       TEXT,
  is_system_role    BOOLEAN DEFAULT false, -- System roles can't be deleted

  -- Permissions (JSON for flexibility)
  permissions       JSONB NOT NULL DEFAULT '{}',

  -- Invoice Approval Settings
  can_approve_invoices BOOLEAN DEFAULT false,
  approval_limit    DECIMAL(15,2), -- NULL = unlimited
  requires_approval_from TEXT[], -- Array of role IDs that must approve first

  -- Audit
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),

  UNIQUE(customer_id, name),
  INDEX idx_role_customer (customer_id)
);

COMMENT ON TABLE team_roles IS 'Predefined roles with permissions for team members';

-- Insert default system roles
INSERT INTO team_roles (id, customer_id, name, description, is_system_role, permissions, can_approve_invoices) VALUES
  ('role-owner', NULL, 'Owner', 'Full access to all features', true, '{"all": true}', true),
  ('role-finance-manager', NULL, 'Finance Manager', 'Approve invoices and manage finances', true, '{"invoices": "approve", "expenses": "manage"}', true),
  ('role-project-manager', NULL, 'Project Manager', 'Create invoices and manage projects', true, '{"invoices": "create", "projects": "manage"}', false),
  ('role-accountant', NULL, 'Accountant', 'Record payments and view reports', true, '{"payments": "record", "reports": "view"}', false),
  ('role-viewer', NULL, 'Viewer', 'View-only access', true, '{"projects": "view", "invoices": "view"}', false);
```

### **3. Invoice Approval Workflows Table**

```sql
CREATE TABLE invoice_approval_workflows (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Workflow Details
  name              TEXT NOT NULL,
  description       TEXT,
  is_active         BOOLEAN DEFAULT true,
  is_default        BOOLEAN DEFAULT false,

  -- Trigger Conditions
  min_amount        DECIMAL(15,2), -- Workflow applies if invoice >= this amount
  max_amount        DECIMAL(15,2), -- Workflow applies if invoice <= this amount
  categories        TEXT[], -- Workflow applies to these categories

  -- Approval Levels (JSON array of levels)
  approval_levels   JSONB NOT NULL,
  /* Example:
  [
    {
      "level": 1,
      "name": "Project Manager Review",
      "required_approvers": 1,
      "approver_roles": ["role-project-manager"],
      "approver_members": [],
      "timeout_hours": 24
    },
    {
      "level": 2,
      "name": "Finance Manager Approval",
      "required_approvers": 1,
      "approver_roles": ["role-finance-manager"],
      "approver_members": [],
      "timeout_hours": 48
    }
  ]
  */

  -- Auto-approval Rules
  auto_approve_under DECIMAL(15,2), -- Auto-approve if amount < this

  -- Audit
  created_by        TEXT REFERENCES users(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),

  INDEX idx_workflow_customer (customer_id),
  INDEX idx_workflow_active (is_active, is_default)
);

COMMENT ON TABLE invoice_approval_workflows IS 'Configurable approval workflows for invoices';
```

### **4. Invoice Approvals Table**

```sql
CREATE TABLE invoice_approvals (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        TEXT NOT NULL REFERENCES project_invoices(id) ON DELETE CASCADE,
  workflow_id       TEXT REFERENCES invoice_approval_workflows(id),

  -- Approval Details
  level             INTEGER NOT NULL, -- Which level in the workflow
  level_name        TEXT,
  approver_id       TEXT NOT NULL REFERENCES team_members(id),

  -- Decision
  status            TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, delegated
  decision          TEXT, -- approved, rejected
  comments          TEXT,

  -- Timestamps
  requested_at      TIMESTAMP DEFAULT NOW(),
  responded_at      TIMESTAMP,
  due_at            TIMESTAMP, -- When approval is due

  -- Delegation
  delegated_to      TEXT REFERENCES team_members(id),
  delegated_at      TIMESTAMP,

  -- Notifications
  notification_sent BOOLEAN DEFAULT false,
  reminder_count    INTEGER DEFAULT 0,
  last_reminder_at  TIMESTAMP,

  INDEX idx_approval_invoice (invoice_id),
  INDEX idx_approval_approver (approver_id, status),
  INDEX idx_approval_status (status),
  INDEX idx_approval_due (due_at, status)
);

COMMENT ON TABLE invoice_approvals IS 'Individual approval requests for invoices';
```

### **5. Approval History Table**

```sql
CREATE TABLE approval_history (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        TEXT NOT NULL REFERENCES project_invoices(id) ON DELETE CASCADE,
  approval_id       TEXT REFERENCES invoice_approvals(id),

  -- Action Details
  action            TEXT NOT NULL, -- submitted, approved, rejected, delegated, escalated, auto_approved
  actor_id          TEXT REFERENCES team_members(id),
  actor_name        TEXT NOT NULL,
  actor_role        TEXT,

  -- Details
  level             INTEGER,
  comments          TEXT,
  previous_status   TEXT,
  new_status        TEXT,

  -- Metadata
  metadata          JSONB, -- Additional context
  ip_address        TEXT,
  user_agent        TEXT,

  -- Timestamp
  created_at        TIMESTAMP DEFAULT NOW(),

  INDEX idx_history_invoice (invoice_id),
  INDEX idx_history_actor (actor_id),
  INDEX idx_history_created (created_at)
);

COMMENT ON TABLE approval_history IS 'Complete audit trail of all approval actions';
```

---

## 🔄 INVOICE APPROVAL WORKFLOW

### **Workflow States**:

```
┌──────────────┐
│   PENDING    │ ← Invoice created
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ IN_APPROVAL  │ ← Sent to approvers
└──────┬───────┘
       │
       ├─────────────┬─────────────┬─────────────┐
       ▼             ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ LEVEL 1  │  │ LEVEL 2  │  │ LEVEL 3  │  │ LEVEL N  │
│ PENDING  │→ │ PENDING  │→ │ PENDING  │→ │ PENDING  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
       │             │             │             │
       ▼             ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ APPROVED │  │ APPROVED │  │ APPROVED │  │ APPROVED │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
       │             │             │             │
       └─────────────┴─────────────┴─────────────┘
                      ▼
              ┌──────────────┐
              │   APPROVED   │ ← All levels approved
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │     PAID     │ ← Payment recorded
              └──────────────┘

       Any level can reject ↓
              ┌──────────────┐
              │   REJECTED   │
              └──────────────┘
```

### **Approval Logic**:

```typescript
// Pseudo-code for approval workflow
async function processInvoiceApproval(invoice: Invoice) {
  // 1. Determine applicable workflow
  const workflow = await findApplicableWorkflow(invoice);

  // 2. Check auto-approval
  if (
    workflow.auto_approve_under &&
    invoice.amount < workflow.auto_approve_under
  ) {
    return await autoApproveInvoice(invoice);
  }

  // 3. Create approval requests for Level 1
  const level1Approvers = await getApproversForLevel(workflow, 1);
  await createApprovalRequests(invoice, workflow, 1, level1Approvers);

  // 4. Send notifications
  await notifyApprovers(level1Approvers, invoice);

  // 5. Update invoice status
  await updateInvoiceStatus(invoice.id, "in_approval");
}

async function handleApprovalDecision(
  approvalId: string,
  decision: "approved" | "rejected",
  comments: string
) {
  const approval = await getApproval(approvalId);
  const invoice = await getInvoice(approval.invoice_id);
  const workflow = await getWorkflow(approval.workflow_id);

  // 1. Record decision
  await updateApproval(approvalId, {
    status: decision,
    comments,
    responded_at: new Date(),
  });

  // 2. Log in history
  await logApprovalHistory(
    invoice.id,
    approval.level,
    decision,
    approval.approver_id,
    comments
  );

  if (decision === "rejected") {
    // 3a. Rejection: Update invoice status
    await updateInvoiceStatus(invoice.id, "rejected");
    await notifyInvoiceCreator(invoice, "rejected", comments);
    return;
  }

  // 3b. Approval: Check if level is complete
  const levelApprovals = await getApprovalsByLevel(invoice.id, approval.level);
  const requiredApprovals =
    workflow.approval_levels[approval.level - 1].required_approvers;
  const approvedCount = levelApprovals.filter(
    (a) => a.status === "approved"
  ).length;

  if (approvedCount >= requiredApprovals) {
    // Level complete, move to next level
    const nextLevel = approval.level + 1;

    if (nextLevel <= workflow.approval_levels.length) {
      // 4. Create approvals for next level
      const nextLevelApprovers = await getApproversForLevel(
        workflow,
        nextLevel
      );
      await createApprovalRequests(
        invoice,
        workflow,
        nextLevel,
        nextLevelApprovers
      );
      await notifyApprovers(nextLevelApprovers, invoice);
    } else {
      // 5. All levels approved
      await updateInvoiceStatus(invoice.id, "approved");
      await notifyInvoiceCreator(invoice, "approved");
    }
  }
}
```

---

## 🎨 UI/UX DESIGN

### **1. Team Management Tab**

```
┌─────────────────────────────────────────────────────────────┐
│ Team Management                                    [+ Add Member] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Active Members (12)                                      ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Name          Role              Status    Approval Limit││
│ │ ─────────────────────────────────────────────────────── ││
│ │ John Doe      Owner             Active    Unlimited     ││
│ │ Jane Smith    Finance Manager   Active    ₦5,000,000   ││
│ │ Bob Johnson   Project Manager   Active    ₦1,000,000   ││
│ │ Alice Brown   Accountant        Active    —            ││
│ │ ...                                                      ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Approval Workflows                      [+ Create Workflow]││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Name                  Conditions         Levels   Status││
│ │ ─────────────────────────────────────────────────────── ││
│ │ Standard Approval     < ₦1M              2        Active││
│ │ High-Value Approval   ≥ ₦1M              3        Active││
│ │ Quick Approval        < ₦100K            1        Active││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### **2. Approval Dashboard**

```
┌─────────────────────────────────────────────────────────────┐
│ Pending Approvals                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🔔 You have 3 invoices pending your approval             ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ INV-2025-001  │  Materials  │  ₦850,000  │  Level 2/2   ││
│ │ BuildRight Steel Ltd                      Due in 6 hours ││
│ │ [View Details] [Approve] [Reject]                        ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ INV-2025-002  │  Labor      │  ₦1,200,000 │  Level 1/3  ││
│ │ ABC Construction                          Due in 18 hours││
│ │ [View Details] [Approve] [Reject]                        ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### **3. Invoice Detail with Approval Status**

```
┌─────────────────────────────────────────────────────────────┐
│ Invoice INV-2025-001                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Amount: ₦850,000                                            │
│ Vendor: BuildRight Steel Ltd                                │
│ Category: Materials                                         │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Approval Progress                                        ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ ✅ Level 1: Project Manager Review                       ││
│ │    Approved by John Doe on Nov 18, 2025                 ││
│ │                                                          ││
│ │ ⏳ Level 2: Finance Manager Approval (Current)           ││
│ │    Pending: Jane Smith (Due in 6 hours)                 ││
│ │                                                          ││
│ │ ⏸️  Level 3: Owner Final Approval                        ││
│ │    Waiting for Level 2                                   ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ [Approve] [Reject] [Delegate] [Add Comment]                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔔 NOTIFICATION SYSTEM

### **Notification Types**:

1. **Approval Request**: "You have a new invoice to approve"
2. **Approval Reminder**: "Invoice approval due in 2 hours"
3. **Approval Granted**: "Your invoice has been approved"
4. **Approval Rejected**: "Your invoice has been rejected"
5. **Delegation**: "Invoice approval has been delegated to you"
6. **Escalation**: "Invoice approval overdue - escalated"

### **Notification Channels**:

- In-app notifications
- Email notifications
- SMS (for urgent approvals)
- Slack/Teams integration (future)

---

## 🔐 SECURITY & PERMISSIONS

### **Permission Matrix**:

| Action           | Owner | Finance Mgr    | Project Mgr  | Accountant | Viewer |
| ---------------- | ----- | -------------- | ------------ | ---------- | ------ |
| Create Invoice   | ✅    | ✅             | ✅           | ❌         | ❌     |
| Approve Invoice  | ✅    | ✅             | ⚠️ (Level 1) | ❌         | ❌     |
| Reject Invoice   | ✅    | ✅             | ⚠️ (Level 1) | ❌         | ❌     |
| Mark as Paid     | ✅    | ✅             | ❌           | ✅         | ❌     |
| Manage Team      | ✅    | ❌             | ❌           | ❌         | ❌     |
| View Reports     | ✅    | ✅             | ✅           | ✅         | ✅     |
| Manage Workflows | ✅    | ⚠️ (View only) | ❌           | ❌         | ❌     |

---

## 📈 IMPLEMENTATION PHASES

### **Phase 1: Foundation (Week 1-2)**

- ✅ Database schema creation
- ✅ Team member CRUD operations
- ✅ Role management
- ✅ Basic permissions

### **Phase 2: Approval Workflow (Week 3-4)**

- ✅ Workflow configuration
- ✅ Approval request creation
- ✅ Approval/rejection logic
- ✅ Status tracking

### **Phase 3: UI Implementation (Week 5-6)**

- ✅ Team management tab
- ✅ Approval dashboard
- ✅ Invoice approval interface
- ✅ Workflow builder

### **Phase 4: Notifications & Advanced Features (Week 7-8)**

- ✅ Email notifications
- ✅ Delegation system
- ✅ Escalation rules
- ✅ Audit reports

---

## 🎯 SUCCESS METRICS

1. **Approval Time**: Average time to approve invoices
2. **Approval Rate**: % of invoices approved vs rejected
3. **Team Adoption**: % of team members actively using the system
4. **Bottlenecks**: Identify slow approval levels
5. **Compliance**: % of invoices following proper approval workflow

---

## 🔮 FUTURE ENHANCEMENTS

1. **AI-Powered Approval**: Auto-approve based on historical patterns
2. **Mobile App**: Approve invoices on the go
3. **Integration**: Connect with accounting software (QuickBooks, Xero)
4. **Advanced Analytics**: Approval trends and insights
5. **Multi-Currency**: Support for international invoices
6. **Batch Approval**: Approve multiple invoices at once
7. **Conditional Workflows**: Dynamic workflows based on complex rules

---

## 📚 RELATED DOCUMENTATION

- [Invoice Approve/Reject Feature](./INVOICE_APPROVE_REJECT_FEATURE.md)
- [Mark as Paid Modal Implementation](./MARK_AS_PAID_MODAL_IMPLEMENTATION.md)
- [Database Schema Documentation](./DATABASE_SCHEMA.md)

---

## ✅ ARCHITECTURE REVIEW CHECKLIST

- ✅ Scalable: Supports unlimited team members and workflows
- ✅ Flexible: Configurable approval levels and rules
- ✅ Secure: Role-based access control
- ✅ Auditable: Complete history of all actions
- ✅ User-Friendly: Intuitive UI for all user types
- ✅ Performant: Optimized database queries with indexes
- ✅ Maintainable: Clean separation of concerns
- ✅ Extensible: Easy to add new features

---

**Status**: Architecture Design Complete ✅
**Ready for**: Implementation Planning
