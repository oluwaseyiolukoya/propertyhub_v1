# 🔐 Permission System Documentation

## Overview

Contrezz uses a **Role-Based Access Control (RBAC)** system where permissions are stored in the database and automatically applied to users based on their assigned roles.

---

## 🎯 How It Works

### 1. **Role Creation**
When a Super Admin creates a new role in the Admin Dashboard:

```
Admin Dashboard → User Management → Add Role
```

- Select a role name (e.g., "Support Staff", "Billing Manager")
- Choose permissions from 45+ available options across 9 categories
- Save the role to the database

### 2. **User Assignment**
When creating or updating an internal user:

```
Admin Dashboard → User Management → Add User
```

- Select a role from the dropdown
- The system automatically assigns all permissions from that role to the user
- Permissions are stored in the `users.permissions` field (JSON array)

### 3. **Login & Authentication**
When a user logs in:

- Backend retrieves the user's stored permissions from the database
- Permissions are included in the JWT token response
- Frontend stores permissions in the user object

### 4. **Dashboard Filtering**
When a user accesses the Admin Dashboard:

- The system checks their permissions
- Only tabs/pages they have access to are displayed
- Navigation is dynamically filtered based on permissions

---

## 📋 Available Permissions

### Dashboard Pages (Main Navigation)
| Permission ID | Description | Required For |
|--------------|-------------|--------------|
| `overview` | Dashboard Overview | Overview tab |
| `customers` | Customer Management Page | Customers tab |
| `users` | User Management Page | Users tab |
| `billing` | Billing & Plans Page | Billing tab |
| `analytics` | Analytics Page | Analytics tab |
| `system` | System Health Page | System tab |
| `support` | Support Tickets Page | Support tab |
| `settings` | Platform Settings Page | Settings tab |

### Customer Management Actions
| Permission ID | Description |
|--------------|-------------|
| `customer_view` | View customer list and details |
| `customer_create` | Create new customers |
| `customer_edit` | Edit customer information |
| `customer_delete` | Delete customers |
| `customer_reset_password` | Reset customer passwords |
| `customer_deactivate` | Activate/deactivate customers |

### User Management Actions
| Permission ID | Description |
|--------------|-------------|
| `user_view` | View internal users |
| `user_create` | Create internal users |
| `user_edit` | Edit user information |
| `user_delete` | Delete users |
| `user_reset_password` | Reset user passwords |

### Role & Permission Management
| Permission ID | Description |
|--------------|-------------|
| `role_view` | View roles |
| `role_create` | Create new roles |
| `role_edit` | Edit role permissions |
| `role_delete` | Delete roles |

### Billing & Plans
| Permission ID | Description |
|--------------|-------------|
| `billing_management` | Manage billing plans |
| `plan_view` | View billing plans |
| `plan_create` | Create new plans |
| `plan_edit` | Edit plan details |
| `plan_delete` | Delete plans |
| `invoice_view` | View invoices |
| `payment_view` | View payment history |

### Analytics & Reports
| Permission ID | Description |
|--------------|-------------|
| `analytics_view` | View analytics dashboard |
| `analytics_mrr` | View MRR analytics |
| `analytics_churn` | View churn analytics |
| `analytics_export` | Export analytics data |

### System & Platform
| Permission ID | Description |
|--------------|-------------|
| `system_health` | View system health metrics |
| `system_logs` | View system logs |
| `platform_settings` | Manage platform settings |
| `cache_clear` | Clear system cache |

### Support & Tickets
| Permission ID | Description |
|--------------|-------------|
| `support_view` | View support tickets |
| `support_create` | Create support tickets |
| `support_respond` | Respond to tickets |
| `support_close` | Close support tickets |
| `support_assign` | Assign tickets to users |

### Audit & Logs
| Permission ID | Description |
|--------------|-------------|
| `activity_logs` | View activity logs |
| `audit_reports` | Generate audit reports |

---

## 🎭 Example Roles

### 1. Support Staff Role
**Permissions:**
- `overview` - Dashboard Overview
- `support` - Support Tickets Page
- `customer_view` - View Customers
- `support_view` - View Support Tickets
- `support_create` - Create Support Tickets
- `support_respond` - Respond to Tickets
- `support_close` - Close Support Tickets

**What they see:**
- Overview tab
- Support tab (only)
- Can view customer info but not edit/delete

---

### 2. Billing Manager Role
**Permissions:**
- `overview` - Dashboard Overview
- `billing` - Billing & Plans Page
- `billing_management` - Manage Billing Plans
- `plan_view` - View Plans
- `plan_create` - Create Plans
- `plan_edit` - Edit Plans
- `invoice_view` - View Invoices
- `payment_view` - View Payments
- `customer_view` - View Customers

**What they see:**
- Overview tab
- Billing tab (only)
- Can manage plans and view invoices
- Can view customer info for billing purposes

---

### 3. Analytics Viewer Role
**Permissions:**
- `overview` - Dashboard Overview
- `analytics` - Analytics Page
- `analytics_view` - View Analytics
- `analytics_mrr` - View MRR Analytics
- `analytics_churn` - View Churn Analytics
- `analytics_export` - Export Analytics Data
- `customer_view` - View Customers

**What they see:**
- Overview tab
- Analytics tab (only)
- Read-only access to reports
- Can export data

---

### 4. System Administrator Role
**Permissions:**
- All dashboard pages
- All system permissions
- `system_health` - View System Health
- `system_logs` - View System Logs
- `platform_settings` - Manage Platform Settings
- `cache_clear` - Clear System Cache

**What they see:**
- All tabs
- Full system access
- Can manage platform settings

---

## 🔧 Technical Implementation

### Frontend

#### 1. Permission Constants (`src/lib/permissions.ts`)
```typescript
export const PERMISSIONS = {
  OVERVIEW: 'overview',
  CUSTOMERS: 'customers',
  USERS: 'users',
  // ... etc
};
```

#### 2. Permission Checking
```typescript
import { hasPermission, getUserPermissions } from '@/lib/permissions';

const userPermissions = getUserPermissions(user);

if (hasPermission(userPermissions, PERMISSIONS.CUSTOMERS)) {
  // Show customers tab
}
```

#### 3. Navigation Filtering (`SuperAdminDashboard.tsx`)
```typescript
const allNavigation = [
  { id: 'overview', name: 'Overview', permission: PERMISSIONS.OVERVIEW },
  { id: 'customers', name: 'Customers', permission: PERMISSIONS.CUSTOMERS },
  // ... etc
];

// Filter based on user permissions
const navigation = allNavigation.filter(item => {
  if (!item.permission) return true;
  return hasPermission(userPermissions, item.permission);
});
```

### Backend

#### 1. User Creation (`backend/src/routes/users.ts`)
```typescript
// When creating a user, permissions are stored in the database
await prisma.users.create({
  data: {
    name,
    email,
    role,
    permissions: rolePermissions, // JSON array
    // ... other fields
  }
});
```

#### 2. Login Response (`backend/src/routes/auth.ts`)
```typescript
// Return permissions with login response
return res.json({
  token,
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: userPermissions, // Array of permission IDs
    rolePermissions: userPermissions, // For compatibility
  }
});
```

#### 3. Permission Updates
When a user's role is changed:
- New permissions are automatically assigned
- User is forced to re-authenticate
- Old session is invalidated

---

## 🧪 Testing the Permission System

### Test 1: Create a Support Staff Role
1. Login as Super Admin
2. Go to **User Management** → **Add Role**
3. Create role with:
   - Name: "Support Staff"
   - Permissions: `overview`, `support`, `customer_view`, `support_view`, `support_respond`
4. Save role

### Test 2: Create a User with Support Staff Role
1. Go to **User Management** → **Add User**
2. Fill in user details
3. Select "Support Staff" role
4. Save user
5. Check console logs - should show permissions being assigned

### Test 3: Login as Support Staff
1. Logout from Super Admin
2. Login with the new Support Staff credentials
3. Verify:
   - ✅ Can see Overview tab
   - ✅ Can see Support tab
   - ❌ Cannot see Customers tab
   - ❌ Cannot see Users tab
   - ❌ Cannot see Billing tab
   - ❌ Cannot see Analytics tab
   - ❌ Cannot see System tab
   - ❌ Cannot see Settings tab

### Test 4: Update User Role
1. Login as Super Admin
2. Go to **User Management**
3. Edit the Support Staff user
4. Change role to "Billing Manager"
5. Save changes
6. User should be forced to re-authenticate
7. After re-login, user should see Billing tab instead of Support tab

---

## 🐛 Troubleshooting

### Issue: User sees all tabs despite limited permissions

**Possible Causes:**
1. User has "Super Admin" or "Admin" role (these get all permissions by default)
2. Permissions not properly saved to database
3. Frontend not properly filtering navigation

**Solution:**
1. Check user's role in database: `SELECT role, permissions FROM users WHERE email = 'user@example.com'`
2. Check console logs during login - should show permissions count
3. Verify `getUserPermissions()` is returning correct array

---

### Issue: User has no permissions after role assignment

**Possible Causes:**
1. Role has no permissions assigned
2. Permissions not passed during user creation
3. Database permissions field is null

**Solution:**
1. Check role in database: `SELECT permissions FROM roles WHERE name = 'Role Name'`
2. Check user in database: `SELECT permissions FROM users WHERE email = 'user@example.com'`
3. Re-assign the role to the user

---

### Issue: Permission changes not taking effect

**Possible Causes:**
1. User hasn't re-authenticated
2. Frontend using cached user object
3. Token not refreshed

**Solution:**
1. Force user to logout and login again
2. Clear browser localStorage
3. Check if backend is returning updated permissions in login response

---

## 📊 Database Schema

### `users` Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  role VARCHAR(255),
  permissions JSON, -- Array of permission IDs
  isActive BOOLEAN DEFAULT TRUE,
  -- ... other fields
);
```

### `roles` Table
```sql
CREATE TABLE roles (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE,
  description TEXT,
  permissions JSON, -- Array of permission IDs
  isActive BOOLEAN DEFAULT TRUE,
  isSystem BOOLEAN DEFAULT FALSE,
  -- ... other fields
);
```

---

## 🔄 Permission Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION FLOW                              │
└─────────────────────────────────────────────────────────────────┘

1. ROLE CREATION
   ┌──────────────┐
   │ Super Admin  │
   │ Creates Role │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │ Select 45+       │
   │ Permissions      │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Save to Database │
   │ (roles table)    │
   └──────────────────┘

2. USER ASSIGNMENT
   ┌──────────────┐
   │ Super Admin  │
   │ Creates User │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │ Select Role      │
   │ (e.g. Support)   │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Copy Role's      │
   │ Permissions      │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Save to Database │
   │ (users table)    │
   └──────────────────┘

3. LOGIN & AUTH
   ┌──────────────┐
   │ User Logs In │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │ Backend Fetches  │
   │ User Permissions │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Return in JWT    │
   │ Response         │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Frontend Stores  │
   │ in User Object   │
   └──────────────────┘

4. DASHBOARD ACCESS
   ┌──────────────────┐
   │ User Opens       │
   │ Dashboard        │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Get User         │
   │ Permissions      │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Filter Navigation│
   │ Based on Perms   │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Show Only        │
   │ Allowed Tabs     │
   └──────────────────┘
```

---

## ✅ Checklist for Implementation

- [x] Permission constants defined in `permissions.ts`
- [x] Permission checking functions (`hasPermission`, `getUserPermissions`)
- [x] Navigation filtering in `SuperAdminDashboard.tsx`
- [x] Backend returns permissions in login response
- [x] Frontend stores permissions in user object
- [x] User creation includes role permissions
- [x] User update includes role permissions
- [x] Role changes force re-authentication
- [x] Permission descriptions in Add Role dialog
- [x] All 45+ permissions mapped to actual features

---

## 🚀 Next Steps

1. **Test the system** with different roles
2. **Create default roles** for common use cases (Support, Billing, Analytics)
3. **Add permission checks** to individual components (buttons, forms, etc.)
4. **Implement backend permission checks** on API routes
5. **Add audit logging** for permission changes

---

## 📞 Support

If you encounter any issues with the permission system:

1. Check the console logs for permission-related messages
2. Verify permissions in the database
3. Ensure user has re-authenticated after role changes
4. Review this documentation for troubleshooting steps

---

**Last Updated:** October 31, 2025
**Version:** 1.0.0


