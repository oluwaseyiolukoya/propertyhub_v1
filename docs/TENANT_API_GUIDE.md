# 🏠 Tenant Portal API Guide

Complete API documentation for Tenant Portal features.

## 🔐 Authentication

All API requests require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get your token by logging in:
```bash
POST /api/auth/login
{
  "email": "tenant@email.com",
  "password": "tenant123",
  "userType": "tenant"
}
```

---

## 📋 **Table of Contents**

1. [Dashboard API](#dashboard-api)
2. [Profile Management API](#profile-management-api)
3. [Lease Information API](#lease-information-api)
4. [Payment API](#payment-api)
5. [Documents API](#documents-api)
6. [Shared APIs](#shared-apis)

---

## 📊 Dashboard API

### Get Dashboard Overview
Get comprehensive dashboard overview for logged-in tenant.

```http
GET /api/tenant/dashboard/overview
```

**Response:**
```json
{
  "hasActiveLease": true,
  "lease": {
    "id": "uuid",
    "leaseNumber": "LSE-1234567890",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "monthlyRent": 50000,
    "securityDeposit": 100000,
    "daysUntilLeaseEnd": 280,
    "isExpiringSoon": false
  },
  "property": {
    "id": "uuid",
    "name": "Sunset Apartments",
    "address": "123 Lagos Street",
    "city": "Lagos",
    "state": "Lagos",
    "coverImage": "url",
    "features": ["Pool", "Gym", "Parking", "Security"]
  },
  "unit": {
    "id": "uuid",
    "unitNumber": "A101",
    "type": "2br",
    "bedrooms": 2,
    "bathrooms": 2,
    "size": 850,
    "features": ["AC", "Balcony"]
  },
  "rent": {
    "monthlyAmount": 50000,
    "daysUntilDue": 15,
    "nextPaymentDue": "2024-02-01",
    "lastPaymentDate": "2024-01-15",
    "isOverdue": false,
    "totalPaidThisYear": 50000
  },
  "maintenance": {
    "pending": 1,
    "recent": [
      {
        "id": "uuid",
        "ticketNumber": "MNT-1234567890",
        "title": "Leaking Faucet",
        "status": "in_progress",
        "priority": "high",
        "createdAt": "2024-01-25"
      }
    ]
  },
  "payments": {
    "recent": [
      {
        "id": "uuid",
        "amount": 50000,
        "paymentDate": "2024-01-15",
        "paymentMethod": "bank_transfer",
        "type": "rent",
        "confirmationNumber": "CONF123"
      }
    ]
  },
  "notifications": {
    "unread": 3,
    "announcements": [
      {
        "id": "uuid",
        "title": "Building Maintenance Notice",
        "message": "Scheduled maintenance on Feb 1st",
        "priority": "medium",
        "createdAt": "2024-01-24"
      }
    ]
  }
}
```

**Note:** If no active lease is found, returns `{ "hasActiveLease": false, "message": "No active lease found" }`

---

## 👤 Profile Management API

### Get Tenant Profile
Get detailed profile information for logged-in tenant.

```http
GET /api/tenant/profile
```

**Response:**
```json
{
  "id": "uuid",
  "email": "tenant@email.com",
  "name": "Sarah Johnson",
  "phone": "+234-800-1234567",
  "status": "active",
  "createdAt": "2023-12-01",
  "avatar": "url",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "+234-800-7654321",
  "preferences": {
    "notifications": {
      "email": true,
      "sms": true,
      "push": true
    },
    "autoPayEnabled": false
  },
  "tenantLeases": [
    {
      "id": "uuid",
      "property": {
        "id": "uuid",
        "name": "Sunset Apartments",
        "address": "123 Lagos Street"
      },
      "unit": {
        "id": "uuid",
        "unitNumber": "A101"
      }
    }
  ]
}
```

### Update Tenant Profile
Update profile information.

```http
PUT /api/tenant/profile
```

**Request Body:**
```json
{
  "name": "Sarah Johnson",
  "phone": "+234-800-1234567",
  "avatar": "url",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "+234-800-7654321",
  "preferences": {
    "notifications": {
      "email": true,
      "sms": true,
      "push": false
    },
    "autoPayEnabled": true
  }
}
```

**Response:** Returns updated profile object (same structure as GET /profile)

### Change Password
Change account password.

```http
POST /api/tenant/change-password
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Validation:**
- New password must be at least 6 characters
- Current password must be correct

**Error Responses:**
- `400` - Missing or invalid fields
- `401` - Current password is incorrect

---

## 📄 Lease Information API

### Get Lease Details
Get detailed information about active lease.

```http
GET /api/tenant/lease
```

**Response:**
```json
{
  "id": "uuid",
  "leaseNumber": "LSE-1234567890",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "monthlyRent": 50000,
  "securityDeposit": 100000,
  "status": "active",
  "signedAt": "2023-12-15",
  "documentUrl": "url_to_lease_pdf",
  "terms": "Standard lease terms...",
  "specialClauses": {...},
  "property": {
    "id": "uuid",
    "name": "Sunset Apartments",
    "address": "123 Lagos Street",
    "city": "Lagos",
    "state": "Lagos",
    "zipCode": "100001",
    "country": "Nigeria",
    "coverImage": "url",
    "features": ["Pool", "Gym", "Parking"],
    "owner": {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@metro-properties.com",
      "phone": "+234-800-9999999"
    }
  },
  "unit": {
    "id": "uuid",
    "unitNumber": "A101",
    "type": "2br",
    "bedrooms": 2,
    "bathrooms": 2,
    "size": 850,
    "features": ["AC", "Balcony", "Hardwood Floors"],
    "images": ["url1", "url2", "url3"]
  }
}
```

**Note:** Returns `404` if no active lease is found

---

## 💳 Payment API

### Get Payment History
Get complete payment history with statistics.

```http
GET /api/tenant/payment-history
```

**Query Parameters:**
- `startDate` (optional) - Filter payments from this date (YYYY-MM-DD)
- `endDate` (optional) - Filter payments until this date (YYYY-MM-DD)
- `status` (optional) - Filter by status: `pending`, `completed`, `failed`

**Response:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "amount": 50000,
      "paymentMethod": "bank_transfer",
      "paymentDate": "2024-01-15",
      "type": "rent",
      "status": "completed",
      "confirmationNumber": "CONF-ABC123",
      "transactionId": "TXN-1234567890",
      "lateFeesIncluded": 0,
      "notes": null
    },
    {
      "id": "uuid",
      "amount": 100000,
      "paymentMethod": "card",
      "paymentDate": "2024-01-01",
      "type": "deposit",
      "status": "completed",
      "confirmationNumber": "CONF-XYZ789",
      "transactionId": "TXN-0987654321",
      "lateFeesIncluded": 0,
      "notes": "Security deposit"
    }
  ],
  "statistics": {
    "totalPaid": 150000,
    "totalLateFees": 0,
    "paymentCount": 2
  }
}
```

### Submit Payment
Submit a new payment.

```http
POST /api/tenant/submit-payment
```

**Request Body:**
```json
{
  "amount": 50000,
  "paymentMethod": "bank_transfer",
  "type": "rent",
  "notes": "January 2024 rent payment"
}
```

**Payment Methods:**
- `bank_transfer`
- `card`
- `debit_card`
- `mobile_money`
- `cash`
- `check`

**Payment Types:**
- `rent`
- `deposit`
- `late_fee`
- `utility`
- `other`

**Response:** `201 Created`
```json
{
  "payment": {
    "id": "uuid",
    "amount": 50000,
    "paymentMethod": "bank_transfer",
    "paymentDate": "2024-01-25",
    "type": "rent",
    "status": "completed",
    "confirmationNumber": "CONF-ABC123",
    "transactionId": "TXN-1234567890"
  },
  "message": "Payment submitted successfully"
}
```

**Note:** In production, this endpoint would integrate with a payment gateway (Stripe, PayStack, etc.) to process actual payments.

---

## 📁 Documents API

### Get All Documents
Get all documents related to tenant's lease.

```http
GET /api/tenant/documents
```

**Response:**
```json
{
  "lease": {
    "id": "uuid",
    "leaseNumber": "LSE-1234567890",
    "documentUrl": "url_to_lease_pdf",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "receipts": [
    {
      "id": "uuid",
      "type": "receipt",
      "name": "Payment Receipt - 2024-01-15",
      "date": "2024-01-15",
      "amount": 50000,
      "confirmationNumber": "CONF-ABC123"
    }
  ],
  "documents": [
    {
      "id": "uuid",
      "name": "Building Rules and Regulations",
      "category": "policy",
      "url": "url_to_document",
      "createdAt": "2024-01-01"
    },
    {
      "id": "uuid",
      "name": "Maintenance Schedule - February 2024",
      "category": "announcement",
      "url": "url_to_document",
      "createdAt": "2024-01-20"
    }
  ]
}
```

**Document Categories:**
- `lease` - Lease agreement
- `receipt` - Payment receipts
- `policy` - Building policies and rules
- `announcement` - Announcements and notices
- `report` - Inspection reports
- `other` - Other documents

---

## 🔄 Shared APIs

Tenants also have access to these shared APIs:

### Maintenance Requests API
```http
GET /api/maintenance
POST /api/maintenance
GET /api/maintenance/:id
PUT /api/maintenance/:id
```

Tenants can:
- ✅ View their own maintenance requests
- ✅ Create new maintenance requests
- ✅ Update their maintenance requests (add notes)
- ❌ Cannot assign or complete requests (manager only)

**Example - Submit Maintenance Request:**
```bash
POST /api/maintenance
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

### Notifications API
```http
GET /api/notifications
GET /api/notifications/unread/count
PUT /api/notifications/:id/read
POST /api/notifications/mark-all-read
DELETE /api/notifications/:id
```

Tenants can:
- ✅ View their notifications
- ✅ Mark notifications as read
- ✅ Delete notifications
- ❌ Cannot send notifications (manager/owner only)

**Example - Get Unread Notifications:**
```bash
GET /api/notifications?status=unread
```

---

## 📊 Common Response Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid data |
| `401` | Unauthorized - Invalid or missing token |
| `403` | Forbidden - Tenant access only |
| `404` | Not Found - Resource doesn't exist |
| `500` | Internal Server Error |

---

## 🔒 Security & Privacy

### What Tenants Can Access:
- ✅ Their own lease information
- ✅ Their own payment history
- ✅ Their own maintenance requests
- ✅ Property information (where they live)
- ✅ Their own profile and settings
- ✅ Documents related to their lease

### What Tenants CANNOT Access:
- ❌ Other tenants' information
- ❌ Other units in the property
- ❌ Owner's financial data
- ❌ Manager assignments
- ❌ Other tenants' payments
- ❌ Property-wide financial reports

---

## 🧪 Testing Examples

### Example 1: Tenant Checks Dashboard

```bash
# 1. Login as tenant
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tenant@email.com",
    "password": "tenant123",
    "userType": "tenant"
  }'

# Save the token from response

# 2. Get dashboard overview
curl http://localhost:5000/api/tenant/dashboard/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 2: Submit Rent Payment

```bash
# Submit payment
curl -X POST http://localhost:5000/api/tenant/submit-payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "paymentMethod": "bank_transfer",
    "type": "rent",
    "notes": "January 2024 rent"
  }'
```

### Example 3: Report Maintenance Issue

```bash
curl -X POST http://localhost:5000/api/maintenance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "PROPERTY_ID",
    "unitId": "UNIT_ID",
    "title": "AC Not Working",
    "description": "Air conditioner stopped working yesterday",
    "category": "hvac",
    "priority": "high",
    "images": []
  }'
```

### Example 4: Update Profile

```bash
curl -X PUT http://localhost:5000/api/tenant/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Johnson",
    "phone": "+234-800-1234567",
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "+234-800-9999999",
    "preferences": {
      "notifications": {
        "email": true,
        "sms": true
      }
    }
  }'
```

### Example 5: View Payment History

```bash
# Get all payments
curl http://localhost:5000/api/tenant/payment-history \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get payments for specific date range
curl "http://localhost:5000/api/tenant/payment-history?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 6: Get Lease Details

```bash
curl http://localhost:5000/api/tenant/lease \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 7: Change Password

```bash
curl -X POST http://localhost:5000/api/tenant/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpass123",
    "newPassword": "newpass456"
  }'
```

---

## 🚀 Tenant Portal Features

### Dashboard
- 📊 Quick overview of rent status
- 🏠 Unit and property information
- 💰 Upcoming payment due date
- 🔧 Pending maintenance requests
- 📢 Recent announcements
- 📅 Lease expiration countdown

### Payments
- 💳 Submit rent payments online
- 📜 View complete payment history
- 🧾 Download payment receipts
- 📊 Payment statistics (YTD totals)
- ⚠️ Overdue payment alerts

### Maintenance
- 🔧 Submit maintenance requests
- 📸 Upload photos of issues
- ⏱️ Track request status
- 🎯 Set priority levels
- 📝 Add notes and updates

### Documents
- 📄 Access lease agreement
- 🧾 Download payment receipts
- 📋 View building policies
- 📢 Read announcements
- 📁 Organized by category

### Profile
- 👤 Update personal information
- 📞 Manage emergency contacts
- 🔔 Notification preferences
- 🔐 Change password
- ⚙️ Auto-pay settings

---

## 💡 Tips for Tenants

1. **Pay On Time**: Submit payments before the due date to avoid late fees
2. **Report Issues Promptly**: Submit maintenance requests as soon as problems arise
3. **Keep Records**: Download payment receipts for your records
4. **Update Contact Info**: Keep your phone and emergency contact up to date
5. **Read Announcements**: Check notifications regularly for important updates
6. **Lease Renewal**: Monitor lease expiration date (dashboard shows countdown)
7. **Document Issues**: Take photos when submitting maintenance requests

---

## 📞 Support

If you encounter issues with the tenant portal:

1. **Technical Support**: Contact your property manager through the portal
2. **Payment Issues**: Submit a support ticket with payment details
3. **Account Access**: Use password reset or contact property management
4. **Maintenance Emergencies**: Call emergency number (shown in lease)

---

## 🎯 Upcoming Features

- 🔄 Auto-pay setup for recurring rent
- 📱 Mobile app with push notifications
- 💬 In-app messaging with property manager
- 📅 Maintenance appointment scheduling
- 🎫 Guest pass requests
- 📦 Package delivery notifications
- 🚗 Parking space management

---

## 📚 Additional Resources

- [Property Owner API Guide](./PROPERTY_OWNER_API_GUIDE.md)
- [Property Manager API Guide](./PROPERTY_MANAGER_API_GUIDE.md)
- [Backend Setup Guide](./BACKEND_SETUP_GUIDE.md)
- [Database Schema](./backend/prisma/schema.prisma)

---

Ready to use your Tenant Portal! 🏠✨


