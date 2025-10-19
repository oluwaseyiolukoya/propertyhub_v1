# 🏢 Property Manager API Guide

Complete API documentation for Property Manager dashboard features.

## 🔐 Authentication

All API requests require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get your token by logging in:
```bash
POST /api/auth/login
{
  "email": "manager@email.com",
  "password": "manager123",
  "userType": "manager"
}
```

---

## 📋 **Table of Contents**

1. [Maintenance Requests API](#maintenance-requests-api)
2. [Payments API](#payments-api)
3. [Access Control/Keycards API](#access-control--keycards-api)
4. [Notifications API](#notifications-api)
5. [Dashboard Analytics API](#dashboard-analytics-api)
6. [Shared APIs](#shared-apis)

---

## 🔧 Maintenance Requests API

### Get All Maintenance Requests
Get all maintenance requests for properties you manage.

```http
GET /api/maintenance
```

**Query Parameters:**
- `propertyId` (optional) - Filter by property
- `status` (optional) - Filter by: `open`, `in_progress`, `completed`, `cancelled`
- `priority` (optional) - Filter by: `low`, `medium`, `high`, `urgent`
- `category` (optional) - Filter by category (e.g., plumbing, electrical, hvac)
- `search` (optional) - Search by title, description, or ticket number

**Response:**
```json
[
  {
    "id": "uuid",
    "ticketNumber": "MNT-1234567890",
    "propertyId": "uuid",
    "unitId": "uuid",
    "title": "Leaking Faucet",
    "description": "Kitchen faucet is leaking",
    "category": "plumbing",
    "priority": "high",
    "status": "open",
    "images": ["url1", "url2"],
    "preferredSchedule": "2024-02-01T10:00:00Z",
    "scheduledDate": null,
    "estimatedCost": 150,
    "actualCost": null,
    "reportedById": "uuid",
    "assignedToId": null,
    "createdAt": "2024-01-25",
    "completedAt": null,
    "property": {...},
    "unit": {...},
    "reportedBy": {...},
    "assignedTo": null
  }
]
```

### Get Single Maintenance Request
Get detailed information about a specific maintenance request.

```http
GET /api/maintenance/:id
```

**Response:** Returns full maintenance request details with update history

### Create Maintenance Request
Create a new maintenance request.

```http
POST /api/maintenance
```

**Request Body:**
```json
{
  "propertyId": "uuid",
  "unitId": "uuid",
  "title": "Leaking Faucet",
  "description": "Kitchen faucet is leaking constantly",
  "category": "plumbing",
  "priority": "high",
  "images": ["url1", "url2"],
  "preferredSchedule": "2024-02-01T10:00:00Z"
}
```

**Response:** `201 Created` - Returns created maintenance request

### Update Maintenance Request
Update maintenance request details.

```http
PUT /api/maintenance/:id
```

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "urgent",
  "assignedToId": "uuid",
  "scheduledDate": "2024-02-01T14:00:00Z",
  "estimatedCost": 200,
  "notes": "Parts ordered",
  "updateNote": "Scheduled for tomorrow afternoon"
}
```

**Response:** Returns updated maintenance request

### Assign Maintenance Request
Assign a maintenance request to a user/vendor.

```http
POST /api/maintenance/:id/assign
```

**Request Body:**
```json
{
  "assignedToId": "uuid",
  "notes": "Assigned to John from ABC Plumbing"
}
```

**Response:** Returns updated maintenance request with assigned user details

### Complete Maintenance Request
Mark a maintenance request as completed.

```http
POST /api/maintenance/:id/complete
```

**Request Body:**
```json
{
  "actualCost": 175,
  "completionNotes": "Replaced faucet cartridge. Issue resolved."
}
```

**Response:** Returns completed maintenance request

### Get Maintenance Statistics
Get maintenance statistics for your properties.

```http
GET /api/maintenance/stats/overview?propertyId=uuid
```

**Response:**
```json
{
  "total": 45,
  "open": 12,
  "inProgress": 8,
  "completed": 23,
  "overdue": 2,
  "byCategory": [
    { "category": "plumbing", "count": 15 },
    { "category": "electrical", "count": 10 }
  ],
  "byPriority": [
    { "priority": "urgent", "count": 3 },
    { "priority": "high", "count": 9 }
  ],
  "avgResolutionDays": 3.5
}
```

---

## 💰 Payments API

### Get All Payments
Get all payments for properties you manage.

```http
GET /api/payments
```

**Query Parameters:**
- `propertyId` (optional) - Filter by property
- `leaseId` (optional) - Filter by lease
- `status` (optional) - Filter by: `pending`, `completed`, `failed`, `refunded`
- `method` (optional) - Filter by payment method
- `startDate` (optional) - Start date filter
- `endDate` (optional) - End date filter
- `search` (optional) - Search by transaction ID or confirmation number

**Response:**
```json
[
  {
    "id": "uuid",
    "leaseId": "uuid",
    "transactionId": "TXN-1234567890",
    "amount": 50000,
    "paymentMethod": "bank_transfer",
    "paymentDate": "2024-01-15",
    "type": "rent",
    "status": "completed",
    "confirmationNumber": "CONF123",
    "lateFeesIncluded": 0,
    "notes": null,
    "processedById": "uuid",
    "lease": {
      "tenant": {...},
      "property": {...},
      "unit": {...}
    }
  }
]
```

### Get Single Payment
Get detailed information about a specific payment.

```http
GET /api/payments/:id
```

**Response:** Returns full payment details with lease, tenant, and property information

### Create Payment
Record a new payment.

```http
POST /api/payments
```

**Request Body:**
```json
{
  "leaseId": "uuid",
  "amount": 50000,
  "paymentMethod": "bank_transfer",
  "paymentDate": "2024-01-15",
  "type": "rent",
  "confirmationNumber": "CONF123",
  "lateFeesIncluded": 0,
  "notes": "Payment for January 2024"
}
```

**Response:** `201 Created` - Returns created payment

### Update Payment
Update payment details (Manager/Owner only).

```http
PUT /api/payments/:id
```

**Request Body:**
```json
{
  "status": "completed",
  "confirmationNumber": "UPDATED-CONF",
  "notes": "Payment confirmed"
}
```

**Response:** Returns updated payment

### Get Payment Statistics
Get payment statistics for your properties.

```http
GET /api/payments/stats/overview?propertyId=uuid&startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "totalCollected": 1500000,
  "pendingAmount": 200000,
  "lateFees": 15000,
  "byMethod": [
    { "method": "bank_transfer", "amount": 800000, "count": 16 },
    { "method": "card", "amount": 700000, "count": 14 }
  ],
  "byType": [
    { "type": "rent", "amount": 1400000, "count": 28 },
    { "type": "deposit", "amount": 100000, "count": 2 }
  ],
  "recentPayments": [...]
}
```

### Get Overdue Payments
Get list of overdue payments.

```http
GET /api/payments/overdue/list?propertyId=uuid
```

**Response:**
```json
[
  {
    "leaseId": "uuid",
    "tenant": {...},
    "property": {...},
    "unit": {...},
    "monthlyRent": 50000,
    "lastPaymentDate": "2023-12-15",
    "daysSincePayment": 45,
    "isOverdue": true,
    "estimatedOverdueAmount": 50000
  }
]
```

---

## 🔐 Access Control / Keycards API

### Get All Keycards
Get all keycards for properties you manage.

```http
GET /api/access-control/keycards
```

**Query Parameters:**
- `propertyId` (optional) - Filter by property
- `status` (optional) - Filter by: `active`, `inactive`, `suspended`, `lost`, `expired`
- `search` (optional) - Search by card number or assignee name

**Response:**
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "unitId": "uuid",
    "cardNumber": "KEY-1234567890-ABC123",
    "cardType": "physical",
    "accessLevel": "tenant",
    "status": "active",
    "validFrom": "2024-01-01",
    "validUntil": "2024-12-31",
    "accessZones": ["building_entrance", "unit_101", "parking"],
    "assignedToId": "uuid",
    "issuedById": "uuid",
    "deactivatedAt": null,
    "notes": null,
    "property": {...},
    "unit": {...},
    "assignedTo": {...}
  }
]
```

### Get Single Keycard
Get detailed information about a specific keycard with access logs.

```http
GET /api/access-control/keycards/:id
```

**Response:** Returns full keycard details with recent access logs

### Create Keycard
Issue a new keycard.

```http
POST /api/access-control/keycards
```

**Request Body:**
```json
{
  "propertyId": "uuid",
  "unitId": "uuid",
  "assignedToId": "uuid",
  "cardType": "physical",
  "accessLevel": "tenant",
  "validFrom": "2024-01-01",
  "validUntil": "2024-12-31",
  "accessZones": ["building_entrance", "unit_101", "parking"],
  "notes": "Primary tenant keycard"
}
```

**Response:** `201 Created` - Returns created keycard with auto-generated card number

### Update Keycard
Update keycard details or permissions.

```http
PUT /api/access-control/keycards/:id
```

**Request Body:**
```json
{
  "status": "active",
  "accessLevel": "tenant",
  "validUntil": "2025-01-01",
  "accessZones": ["building_entrance", "unit_101", "parking", "gym"],
  "notes": "Access extended to gym"
}
```

**Response:** Returns updated keycard

### Deactivate Keycard
Deactivate a keycard (lost, stolen, tenant moved out).

```http
POST /api/access-control/keycards/:id/deactivate
```

**Request Body:**
```json
{
  "reason": "Tenant moved out"
}
```

**Response:** Returns deactivated keycard

### Get Access Logs
Get access logs for monitoring property access.

```http
GET /api/access-control/access-logs
```

**Query Parameters:**
- `propertyId` (optional) - Filter by property
- `keycardId` (optional) - Filter by keycard
- `startDate` (optional) - Start date filter
- `endDate` (optional) - End date filter
- `accessResult` (optional) - Filter by: `granted`, `denied`

**Response:**
```json
[
  {
    "id": "uuid",
    "keycardId": "uuid",
    "accessPoint": "building_entrance",
    "accessTime": "2024-01-25T08:30:00Z",
    "accessResult": "granted",
    "denialReason": null,
    "keycard": {
      "cardNumber": "KEY-1234567890-ABC123",
      "property": {...},
      "assignedTo": {...}
    }
  }
]
```

### Get Access Control Statistics
Get access control statistics for your properties.

```http
GET /api/access-control/stats/overview?propertyId=uuid
```

**Response:**
```json
{
  "totalKeycards": 85,
  "activeKeycards": 72,
  "expiringSoon": 5,
  "suspended": 3,
  "byType": [
    { "type": "physical", "count": 60 },
    { "type": "digital", "count": 25 }
  ],
  "byAccessLevel": [
    { "level": "tenant", "count": 65 },
    { "level": "staff", "count": 15 },
    { "level": "visitor", "count": 5 }
  ],
  "recentActivity24h": 245,
  "failedAttempts24h": 3
}
```

---

## 📬 Notifications API

### Get All Notifications
Get all notifications for current user.

```http
GET /api/notifications
```

**Query Parameters:**
- `status` (optional) - Filter by: `unread`, `read`, `archived`
- `type` (optional) - Filter by notification type
- `priority` (optional) - Filter by: `low`, `medium`, `high`, `urgent`

**Response:**
```json
[
  {
    "id": "uuid",
    "recipientId": "uuid",
    "senderId": "uuid",
    "title": "New Maintenance Request",
    "message": "A new maintenance request has been submitted for Unit 101",
    "type": "maintenance",
    "priority": "high",
    "status": "unread",
    "channels": ["in_app", "email"],
    "propertyId": "uuid",
    "metadata": {...},
    "readAt": null,
    "createdAt": "2024-01-25",
    "sender": {...}
  }
]
```

### Get Unread Count
Get count of unread notifications.

```http
GET /api/notifications/unread/count
```

**Response:**
```json
{
  "count": 12
}
```

### Create Notification
Send notifications to users (Manager/Owner only).

```http
POST /api/notifications
```

**Request Body:**
```json
{
  "recipientIds": ["uuid1", "uuid2"],
  "title": "Rent Payment Reminder",
  "message": "Your rent payment for February is due on Feb 1st",
  "type": "payment_reminder",
  "priority": "medium",
  "channels": ["in_app", "email", "sms"],
  "propertyId": "uuid",
  "metadata": {
    "dueDate": "2024-02-01",
    "amount": 50000
  }
}
```

**Response:** `201 Created` - Returns array of created notifications

### Mark Notification as Read
Mark a specific notification as read.

```http
PUT /api/notifications/:id/read
```

**Response:** Returns updated notification

### Mark All as Read
Mark all notifications as read.

```http
POST /api/notifications/mark-all-read
```

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

### Delete Notification
Delete a notification.

```http
DELETE /api/notifications/:id
```

**Response:**
```json
{
  "message": "Notification deleted"
}
```

### Get Notification Templates
Get available notification templates.

```http
GET /api/notifications/templates
```

**Response:**
```json
[
  {
    "id": "uuid",
    "customerId": "uuid",
    "name": "Rent Payment Reminder",
    "description": "Remind tenants about upcoming rent payment",
    "subject": "Rent Payment Due",
    "body": "Dear {{tenant_name}}, your rent of {{amount}} is due on {{due_date}}",
    "type": "payment_reminder",
    "variables": ["tenant_name", "amount", "due_date"],
    "isGlobal": false
  }
]
```

### Create Notification Template
Create a custom notification template.

```http
POST /api/notifications/templates
```

**Request Body:**
```json
{
  "name": "Maintenance Completion",
  "description": "Notify tenant when maintenance is completed",
  "subject": "Maintenance Request Completed",
  "body": "Dear {{tenant_name}}, the maintenance request for {{issue}} has been completed.",
  "type": "maintenance_update",
  "variables": ["tenant_name", "issue", "completion_date"]
}
```

**Response:** `201 Created` - Returns created template

### Get Notification Statistics
Get notification statistics.

```http
GET /api/notifications/stats/overview
```

**Response:**
```json
{
  "sent": 45,
  "received": 78,
  "unread": 12,
  "byType": [
    { "type": "maintenance", "count": 20 },
    { "type": "payment_reminder", "count": 15 }
  ]
}
```

---

## 📊 Dashboard Analytics API

### Get Manager Dashboard Overview
Get comprehensive dashboard overview for property managers.

```http
GET /api/dashboard/manager/overview?propertyId=uuid
```

**Response:**
```json
{
  "properties": {
    "total": 3,
    "properties": [
      {
        "id": "uuid",
        "name": "Sunset Apartments",
        "totalUnits": 24,
        "activeLeases": 20
      }
    ]
  },
  "units": {
    "total": 60,
    "occupied": 52,
    "vacant": 8,
    "occupancyRate": 86.7
  },
  "leases": {
    "active": 52,
    "expiringSoon": 5
  },
  "revenue": {
    "currentMonth": 2600000
  },
  "maintenance": {
    "open": 8,
    "urgent": 2
  },
  "recentActivities": [...],
  "upcomingTasks": {
    "leaseRenewals": 5,
    "scheduledMaintenance": 3
  }
}
```

### Get Property Performance
Get detailed performance metrics for a specific property.

```http
GET /api/dashboard/manager/property-performance?propertyId=uuid&period=30
```

**Query Parameters:**
- `propertyId` (required) - Property to analyze
- `period` (optional) - Number of days to analyze (default: 30)

**Response:**
```json
{
  "property": {
    "id": "uuid",
    "name": "Sunset Apartments",
    "totalUnits": 24,
    "activeLeases": 20
  },
  "revenue": {
    "total": 1200000,
    "payments": [
      { "amount": 50000, "date": "2024-01-15" },
      { "amount": 50000, "date": "2024-01-20" }
    ]
  },
  "maintenance": {
    "total": 12,
    "byStatus": {
      "open": 3,
      "inProgress": 4,
      "completed": 5
    },
    "byPriority": {
      "urgent": 1,
      "high": 3,
      "medium": 6,
      "low": 2
    }
  },
  "occupancy": {
    "rate": 83.3,
    "occupied": 20,
    "total": 24,
    "vacant": 4
  }
}
```

### Get Owner Dashboard Overview
Get comprehensive dashboard overview for property owners.

```http
GET /api/dashboard/owner/overview
```

**Response:**
```json
{
  "portfolio": {
    "totalProperties": 5,
    "totalValue": 250000000,
    "totalUnits": 120,
    "occupiedUnits": 105,
    "occupancyRate": 87.5
  },
  "revenue": {
    "currentMonth": 5250000,
    "lastMonth": 5100000,
    "yearToDate": 15750000,
    "monthOverMonth": 2.94
  },
  "operations": {
    "activeManagers": 3,
    "pendingMaintenance": 15,
    "expiringLeases": 8
  },
  "properties": [...]
}
```

---

## 🔄 Shared APIs

Property Managers also have access to these shared APIs:

### Properties API
- `GET /api/properties` - View assigned properties
- `GET /api/properties/:id` - View property details
- `GET /api/properties/:id/analytics` - View property analytics
- (No create/delete permissions)

### Units API
- `GET /api/units/property/:propertyId` - View units
- `GET /api/units/:id` - View unit details
- `POST /api/units` - Create unit (if permitted)
- `PUT /api/units/:id` - Update unit (if permitted)

### Leases API
- `GET /api/leases` - View leases for assigned properties
- `GET /api/leases/:id` - View lease details
- `POST /api/leases` - Create lease (if permitted)
- `PUT /api/leases/:id` - Update lease (if permitted)
- `POST /api/leases/:id/terminate` - Terminate lease (if permitted)
- `GET /api/leases/tenants/list` - View tenants

---

## 📊 Common Response Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid data |
| `401` | Unauthorized - Invalid or missing token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `500` | Internal Server Error |

---

## 🔒 Permission System

### Property Manager Access Levels

Managers only have access to properties they are assigned to. Access can be customized per property with permissions like:

```json
{
  "canApproveMaintenance": true,
  "canAccessFinancials": true,
  "canManageTenants": true,
  "canModifyRent": false,
  "canIssueKeycards": true
}
```

### Access Verification

All API endpoints automatically verify:
1. User is authenticated (valid JWT token)
2. User role has permission to access endpoint
3. User has access to specific property/unit/lease
4. User has specific permission for operation (if applicable)

---

## 🧪 Testing Examples

### Example 1: Manager Views Their Properties

```bash
# 1. Login as manager
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@email.com",
    "password": "manager123",
    "userType": "manager"
  }'

# 2. Get assigned properties
curl http://localhost:5000/api/properties \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get dashboard overview
curl http://localhost:5000/api/dashboard/manager/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 2: Handle Maintenance Request

```bash
# 1. View maintenance requests
curl http://localhost:5000/api/maintenance?status=open&priority=high \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Assign maintenance request
curl -X POST http://localhost:5000/api/maintenance/REQUEST_ID/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedToId": "VENDOR_ID",
    "notes": "Assigned to ABC Plumbing"
  }'

# 3. Complete maintenance
curl -X POST http://localhost:5000/api/maintenance/REQUEST_ID/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualCost": 175,
    "completionNotes": "Replaced faucet. Issue resolved."
  }'
```

### Example 3: Record Payment

```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaseId": "LEASE_ID",
    "amount": 50000,
    "paymentMethod": "bank_transfer",
    "paymentDate": "2024-01-15",
    "type": "rent",
    "confirmationNumber": "CONF123"
  }'
```

### Example 4: Issue Keycard

```bash
curl -X POST http://localhost:5000/api/access-control/keycards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "PROPERTY_ID",
    "unitId": "UNIT_ID",
    "assignedToId": "TENANT_ID",
    "cardType": "physical",
    "accessLevel": "tenant",
    "validFrom": "2024-01-01",
    "validUntil": "2024-12-31",
    "accessZones": ["building_entrance", "unit_101", "parking"]
  }'
```

### Example 5: Send Notification

```bash
curl -X POST http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientIds": ["TENANT_ID_1", "TENANT_ID_2"],
    "title": "Scheduled Maintenance Notice",
    "message": "Building water will be shut off tomorrow from 9 AM to 12 PM for maintenance.",
    "type": "announcement",
    "priority": "high",
    "channels": ["in_app", "email"],
    "propertyId": "PROPERTY_ID"
  }'
```

---

## 🚀 Next Steps

1. **Frontend Integration**: Connect React components to these APIs
2. **Real-time Updates**: Add WebSocket support for live notifications
3. **Mobile App**: Create mobile app for managers on-the-go
4. **Reporting**: Generate PDF reports for maintenance, payments
5. **Analytics**: Advanced analytics and insights

---

## 📚 Additional Resources

- [Property Owner API Guide](./PROPERTY_OWNER_API_GUIDE.md)
- [Backend Setup Guide](./BACKEND_SETUP_GUIDE.md)
- [Database Schema](./backend/prisma/schema.prisma)

---

## 💡 Tips for Property Managers

1. **Use Dashboard API**: Get overview data with single request
2. **Filter Effectively**: Use query parameters to find specific records
3. **Monitor Maintenance**: Check urgent maintenance requests daily
4. **Track Payments**: Review overdue payments list regularly
5. **Audit Access**: Review access logs for security
6. **Batch Notifications**: Send bulk notifications for announcements
7. **Document Everything**: Add notes to maintenance requests and payments

---

Ready to connect your Property Manager Dashboard to the database! 🎉


