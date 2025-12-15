# Public Content Admin Implementation Plan

## 📋 Implementation Checklist

### Phase 1: Backend Foundation

#### 1.1 Database Schema

- [ ] Add `public_admins` model to `public-backend/prisma/schema.prisma`
- [ ] Add `public_admin_sessions` model
- [ ] Add `public_admin_activity_logs` model
- [ ] Create migration: `npx prisma migrate dev --name add_public_admin_models`
- [ ] Verify tables created in database

#### 1.2 Authentication Service

- [ ] Create `public-backend/src/services/admin.service.ts`
  - [ ] `createAdmin()` - Create new admin user
  - [ ] `authenticateAdmin()` - Login validation
  - [ ] `hashPassword()` - Password hashing (bcrypt)
  - [ ] `validatePassword()` - Password validation
  - [ ] `getAdminById()` - Get admin by ID
  - [ ] `getAdminByEmail()` - Get admin by email
  - [ ] `updateAdmin()` - Update admin details
  - [ ] `deactivateAdmin()` - Soft delete admin

#### 1.3 Authentication Middleware

- [ ] Create `public-backend/src/middleware/adminAuth.ts`
  - [ ] JWT token validation
  - [ ] Admin role checking
  - [ ] Session validation
  - [ ] Error handling

#### 1.4 Authentication Routes

- [ ] Create `public-backend/src/routes/admin/auth.ts`
  - [ ] `POST /api/admin/auth/register` - Register new admin (admin only)
  - [ ] `POST /api/admin/auth/login` - Admin login
  - [ ] `POST /api/admin/auth/logout` - Admin logout
  - [ ] `GET /api/admin/auth/me` - Get current admin
  - [ ] `POST /api/admin/auth/refresh` - Refresh token
  - [ ] `PUT /api/admin/auth/password` - Change password

#### 1.5 Landing Page Admin Routes

- [ ] Create `public-backend/src/routes/admin/landing-pages.ts`
  - [ ] `GET /api/admin/landing-pages` - List all landing pages
  - [ ] `GET /api/admin/landing-pages/:id` - Get single page
  - [ ] `POST /api/admin/landing-pages` - Create page
  - [ ] `PUT /api/admin/landing-pages/:id` - Update page
  - [ ] `DELETE /api/admin/landing-pages/:id` - Delete page
  - [ ] `POST /api/admin/landing-pages/:id/publish` - Publish page
  - [ ] `POST /api/admin/landing-pages/:id/unpublish` - Unpublish page

#### 1.6 Career Admin Routes (Update Existing)

- [ ] Update `public-backend/src/routes/careers.ts` or create admin version
  - [ ] Ensure admin routes use `adminAuth` middleware
  - [ ] Verify all CRUD operations work

#### 1.7 Mount Admin Routes

- [ ] Update `public-backend/src/index.ts`
  - [ ] Mount `/api/admin/auth` routes
  - [ ] Mount `/api/admin/landing-pages` routes
  - [ ] Mount `/api/admin/careers` routes (if separate)
  - [ ] Add CORS configuration for admin UI domain

### Phase 2: Frontend Admin Interface

#### 2.1 Project Structure

- [ ] Create `src/components/public-admin/` directory
- [ ] Create `src/lib/api/publicAdminApi.ts`
- [ ] Create `src/routes/PublicAdminRoutes.tsx` (if using React Router)

#### 2.2 Authentication Components

- [ ] Create `src/components/public-admin/PublicAdminLogin.tsx`

  - [ ] Login form
  - [ ] Error handling
  - [ ] Token storage
  - [ ] Redirect after login

- [ ] Create `src/components/public-admin/PublicAdminLayout.tsx`
  - [ ] Sidebar navigation
  - [ ] Header with user info
  - [ ] Logout functionality
  - [ ] Protected route wrapper

#### 2.3 API Client

- [ ] Create `src/lib/api/publicAdminApi.ts`
  - [ ] Base URL configuration
  - [ ] Token management
  - [ ] Request interceptors
  - [ ] Error handling
  - [ ] Auto token refresh

#### 2.4 Dashboard

- [ ] Create `src/components/public-admin/PublicAdminDashboard.tsx`
  - [ ] Overview statistics
  - [ ] Recent activity
  - [ ] Quick actions
  - [ ] Content summary

#### 2.5 Landing Page Management

- [ ] Create `src/components/public-admin/landing-pages/LandingPageList.tsx`

  - [ ] List all landing pages
  - [ ] Search and filter
  - [ ] Publish/unpublish toggle
  - [ ] Delete functionality

- [ ] Create `src/components/public-admin/landing-pages/LandingPageEditor.tsx`

  - [ ] Rich text editor
  - [ ] SEO fields
  - [ ] Image upload
  - [ ] Preview mode
  - [ ] Save/publish buttons

- [ ] Create `src/components/public-admin/landing-pages/LandingPagePreview.tsx`
  - [ ] Live preview
  - [ ] Mobile/desktop view toggle

#### 2.6 Career Management (Migration)

- [ ] Move `src/components/admin/landing-page/CareerManagement.tsx`
  - [ ] To: `src/components/public-admin/careers/CareerManagement.tsx`
  - [ ] Update imports
  - [ ] Update API calls to use `publicAdminApi`
  - [ ] Test all functionality

#### 2.7 Routing

- [ ] Update `src/App.tsx` or router
  - [ ] Add `/admin/*` route
  - [ ] Add `/admin/login` route
  - [ ] Add protected route wrapper
  - [ ] Handle authentication redirects

### Phase 3: Content Management Features

#### 3.1 Blog Management (If Needed)

- [ ] Create blog admin routes in backend
- [ ] Create blog management components
- [ ] Implement CRUD operations

#### 3.2 Analytics

- [ ] Create `src/components/public-admin/analytics/PublicContentAnalytics.tsx`
  - [ ] Landing page views
  - [ ] Form submissions
  - [ ] Career posting views
  - [ ] Traffic sources

#### 3.3 Form Submissions

- [ ] Create form submissions management
- [ ] Move from app admin to public admin
- [ ] Update API endpoints

### Phase 4: Security & Polish

#### 4.1 Role-Based Access Control

- [ ] Implement role checking in backend
- [ ] Add role-based UI restrictions
- [ ] Create role management interface

#### 4.2 Activity Logging

- [ ] Log all admin actions
- [ ] Create activity log viewer
- [ ] Add filtering and search

#### 4.3 Session Management

- [ ] Implement session timeout
- [ ] Add "Remember me" functionality
- [ ] Implement token refresh

#### 4.4 Security Hardening

- [ ] Add rate limiting for admin endpoints
- [ ] Implement CSRF protection
- [ ] Add input validation
- [ ] Security audit

#### 4.5 UI/UX Improvements

- [ ] Improve loading states
- [ ] Add error boundaries
- [ ] Improve error messages
- [ ] Add success notifications
- [ ] Responsive design

## 🗂️ File Structure (Detailed)

```
public-backend/
├── src/
│   ├── routes/
│   │   └── admin/
│   │       ├── index.ts              # Admin routes aggregator
│   │       ├── auth.ts               # Authentication routes
│   │       ├── landing-pages.ts      # Landing page admin routes
│   │       ├── careers.ts            # Career admin routes (or use existing)
│   │       ├── blog.ts               # Blog admin routes (future)
│   │       └── analytics.ts          # Analytics routes
│   ├── middleware/
│   │   ├── adminAuth.ts              # Admin authentication middleware
│   │   └── adminRoleCheck.ts         # Role-based access middleware
│   ├── services/
│   │   ├── admin.service.ts          # Admin user management
│   │   ├── landing.service.ts       # Landing page business logic
│   │   └── activityLog.service.ts   # Activity logging
│   └── lib/
│       └── jwt.ts                    # JWT utilities for admin

src/
├── components/
│   └── public-admin/
│       ├── PublicAdminLayout.tsx
│       ├── PublicAdminLogin.tsx
│       ├── PublicAdminDashboard.tsx
│       ├── landing-pages/
│       │   ├── LandingPageList.tsx
│       │   ├── LandingPageEditor.tsx
│       │   ├── LandingPagePreview.tsx
│       │   └── LandingPageForm.tsx
│       ├── careers/
│       │   └── CareerManagement.tsx  # Moved from admin/
│       ├── blog/
│       │   ├── BlogList.tsx
│       │   └── BlogEditor.tsx
│       └── analytics/
│           └── PublicContentAnalytics.tsx
├── lib/
│   └── api/
│       └── publicAdminApi.ts          # API client for public admin
└── routes/
    └── PublicAdminRoutes.tsx          # Admin route definitions
```

## 🔐 Authentication Implementation Details

### JWT Token Structure

```typescript
interface PublicAdminToken {
  adminId: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  iat: number;
  exp: number;
}
```

### Token Storage

```typescript
// Store in localStorage or sessionStorage
const TOKEN_KEY = "public_admin_token";
const REFRESH_TOKEN_KEY = "public_admin_refresh_token";
```

### API Client Implementation

```typescript
// src/lib/api/publicAdminApi.ts
const PUBLIC_ADMIN_API_URL =
  import.meta.env.VITE_PUBLIC_ADMIN_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5001/api/admin"
    : "https://api.contrezz.com/api/admin");

// Include token in all requests
headers: {
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
}
```

## 📊 Database Migration Script

```bash
# Create migration for public admin tables
cd public-backend
npx prisma migrate dev --name add_public_admin_models

# Seed initial admin user (optional)
# Create script: scripts/seed-public-admin.ts
```

## 🧪 Testing Checklist

### Backend Tests

- [ ] Admin authentication works
- [ ] JWT token generation/validation
- [ ] Role-based access control
- [ ] Landing page CRUD operations
- [ ] Career CRUD operations
- [ ] Activity logging

### Frontend Tests

- [ ] Login flow works
- [ ] Token storage and retrieval
- [ ] Protected routes redirect correctly
- [ ] Landing page management UI
- [ ] Career management UI
- [ ] Error handling
- [ ] Loading states

### Integration Tests

- [ ] End-to-end admin login
- [ ] Create/edit landing page
- [ ] Create/edit career posting
- [ ] Publish/unpublish content
- [ ] View analytics

## 🚀 Deployment Checklist

### Backend Deployment

- [ ] Add `PUBLIC_ADMIN_JWT_SECRET` to environment variables
- [ ] Run database migrations
- [ ] Create initial admin user
- [ ] Verify admin routes are accessible
- [ ] Test authentication endpoints

### Frontend Deployment

- [ ] Set `VITE_PUBLIC_ADMIN_API_URL` environment variable
- [ ] Build and deploy frontend
- [ ] Verify `/admin` route is accessible
- [ ] Test login functionality
- [ ] Verify admin dashboard loads

### DNS Configuration (If using subdomain)

- [ ] Add `admin.contrezz.com` CNAME record
- [ ] Configure SSL certificate
- [ ] Update CORS settings in backend

## 📝 Documentation Tasks

- [ ] Document admin API endpoints
- [ ] Create admin user guide
- [ ] Document authentication flow
- [ ] Create deployment guide
- [ ] Document role permissions
- [ ] Create troubleshooting guide

## 🎯 Success Metrics

### Phase 1 Success

- ✅ Admin can log in
- ✅ JWT tokens work correctly
- ✅ Admin routes are protected
- ✅ Landing page CRUD works

### Phase 2 Success

- ✅ Admin UI is accessible
- ✅ All management features work
- ✅ UI is user-friendly
- ✅ No errors in console

### Phase 3 Success

- ✅ All content types manageable
- ✅ Analytics are accurate
- ✅ Performance is good
- ✅ User feedback is positive

### Phase 4 Success

- ✅ Security audit passes
- ✅ Documentation is complete
- ✅ System is production-ready
- ✅ Team is trained

---

**Next Action**: Review architecture document and begin Phase 1 implementation.
