# 🏢 Property Owner API Guide

Complete API documentation for Property Owner dashboard features.

## 🔐 Authentication

All API requests require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get your token by logging in:
```bash
POST /api/auth/login
{
  "email": "john@metro-properties.com",
  "password": "owner123",
  "userType": "owner"
}
```

---

## 📋 **Table of Contents**

1. [Properties API](#properties-api)
2. [Units API](#units-api)
3. [Leases & Tenants API](#leases--tenants-api)
4. [Property Managers API](#property-managers-api)

---

## 🏠 Properties API

### Get All Properties
Get all properties owned by or managed by the current user.

```http
GET /api/properties
```

**Query Parameters:**
- `search` (optional) - Search by name, address, or city
- `status` (optional) - Filter by status: `active`, `inactive`, `maintenance`
- `propertyType` (optional) - Filter by property type

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Sunset Apartments",
    "propertyType": "Apartment Complex",
    "address": "123 Lagos Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria",
    "totalUnits": 24,
    "status": "active",
    "currency": "NGN",
    "occupiedUnits": 20,
    "occupancyRate": 83.33,
    "totalMonthlyIncome": 1200000,
    "_count": {
      "units": 24,
      "leases": 20
    },
    "managers": [...]
  }
]
```

### Get Single Property
Get detailed information about a specific property.

```http
GET /api/properties/:id
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Sunset Apartments",
  "propertyType": "Apartment Complex",
  "address": "123 Lagos Street",
  "city": "Lagos",
  "state": "Lagos",
  "zipCode": "100001",
  "country": "Nigeria",
  "yearBuilt": 2020,
  "totalUnits": 24,
  "floors": 5,
  "totalArea": 5000,
  "parking": 30,
  "currency": "NGN",
  "purchasePrice": 50000000,
  "marketValue": 60000000,
  "avgRent": 50000,
  "status": "active",
  "features": ["Pool", "Gym", "Parking", "Security"],
  "coverImage": "url",
  "images": ["url1", "url2"],
  "description": "Modern apartment complex",
  "owner": {...},
  "units": [...],
  "managers": [...],
  "stats": {
    "totalUnits": 24,
    "occupiedUnits": 20,
    "vacantUnits": 4,
    "maintenanceUnits": 0,
    "totalMonthlyRent": 1200000,
    "activeLeases": 20
  }
}
```

### Create Property
Create a new property (Owner only).

```http
POST /api/properties
```

**Request Body:**
```json
{
  "name": "Sunset Apartments",
  "propertyType": "Apartment Complex",
  "address": "123 Lagos Street",
  "city": "Lagos",
  "state": "Lagos",
  "zipCode": "100001",
  "country": "Nigeria",
  "totalUnits": 24,
  "floors": 5,
  "yearBuilt": 2020,
  "totalArea": 5000,
  "parking": 30,
  "currency": "NGN",
  "purchasePrice": 50000000,
  "marketValue": 60000000,
  "avgRent": 50000,
  "features": ["Pool", "Gym"],
  "unitFeatures": ["AC", "Heating"],
  "insuranceProvider": "ABC Insurance",
  "insurancePolicyNumber": "POL123456",
  "insurancePremium": 500000,
  "insuranceExpiration": "2025-12-31",
  "propertyTaxes": 200000,
  "coverImage": "url",
  "images": ["url1", "url2"],
  "description": "Modern apartment complex",
  "notes": "Additional notes"
}
```

**Response:** `201 Created` - Returns created property object

### Update Property
Update an existing property.

```http
PUT /api/properties/:id
```

**Request Body:** Same as Create (all fields optional)

**Response:** Returns updated property object

### Delete Property
Delete a property (Owner only). Cannot delete properties with active leases.

```http
DELETE /api/properties/:id
```

**Response:**
```json
{
  "message": "Property deleted successfully"
}
```

### Get Property Analytics
Get detailed analytics for a specific property.

```http
GET /api/properties/:id/analytics
```

**Response:**
```json
{
  "overview": {
    "totalUnits": 24,
    "occupiedUnits": 20,
    "vacantUnits": 4,
    "occupancyRate": 83.33,
    "potentialMonthlyIncome": 1440000,
    "actualMonthlyIncome": 1200000,
    "lossFromVacancy": 240000
  },
  "leases": {
    "active": 20,
    "expiringSoon": 3
  },
  "performance": {
    "revenueEfficiency": 83.33
  }
}
```

---

## 🏘️ Units API

### Get Units for Property
Get all units within a property.

```http
GET /api/units/property/:propertyId
```

**Query Parameters:**
- `status` (optional) - Filter by: `vacant`, `occupied`, `maintenance`
- `type` (optional) - Filter by unit type

**Response:**
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid",
    "unitNumber": "A101",
    "type": "2br",
    "floor": 1,
    "bedrooms": 2,
    "bathrooms": 2,
    "size": 850,
    "monthlyRent": 50000,
    "securityDeposit": 100000,
    "status": "occupied",
    "features": ["AC", "Balcony"],
    "images": ["url1"],
    "leases": [{
      "id": "uuid",
      "status": "active",
      "tenant": {...}
    }]
  }
]
```

### Get Single Unit
Get detailed information about a specific unit.

```http
GET /api/units/:id
```

**Response:**
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "unitNumber": "A101",
  "type": "2br",
  "floor": 1,
  "bedrooms": 2,
  "bathrooms": 2,
  "size": 850,
  "monthlyRent": 50000,
  "securityDeposit": 100000,
  "status": "occupied",
  "features": ["AC", "Balcony"],
  "property": {...},
  "leases": [...]
}
```

### Create Unit
Add a new unit to a property.

```http
POST /api/units
```

**Request Body:**
```json
{
  "propertyId": "uuid",
  "unitNumber": "A101",
  "type": "2br",
  "floor": 1,
  "bedrooms": 2,
  "bathrooms": 2,
  "size": 850,
  "monthlyRent": 50000,
  "securityDeposit": 100000,
  "status": "vacant",
  "features": ["AC", "Balcony"],
  "images": ["url1"]
}
```

**Response:** `201 Created` - Returns created unit

### Update Unit
Update an existing unit.

```http
PUT /api/units/:id
```

**Request Body:** Same as Create (all fields optional)

**Response:** Returns updated unit

### Delete Unit
Delete a unit (Owner only). Cannot delete units with active leases.

```http
DELETE /api/units/:id
```

**Response:**
```json
{
  "message": "Unit deleted successfully"
}
```

---

## 📝 Leases & Tenants API

### Get All Leases
Get all leases for your properties.

```http
GET /api/leases
```

**Query Parameters:**
- `propertyId` (optional) - Filter by property
- `status` (optional) - Filter by: `active`, `expired`, `terminated`, `draft`
- `search` (optional) - Search by tenant name or email

**Response:**
```json
[
  {
    "id": "uuid",
    "leaseNumber": "LSE-1234567890",
    "propertyId": "uuid",
    "unitId": "uuid",
    "tenantId": "uuid",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "monthlyRent": 50000,
    "securityDeposit": 100000,
    "currency": "NGN",
    "status": "active",
    "signedAt": "2024-01-01",
    "property": {...},
    "unit": {...},
    "tenant": {
      "id": "uuid",
      "name": "Sarah Johnson",
      "email": "sarah@email.com",
      "phone": "+234-800-1234567",
      "status": "active"
    }
  }
]
```

### Get Single Lease
Get detailed information about a specific lease.

```http
GET /api/leases/:id
```

**Response:** Returns full lease details with property, unit, and tenant information

### Create Lease (with Tenant)
Create a new lease and optionally create a tenant account.

```http
POST /api/leases
```

**Request Body:**
```json
{
  "propertyId": "uuid",
  "unitId": "uuid",
  "tenantName": "Sarah Johnson",
  "tenantEmail": "sarah@email.com",
  "tenantPhone": "+234-800-1234567",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "+234-800-7654321",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "monthlyRent": 50000,
  "securityDeposit": 100000,
  "currency": "NGN",
  "terms": "Standard lease terms...",
  "specialClauses": {...},
  "sendInvitation": true
}
```

**Response:** `201 Created`
```json
{
  "lease": {...},
  "tenant": {...},
  "tempPassword": "tenant123"  // Only if sendInvitation is false
}
```

### Update Lease
Update lease details.

```http
PUT /api/leases/:id
```

**Request Body:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2025-01-01",
  "monthlyRent": 55000,
  "status": "active",
  "terms": "Updated terms..."
}
```

**Response:** Returns updated lease

### Terminate Lease
Terminate an active lease.

```http
POST /api/leases/:id/terminate
```

**Request Body:**
```json
{
  "reason": "Tenant moving out"
}
```

**Response:** Returns terminated lease with updated status

### Get All Tenants
Get list of all tenants.

```http
GET /api/leases/tenants/list
```

**Query Parameters:**
- `search` (optional) - Search by name or email
- `status` (optional) - Filter by status

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Sarah Johnson",
    "email": "sarah@email.com",
    "phone": "+234-800-1234567",
    "status": "active",
    "createdAt": "2024-01-01",
    "tenantLeases": [
      {
        "id": "uuid",
        "property": {...},
        "unit": {...}
      }
    ]
  }
]
```

---

## 👥 Property Managers API

### Get All Managers
Get all managers for your properties (Owner only).

```http
GET /api/property-managers
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Mike Anderson",
    "email": "mike@email.com",
    "phone": "+234-800-1234567",
    "department": "Property Management",
    "status": "active",
    "isActive": true,
    "createdAt": "2024-01-01",
    "managerAssignments": [
      {
        "propertyId": "uuid",
        "property": {...},
        "permissions": {...}
      }
    ]
  }
]
```

### Get Single Manager
Get detailed information about a specific manager.

```http
GET /api/property-managers/:id
```

**Response:** Returns full manager details with all property assignments

### Create Manager
Create a new property manager (Owner only).

```http
POST /api/property-managers
```

**Request Body:**
```json
{
  "name": "Mike Anderson",
  "email": "mike@email.com",
  "phone": "+234-800-1234567",
  "department": "Property Management",
  "specialization": "Residential",
  "commission": 10,
  "permissions": {
    "canApproveMaintenance": true,
    "canModifyRent": false
  },
  "sendInvitation": true
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Mike Anderson",
  "email": "mike@email.com",
  "status": "active",
  "tempPassword": "temp123"  // Only if sendInvitation is false
}
```

### Update Manager
Update manager information.

```http
PUT /api/property-managers/:id
```

**Request Body:**
```json
{
  "name": "Mike Anderson",
  "phone": "+234-800-9999999",
  "permissions": {...},
  "isActive": true
}
```

**Response:** Returns updated manager

### Assign Manager to Property
Assign a manager to manage a specific property.

```http
POST /api/property-managers/:managerId/assign
```

**Request Body:**
```json
{
  "propertyId": "uuid",
  "permissions": {
    "canApproveMaintenance": true,
    "canAccessFinancials": true,
    "canManageTenants": true
  }
}
```

**Response:** `201 Created` - Returns assignment details

### Remove Manager from Property
Remove a manager's access to a property.

```http
DELETE /api/property-managers/:managerId/property/:propertyId
```

**Response:**
```json
{
  "message": "Manager removed from property"
}
```

### Deactivate Manager
Deactivate a manager and remove from all properties.

```http
POST /api/property-managers/:id/deactivate
```

**Response:** Returns deactivated manager object

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

## 🔒 Permission Levels

### Owner Permissions
- ✅ Full CRUD on properties
- ✅ Full CRUD on units
- ✅ Full CRUD on leases/tenants
- ✅ Full CRUD on property managers
- ✅ View all analytics
- ✅ Delete operations

### Manager Permissions
- ✅ View assigned properties
- ✅ CRUD on units (if permitted)
- ✅ CRUD on leases/tenants (if permitted)
- ❌ Cannot create/delete properties
- ❌ Cannot manage other managers
- ❌ Limited to assigned properties only

---

## 🧪 Testing Examples

### Example 1: Create Property and Add Units

```bash
# 1. Login as owner
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@metro-properties.com","password":"owner123","userType":"owner"}'

# Save the token from response

# 2. Create property
curl -X POST http://localhost:5000/api/properties \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Apartment",
    "propertyType": "Apartment Complex",
    "address": "456 New Street",
    "city": "Lagos",
    "state": "Lagos",
    "totalUnits": 10,
    "currency": "NGN"
  }'

# Save the propertyId from response

# 3. Add unit to property
curl -X POST http://localhost:5000/api/units \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "PROPERTY_ID_HERE",
    "unitNumber": "101",
    "type": "2br",
    "bedrooms": 2,
    "bathrooms": 2,
    "monthlyRent": 50000
  }'
```

### Example 2: Create Lease for Tenant

```bash
curl -X POST http://localhost:5000/api/leases \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "PROPERTY_ID",
    "unitId": "UNIT_ID",
    "tenantName": "Jane Doe",
    "tenantEmail": "jane@email.com",
    "tenantPhone": "+234-800-1111111",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "monthlyRent": 50000,
    "securityDeposit": 100000,
    "sendInvitation": true
  }'
```

---

## 🚀 Next Steps

1. **Frontend Integration**: Connect your React components to these APIs
2. **Real-time Updates**: Add WebSocket support for live data
3. **File Uploads**: Implement image/document upload for properties
4. **Payment Processing**: Integrate payment gateway for rent collection
5. **Notifications**: Email/SMS notifications for lease renewals, payments, etc.

---

## 📚 Additional Resources

- [Backend Setup Guide](./BACKEND_SETUP_GUIDE.md)
- [Backend README](./backend/README.md)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## 💡 Tips

1. **Always check occupancy before deleting**: Units and properties with active leases cannot be deleted
2. **Use filters effectively**: API supports search and filtering on most endpoints
3. **Monitor your limits**: Check customer property and user limits before creating new records
4. **Activity logs**: All actions are logged for audit purposes
5. **Soft deletes**: Manager assignments use soft deletes (isActive flag)

---

Ready to connect your Property Owner Dashboard to the database! 🎉


