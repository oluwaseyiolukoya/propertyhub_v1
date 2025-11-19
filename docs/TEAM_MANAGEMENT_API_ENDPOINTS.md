# Team Management & Invoice Approval - API Endpoints

## API Design Date
November 19, 2025

## Base URL
`/api/team` - Team Management
`/api/approvals` - Approval Workflows

---

## 🔐 AUTHENTICATION

All endpoints require:
- **Header**: `Authorization: Bearer {token}`
- **Permission**: Customer-specific access (customerId from token)

---

## 📋 TEAM MANAGEMENT ENDPOINTS

### **1. Get Team Members**

```http
GET /api/team/members
```

**Query Parameters**:
- `status` (optional): `active`, `inactive`, `suspended`, `invited`
- `role` (optional): Filter by role ID
- `canApprove` (optional): `true`/`false`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "member-123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@company.com",
      "phone": "+234 123 456 7890",
      "jobTitle": "Finance Manager",
      "department": "Finance",
      "status": "active",
      "role": {
        "id": "role-finance-manager",
        "name": "Finance Manager"
      },
      "canApproveInvoices": true,
      "approvalLimit": 5000000,
      "invitedAt": "2025-11-01T10:00:00Z",
      "joinedAt": "2025-11-02T14:30:00Z",
      "lastActive": "2025-11-19T09:15:00Z"
    }
  ]
}
```

---

### **2. Get Single Team Member**

```http
GET /api/team/members/:memberId
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "member-123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@company.com",
    "phone": "+234 123 456 7890",
    "jobTitle": "Finance Manager",
    "department": "Finance",
    "status": "active",
    "role": {
      "id": "role-finance-manager",
      "name": "Finance Manager",
      "permissions": {
        "invoices": "approve",
        "expenses": "manage"
      }
    },
    "canApproveInvoices": true,
    "approvalLimit": 5000000,
    "canCreateInvoices": true,
    "canManageProjects": false,
    "canViewReports": true,
    "delegation": {
      "delegateTo": "member-456",
      "delegateeName": "Jane Smith",
      "start": "2025-12-01T00:00:00Z",
      "end": "2025-12-15T23:59:59Z"
    },
    "invitedBy": {
      "id": "user-owner",
      "name": "Owner Name"
    },
    "invitedAt": "2025-11-01T10:00:00Z",
    "joinedAt": "2025-11-02T14:30:00Z",
    "lastActive": "2025-11-19T09:15:00Z"
  }
}
```

---

### **3. Create Team Member (Invite)**

```http
POST /api/team/members
```

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@company.com",
  "phone": "+234 987 654 3210",
  "jobTitle": "Project Manager",
  "department": "Operations",
  "roleId": "role-project-manager",
  "canApproveInvoices": true,
  "approvalLimit": 1000000,
  "canCreateInvoices": true,
  "canManageProjects": true,
  "canViewReports": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Team member invited successfully. Invitation email sent.",
  "data": {
    "id": "member-456",
    "email": "jane@company.com",
    "status": "invited",
    "invitationToken": "inv_abc123...",
    "invitationExpires": "2025-11-26T10:00:00Z"
  }
}
```

---

### **4. Update Team Member**

```http
PUT /api/team/members/:memberId
```

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "phone": "+234 987 654 3210",
  "jobTitle": "Senior Project Manager",
  "department": "Operations",
  "roleId": "role-project-manager",
  "canApproveInvoices": true,
  "approvalLimit": 2000000,
  "status": "active"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Team member updated successfully",
  "data": { /* updated member object */ }
}
```

---

### **5. Delete Team Member**

```http
DELETE /api/team/members/:memberId
```

**Response**:
```json
{
  "success": true,
  "message": "Team member removed successfully"
}
```

---

### **6. Set Delegation**

```http
POST /api/team/members/:memberId/delegate
```

**Request Body**:
```json
{
  "delegateTo": "member-789",
  "startDate": "2025-12-01",
  "endDate": "2025-12-15",
  "reason": "Annual leave"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Delegation set successfully. Delegate will be notified.",
  "data": {
    "delegateTo": "member-789",
    "delegateeName": "Bob Johnson",
    "startDate": "2025-12-01T00:00:00Z",
    "endDate": "2025-12-15T23:59:59Z"
  }
}
```

---

## 🎭 ROLES MANAGEMENT ENDPOINTS

### **7. Get Roles**

```http
GET /api/team/roles
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "role-finance-manager",
      "name": "Finance Manager",
      "description": "Approve invoices and manage finances",
      "isSystemRole": true,
      "canApproveInvoices": true,
      "approvalLimit": null,
      "permissions": {
        "invoices": "approve",
        "expenses": "manage",
        "reports": "view"
      },
      "memberCount": 2
    }
  ]
}
```

---

### **8. Create Custom Role**

```http
POST /api/team/roles
```

**Request Body**:
```json
{
  "name": "Senior Project Manager",
  "description": "Manage multiple projects and approve small invoices",
  "canApproveInvoices": true,
  "approvalLimit": 500000,
  "permissions": {
    "invoices": "create",
    "projects": "manage",
    "reports": "view"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": { /* role object */ }
}
```

---

## 🔄 APPROVAL WORKFLOW ENDPOINTS

### **9. Get Workflows**

```http
GET /api/approvals/workflows
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "workflow-123",
      "name": "Standard Approval",
      "description": "For invoices under ₦1M",
      "isActive": true,
      "isDefault": true,
      "minAmount": 0,
      "maxAmount": 1000000,
      "categories": ["materials", "labor"],
      "autoApproveUnder": 100000,
      "approvalLevels": [
        {
          "level": 1,
          "name": "Project Manager Review",
          "requiredApprovers": 1,
          "approverRoles": ["role-project-manager"],
          "timeoutHours": 24
        },
        {
          "level": 2,
          "name": "Finance Manager Approval",
          "requiredApprovers": 1,
          "approverRoles": ["role-finance-manager"],
          "timeoutHours": 48
        }
      ],
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ]
}
```

---

### **10. Create Workflow**

```http
POST /api/approvals/workflows
```

**Request Body**:
```json
{
  "name": "High-Value Approval",
  "description": "For invoices ≥ ₦1M",
  "isActive": true,
  "isDefault": false,
  "minAmount": 1000000,
  "maxAmount": null,
  "categories": null,
  "approvalLevels": [
    {
      "level": 1,
      "name": "Project Manager Review",
      "requiredApprovers": 1,
      "approverRoles": ["role-project-manager"],
      "timeoutHours": 12
    },
    {
      "level": 2,
      "name": "Finance Manager Approval",
      "requiredApprovers": 1,
      "approverRoles": ["role-finance-manager"],
      "timeoutHours": 24
    },
    {
      "level": 3,
      "name": "Owner Final Approval",
      "requiredApprovers": 1,
      "approverRoles": ["role-owner"],
      "timeoutHours": 48
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Workflow created successfully",
  "data": { /* workflow object */ }
}
```

---

### **11. Update Workflow**

```http
PUT /api/approvals/workflows/:workflowId
```

---

### **12. Delete Workflow**

```http
DELETE /api/approvals/workflows/:workflowId
```

---

## ✅ INVOICE APPROVAL ENDPOINTS

### **13. Get Pending Approvals (For Current User)**

```http
GET /api/approvals/pending
```

**Query Parameters**:
- `sort` (optional): `dueDate`, `amount`, `createdDate`
- `limit` (optional): Number of results (default: 50)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "approval-123",
      "invoice": {
        "id": "invoice-456",
        "invoiceNumber": "INV-2025-001",
        "amount": 850000,
        "currency": "NGN",
        "vendor": {
          "id": "vendor-789",
          "name": "BuildRight Steel Ltd"
        },
        "category": "materials",
        "description": "Steel beams for Phase 2",
        "createdAt": "2025-11-18T10:00:00Z"
      },
      "workflow": {
        "id": "workflow-123",
        "name": "Standard Approval"
      },
      "level": 2,
      "levelName": "Finance Manager Approval",
      "status": "pending",
      "requestedAt": "2025-11-19T08:00:00Z",
      "dueAt": "2025-11-20T08:00:00Z",
      "hoursRemaining": 6,
      "previousApprovals": [
        {
          "level": 1,
          "approver": "John Doe",
          "status": "approved",
          "approvedAt": "2025-11-19T07:30:00Z"
        }
      ]
    }
  ],
  "meta": {
    "total": 3,
    "overdue": 1,
    "dueSoon": 2
  }
}
```

---

### **14. Get Approval History (For Invoice)**

```http
GET /api/approvals/invoices/:invoiceId/history
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "history-1",
      "action": "submitted",
      "actorName": "Jane Smith",
      "actorRole": "Project Manager",
      "level": null,
      "comments": null,
      "previousStatus": null,
      "newStatus": "in_approval",
      "createdAt": "2025-11-18T10:00:00Z"
    },
    {
      "id": "history-2",
      "action": "approved",
      "actorName": "John Doe",
      "actorRole": "Project Manager",
      "level": 1,
      "comments": "Approved - materials needed for Phase 2",
      "previousStatus": "pending",
      "newStatus": "approved",
      "createdAt": "2025-11-19T07:30:00Z"
    }
  ]
}
```

---

### **15. Approve Invoice**

```http
POST /api/approvals/:approvalId/approve
```

**Request Body**:
```json
{
  "comments": "Approved - within budget and necessary for project completion"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Invoice approved successfully",
  "data": {
    "approvalId": "approval-123",
    "status": "approved",
    "respondedAt": "2025-11-19T10:30:00Z",
    "nextLevel": 3,
    "nextLevelName": "Owner Final Approval",
    "nextApprovers": [
      {
        "id": "member-owner",
        "name": "Owner Name",
        "email": "owner@company.com"
      }
    ],
    "invoiceStatus": "in_approval"
  }
}
```

---

### **16. Reject Invoice**

```http
POST /api/approvals/:approvalId/reject
```

**Request Body**:
```json
{
  "comments": "Rejected - vendor pricing is too high. Please renegotiate.",
  "reason": "pricing_issue"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Invoice rejected",
  "data": {
    "approvalId": "approval-123",
    "status": "rejected",
    "respondedAt": "2025-11-19T10:30:00Z",
    "invoiceStatus": "rejected",
    "notified": ["invoice_creator", "project_manager"]
  }
}
```

---

### **17. Delegate Approval**

```http
POST /api/approvals/:approvalId/delegate
```

**Request Body**:
```json
{
  "delegateTo": "member-789",
  "reason": "Out of office"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Approval delegated successfully",
  "data": {
    "approvalId": "approval-123",
    "delegatedTo": {
      "id": "member-789",
      "name": "Bob Johnson",
      "email": "bob@company.com"
    },
    "delegatedAt": "2025-11-19T10:30:00Z"
  }
}
```

---

## 📊 ANALYTICS & REPORTING ENDPOINTS

### **18. Get Approval Statistics**

```http
GET /api/approvals/stats
```

**Query Parameters**:
- `startDate` (optional): ISO date
- `endDate` (optional): ISO date
- `groupBy` (optional): `day`, `week`, `month`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalApprovals": 145,
    "approved": 120,
    "rejected": 15,
    "pending": 10,
    "averageApprovalTime": 18.5,
    "byLevel": [
      {
        "level": 1,
        "name": "Project Manager Review",
        "averageTime": 6.2,
        "approved": 118,
        "rejected": 7
      },
      {
        "level": 2,
        "name": "Finance Manager Approval",
        "averageTime": 12.3,
        "approved": 110,
        "rejected": 8
      }
    ],
    "byApprover": [
      {
        "approver": "John Doe",
        "role": "Project Manager",
        "totalApprovals": 45,
        "approved": 42,
        "rejected": 3,
        "averageTime": 5.8
      }
    ]
  }
}
```

---

### **19. Get Team Activity**

```http
GET /api/team/activity
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "memberId": "member-123",
      "memberName": "John Doe",
      "role": "Finance Manager",
      "lastActive": "2025-11-19T09:15:00Z",
      "approvalsToday": 3,
      "approvalsThisWeek": 12,
      "averageResponseTime": 4.5
    }
  ]
}
```

---

## 🔔 NOTIFICATION ENDPOINTS

### **20. Get Notifications**

```http
GET /api/approvals/notifications
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-123",
      "type": "approval_request",
      "title": "New invoice approval request",
      "message": "Invoice INV-2025-001 (₦850,000) requires your approval",
      "invoiceId": "invoice-456",
      "approvalId": "approval-123",
      "isRead": false,
      "createdAt": "2025-11-19T08:00:00Z"
    }
  ]
}
```

---

### **21. Mark Notification as Read**

```http
PUT /api/approvals/notifications/:notificationId/read
```

---

## 🚨 ERROR RESPONSES

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to approve invoices above ₦1,000,000",
    "details": {
      "invoiceAmount": 1500000,
      "yourLimit": 1000000
    }
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Missing or invalid auth token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `ALREADY_PROCESSED`: Approval already approved/rejected
- `WORKFLOW_NOT_FOUND`: No applicable workflow
- `INSUFFICIENT_PERMISSIONS`: User can't approve this amount
- `DELEGATION_EXPIRED`: Delegation period has ended

---

## 📝 NOTES

1. All timestamps are in ISO 8601 format (UTC)
2. All amounts are in the smallest currency unit (kobo for NGN)
3. Pagination is supported on list endpoints (use `page` and `limit` query params)
4. Rate limiting: 100 requests per minute per user
5. Webhooks available for approval events (separate documentation)

---

**API Version**: 1.0
**Last Updated**: November 19, 2025

