# Public Admin User Management Module

## 🎯 Overview

A comprehensive User Management module for Public Admin that allows administrators to manage multiple users and control their access to different pages/modules within the Public Admin interface.

## 🏗️ Architecture

### Database Schema

The `public_admins` table has been extended with a `pagePermissions` field:

```prisma
model public_admins {
  id             String    @id @default(uuid())
  email          String    @unique
  name           String
  password       String    // bcrypt hashed
  role           String    @default("editor") // "admin", "editor", "viewer"
  isActive       Boolean   @default(true)
  pagePermissions Json?    // Array of page IDs user can access
  lastLogin      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

### Page Permissions System

**Available Pages:**
- `dashboard` - Dashboard overview
- `landing-pages` - Landing page management
- `careers` - Career postings management
- `blog` - Blog post management (future)
- `forms` - Form submissions
- `analytics` - Analytics dashboard
- `users` - User management (admin only)
- `settings` - Platform settings (admin only)

**Permission Logic:**
- If `pagePermissions` is `null` or empty array → User has access to ALL pages (default)
- If `pagePermissions` contains specific pages → User only has access to those pages
- Admin role always has access to all pages regardless of permissions

### Backend API

#### User Management Routes (`/api/admin/users`)

**List Users**
```
GET /api/admin/users?role=admin&isActive=true&search=john
```

**Get User Details**
```
GET /api/admin/users/:id
```

**Create User**
```
POST /api/admin/users
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword",
  "role": "editor",
  "pagePermissions": ["dashboard", "landing-pages", "careers"]
}
```

**Update User**
```
PUT /api/admin/users/:id
{
  "name": "John Doe Updated",
  "email": "newemail@example.com",
  "role": "editor",
  "isActive": true,
  "pagePermissions": ["dashboard", "careers"]
}
```

**Change Password**
```
PUT /api/admin/users/:id/password
{
  "newPassword": "newsecurepassword"
}
```

**Activate User**
```
PUT /api/admin/users/:id/activate
```

**Deactivate User**
```
PUT /api/admin/users/:id/deactivate
```

**Delete User**
```
DELETE /api/admin/users/:id
```

**Get User Permissions**
```
GET /api/admin/users/:id/permissions
```

**Update User Permissions**
```
PUT /api/admin/users/:id/permissions
{
  "pagePermissions": ["dashboard", "landing-pages", "careers"]
}
```

### Frontend Components

#### 1. UserManagement Component
**Location:** `src/components/public-admin/users/UserManagement.tsx`

**Features:**
- List all admin users with search and filters
- Create new users
- Edit existing users
- Activate/Deactivate users
- Delete users
- Manage page permissions per user
- Role-based access control (only admins can manage users)

#### 2. UserFormModal Component
**Location:** `src/components/public-admin/users/UserFormModal.tsx`

**Features:**
- Create new user form
- Edit existing user form
- Password management (optional for updates)
- Role selection (admin, editor, viewer)

#### 3. UserPermissionsModal Component
**Location:** `src/components/public-admin/users/UserPermissionsModal.tsx`

**Features:**
- Visual permission selector
- Select/Deselect all permissions
- Page descriptions
- Admin-only pages (users, settings) are disabled for non-admins

### Navigation Integration

The User Management module is integrated into `PublicAdminLayout`:

- **Menu Item:** "Users" (only visible to admins)
- **Icon:** Users icon from lucide-react
- **Access Control:** Only users with `role === "admin"` can see and access

### Permission-Based Navigation

The layout automatically filters menu items based on user permissions:

```typescript
const hasPageAccess = (pageId: string): boolean => {
  // Admin role has access to everything
  if (admin?.role === "admin") return true;
  
  // No permissions = access to all (default)
  if (!admin?.pagePermissions || admin.pagePermissions.length === 0) {
    return true;
  }
  
  // Check if page is in user's permissions
  return admin.pagePermissions.includes(pageId);
};
```

## 🔐 Security Features

1. **Role-Based Access Control:**
   - Only admins can access user management
   - Only admins can assign roles and permissions
   - Users cannot modify their own role or permissions

2. **Password Security:**
   - Passwords are hashed using bcrypt (10 rounds)
   - Password changes require authentication
   - Minimum 8 characters for new passwords

3. **Session Management:**
   - Deactivated users' sessions are revoked immediately
   - Deleted users' sessions are cleaned up

4. **Activity Logging:**
   - All user management actions are logged
   - Includes IP address and user agent
   - Tracks create, update, delete, activate, deactivate actions

## 📋 Usage Guide

### Creating a New User

1. Navigate to **Users** in the admin sidebar
2. Click **Add User** button
3. Fill in:
   - Name
   - Email
   - Password (required for new users)
   - Role (admin, editor, or viewer)
4. Click **Create**
5. Optionally, click the **Shield** icon to set page permissions

### Managing Page Permissions

1. Click the **Shield** icon next to any user
2. Select/deselect pages the user should have access to
3. If no pages are selected, user has access to all pages (default)
4. Click **Save Permissions**

### Editing a User

1. Click the **Edit** icon next to any user
2. Update name, email, or role
3. Optionally update password (leave blank to keep current)
4. Click **Update**

### Activating/Deactivating Users

- **Activate:** Click the **UserPlus** icon (green) on inactive users
- **Deactivate:** Click the **UserMinus** icon (orange) on active users
- Deactivated users cannot log in and their sessions are revoked

### Deleting Users

1. Click the **Trash** icon (red) next to any user
2. Confirm deletion
3. User and all their sessions are permanently deleted

## 🎨 UI Features

- **Search:** Filter users by name or email
- **Role Filter:** Filter by admin, editor, or viewer
- **Status Filter:** Filter by active or inactive
- **Role Badges:** Color-coded role indicators
- **Status Indicators:** Visual active/inactive status
- **Responsive Design:** Works on all screen sizes
- **Dark Mode Support:** Full dark mode compatibility

## 🔄 Migration

The database migration has been created and applied:

```bash
cd public-backend
npx prisma migrate dev --name add_page_permissions_to_public_admins
```

**Migration File:** `prisma/migrations/20251227182121_add_page_permissions_to_public_admins/migration.sql`

```sql
ALTER TABLE "public_admins" ADD COLUMN "pagePermissions" JSONB;
```

## 🧪 Testing

### Test User Management

1. **Create a test user:**
   ```bash
   # Use the admin interface or API
   POST /api/admin/users
   {
     "email": "test@example.com",
     "name": "Test User",
     "password": "testpassword123",
     "role": "editor",
     "pagePermissions": ["dashboard", "careers"]
   }
   ```

2. **Verify permissions:**
   - Login as the test user
   - Check that only "Dashboard" and "Careers" appear in the sidebar
   - Verify other pages are hidden

3. **Test role restrictions:**
   - Try to access `/api/admin/users` as a non-admin
   - Should return 403 Forbidden

## 📚 API Client

The frontend API client (`src/lib/api/publicAdminApi.ts`) includes all user management methods:

```typescript
// List users
publicAdminApi.users.list(params)

// Get user
publicAdminApi.users.get(id)

// Create user
publicAdminApi.users.create(data)

// Update user
publicAdminApi.users.update(id, data)

// Change password
publicAdminApi.users.changePassword(id, newPassword)

// Activate/Deactivate
publicAdminApi.users.activate(id)
publicAdminApi.users.deactivate(id)

// Delete user
publicAdminApi.users.delete(id)

// Get permissions
publicAdminApi.users.getPermissions(id)

// Update permissions
publicAdminApi.users.updatePermissions(id, pagePermissions)
```

## 🚀 Future Enhancements

1. **Bulk Operations:**
   - Bulk activate/deactivate
   - Bulk permission updates
   - Import users from CSV

2. **Advanced Permissions:**
   - Action-level permissions (create, edit, delete)
   - Resource-level permissions (specific landing pages)
   - Time-based permissions

3. **User Activity:**
   - Activity timeline per user
   - Login history
   - Action audit trail

4. **User Invitations:**
   - Email invitations
   - Invitation tokens
   - Self-registration with invitation code

## 📝 Notes

- **Default Behavior:** Users with no `pagePermissions` set have access to all pages
- **Admin Override:** Admin role always has full access regardless of permissions
- **Self-Modification:** Users can update their own name and email, but not role or permissions
- **Session Cleanup:** Deactivated or deleted users' sessions are automatically revoked

---

**Last Updated:** December 27, 2025
**Status:** ✅ Complete and Production Ready

