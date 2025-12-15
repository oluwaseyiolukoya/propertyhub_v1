# Public Content Admin Architecture

## 🎯 Overview

This document outlines the architecture for a **separate, independent admin interface** for managing public content (landing pages, careers, blog, etc.) that is completely isolated from the main application admin dashboard.

## 🏗️ Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC DOMAIN                              │
│                  (contrezz.com)                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Public Frontend │         │  Public Admin UI  │         │
│  │  (Landing Pages) │         │  (Separate Admin) │         │
│  │                  │         │                  │         │
│  │  - Landing Page  │         │  - Landing Mgmt  │         │
│  │  - Careers       │         │  - Career Mgmt   │         │
│  │  - Blog          │         │  - Blog Mgmt     │         │
│  │  - Contact       │         │  - Content Mgmt  │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                   │
│           │                            │                   │
│           └────────────┬───────────────┘                   │
│                        │                                   │
│                        ▼                                   │
│           ┌──────────────────────┐                        │
│           │   Public Backend API │                        │
│           │   (api.contrezz.com) │                        │
│           │                      │                        │
│           │  - Public Routes     │                        │
│           │  - Admin Routes     │                        │
│           │  - Auth (Separate)   │                        │
│           └──────────┬───────────┘                        │
│                      │                                    │
│                      ▼                                    │
│           ┌──────────────────────┐                        │
│           │  Public Database      │                        │
│           │  (contrezz_public)    │                        │
│           │                       │                        │
│           │  - landing_pages     │                        │
│           │  - career_postings   │                        │
│           │  - blog_posts        │                        │
│           │  - public_admins     │                        │
│           └──────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              APPLICATION DOMAIN                              │
│            (app.contrezz.com)                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  App Frontend   │         │  Main Admin      │         │
│  │  (Dashboard)    │         │  Dashboard       │         │
│  │                 │         │                  │         │
│  │  - Properties   │         │  - Users         │         │
│  │  - Tenants      │         │  - Customers     │         │
│  │  - Payments     │         │  - Billing       │         │
│  └────────┬────────┘         └────────┬────────┘         │
│           │                            │                   │
│           └────────────┬───────────────┘                   │
│                        │                                   │
│                        ▼                                   │
│           ┌──────────────────────┐                        │
│           │   App Backend API     │                        │
│           │ (api.app.contrezz.com)│                        │
│           └──────────┬────────────┘                        │
│                      │                                    │
│                      ▼                                    │
│           ┌──────────────────────┐                        │
│           │  App Database         │                        │
│           │  (contrezz)            │                        │
│           └──────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Key Components

### 1. Public Content Admin Interface

**Location**: `src/components/public-admin/` (new directory)

**Purpose**: Separate admin interface for managing public content

**Features**:

- Landing page management
- Career postings management
- Blog post management
- Content analytics
- SEO management
- Form submissions review

**Access**:

- URL: `https://contrezz.com/admin` or `https://admin.contrezz.com`
- Separate authentication from main app admin
- Independent user management

### 2. Public Backend Admin Routes

**Location**: `public-backend/src/routes/admin/` (new directory)

**Endpoints**:

- `/api/admin/auth/*` - Authentication for public admin
- `/api/admin/landing-pages/*` - Landing page CRUD
- `/api/admin/careers/*` - Career postings management
- `/api/admin/blog/*` - Blog post management
- `/api/admin/analytics/*` - Public content analytics
- `/api/admin/users/*` - Public admin user management

### 3. Public Admin Authentication

**Location**: `public-backend/src/middleware/adminAuth.ts` (new file)

**Features**:

- Separate JWT tokens from app admin
- Public admin user model in public database
- Role-based access control (public_admin, public_editor, etc.)

### 4. Public Admin Database Schema

**New Models in `public-backend/prisma/schema.prisma`**:

```prisma
model public_admins {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String   // Hashed
  role      String   @default("editor") // admin, editor, viewer
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([role])
}

model public_admin_sessions {
  id        String   @id @default(uuid())
  adminId   String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  admin     public_admins @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([token])
  @@index([expiresAt])
}
```

## 🔐 Authentication Flow

### Public Admin Login

```
1. User visits: https://contrezz.com/admin/login
2. Enters email/password
3. Frontend calls: POST /api/admin/auth/login
4. Backend validates against public_admins table
5. Returns JWT token (separate from app admin tokens)
6. Frontend stores token and redirects to admin dashboard
```

### Token Management

- **Separate JWT secret**: `PUBLIC_ADMIN_JWT_SECRET`
- **Token prefix**: `public_admin_` (to distinguish from app admin tokens)
- **Expiration**: 24 hours (configurable)
- **Storage**: Same as app admin (localStorage/sessionStorage)

## 🗂️ File Structure

```
public-backend/
├── src/
│   ├── routes/
│   │   ├── admin/              # NEW: Admin routes
│   │   │   ├── auth.ts        # Admin authentication
│   │   │   ├── landing-pages.ts
│   │   │   ├── careers.ts
│   │   │   ├── blog.ts
│   │   │   └── analytics.ts
│   │   ├── careers.ts         # Public routes (existing)
│   │   └── landing.ts         # Public routes (future)
│   ├── middleware/
│   │   ├── adminAuth.ts       # NEW: Admin authentication middleware
│   │   └── rateLimiter.ts     # Existing
│   ├── services/
│   │   ├── admin.service.ts   # NEW: Admin user management
│   │   ├── career.service.ts  # Existing
│   │   └── landing.service.ts # NEW: Landing page management
│   └── index.ts

src/
├── components/
│   ├── admin/                 # Main app admin (existing)
│   │   └── ...
│   └── public-admin/          # NEW: Public content admin
│       ├── PublicAdminLayout.tsx
│       ├── PublicAdminLogin.tsx
│       ├── PublicAdminDashboard.tsx
│       ├── landing-pages/
│       │   ├── LandingPageList.tsx
│       │   ├── LandingPageEditor.tsx
│       │   └── LandingPagePreview.tsx
│       ├── careers/
│       │   └── CareerManagement.tsx (moved from admin/)
│       ├── blog/
│       │   └── BlogManagement.tsx
│       └── analytics/
│           └── PublicContentAnalytics.tsx
│   └── ...

src/lib/
├── api/
│   ├── publicAdminApi.ts      # NEW: API client for public admin
│   └── ...
└── ...
```

## 🔄 Data Flow

### Landing Page Management Flow

```
1. Public Admin logs in → Gets JWT token
2. Navigates to Landing Pages section
3. Frontend calls: GET /api/admin/landing-pages
4. Backend validates JWT → Queries public database
5. Returns landing pages data
6. Admin edits page → PUT /api/admin/landing-pages/:id
7. Backend updates public database
8. Changes reflect on public site immediately
```

### Career Posting Flow

```
1. Public Admin creates career posting
2. Frontend calls: POST /api/admin/careers
3. Backend validates admin JWT
4. Creates posting in public database
5. Returns created posting
6. Public site shows new posting automatically
```

## 🔒 Security Considerations

### 1. Separate Authentication

- **Different JWT secrets**: App admin and public admin use different secrets
- **Different user tables**: `users` (app) vs `public_admins` (public)
- **No cross-authentication**: Public admin cannot access app admin and vice versa

### 2. Role-Based Access Control

```typescript
enum PublicAdminRole {
  ADMIN = "admin", // Full access
  EDITOR = "editor", // Can edit content
  VIEWER = "viewer", // Read-only
}
```

### 3. CORS Configuration

- Public admin UI: `https://contrezz.com` or `https://admin.contrezz.com`
- API: `https://api.contrezz.com`
- Separate CORS rules for admin endpoints

### 4. Rate Limiting

- Stricter rate limits for admin endpoints
- Separate rate limiting from public endpoints

## 📊 Database Schema Updates

### New Tables in Public Database

```prisma
// Admin users for public content management
model public_admins {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String   // bcrypt hashed
  role      String   @default("editor")
  isActive  Boolean  @default(true)
  lastLogin DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions  public_admin_sessions[]

  @@index([email])
  @@index([role])
  @@index([isActive])
}

// Admin sessions for token management
model public_admin_sessions {
  id        String   @id @default(uuid())
  adminId   String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  admin     public_admins @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([token])
  @@index([expiresAt])
}

// Activity logs for public admin actions
model public_admin_activity_logs {
  id        String   @id @default(uuid())
  adminId   String
  action    String   // "create", "update", "delete", "publish"
  resource  String   // "landing_page", "career_posting", "blog_post"
  resourceId String?
  details   Json?
  ipAddress String?
  createdAt DateTime @default(now())

  admin     public_admins @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([resource, resourceId])
  @@index([createdAt])
}
```

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)

1. **Database Schema**

   - Add `public_admins` table
   - Add `public_admin_sessions` table
   - Add `public_admin_activity_logs` table
   - Run migrations

2. **Backend Authentication**

   - Create `adminAuth.ts` middleware
   - Create `admin.service.ts` for user management
   - Create `/api/admin/auth/*` routes
   - Implement JWT token generation/validation

3. **Basic Admin Routes**
   - Create admin routes structure
   - Implement basic CRUD for landing pages
   - Add authentication middleware to routes

### Phase 2: Frontend Admin Interface (Week 2)

1. **Admin UI Components**

   - Create `PublicAdminLayout` component
   - Create `PublicAdminLogin` component
   - Create `PublicAdminDashboard` component
   - Set up routing (`/admin/*`)

2. **API Client**

   - Create `publicAdminApi.ts` client
   - Implement authentication helpers
   - Add error handling

3. **Landing Page Management**
   - Create landing page list view
   - Create landing page editor
   - Implement preview functionality

### Phase 3: Content Management (Week 3)

1. **Career Management Migration**

   - Move career management from app admin to public admin
   - Update API calls to use public admin API
   - Test career CRUD operations

2. **Blog Management** (if needed)

   - Create blog post management
   - Implement blog CRUD operations

3. **Analytics Dashboard**
   - Create public content analytics
   - Show landing page views, form submissions, etc.

### Phase 4: Polish & Security (Week 4)

1. **Security Hardening**

   - Implement role-based access control
   - Add activity logging
   - Implement session management
   - Add rate limiting for admin endpoints

2. **UI/UX Improvements**

   - Improve admin interface design
   - Add loading states
   - Add error handling
   - Add success notifications

3. **Documentation**
   - Document admin API endpoints
   - Create admin user guide
   - Document deployment process

## 🔗 Integration Points

### 1. Domain Routing

**Option A: Subdomain (Recommended)**

```
https://admin.contrezz.com → Public Admin UI
https://contrezz.com → Public Site
https://app.contrezz.com → Application
```

**Option B: Path-based**

```
https://contrezz.com/admin → Public Admin UI
https://contrezz.com → Public Site
https://app.contrezz.com → Application
```

### 2. API Endpoints

```
Public Admin API:
- https://api.contrezz.com/api/admin/auth/login
- https://api.contrezz.com/api/admin/landing-pages
- https://api.contrezz.com/api/admin/careers
- https://api.contrezz.com/api/admin/blog

Public API (existing):
- https://api.contrezz.com/api/careers
- https://api.contrezz.com/api/landing-pages
```

### 3. Frontend Routing

```typescript
// In App.tsx or router
{
  path: "/admin/*",
  element: <PublicAdminRouter />,
  // Separate from main app routes
}
```

## 📝 Benefits of This Architecture

### 1. **Complete Separation**

- Public content admin is independent from app admin
- Different authentication systems
- Different user management
- No dependencies between systems

### 2. **Scalability**

- Public admin can scale independently
- Can be hosted on different infrastructure
- Different caching strategies

### 3. **Security**

- Isolated admin access
- Separate security boundaries
- Reduced attack surface

### 4. **Maintainability**

- Clear separation of concerns
- Easier to understand and maintain
- Independent deployment cycles

### 5. **Flexibility**

- Can use different tech stack if needed
- Different team can manage public content
- Independent feature development

## 🎯 Success Criteria

### Phase 1 Complete When:

- ✅ Public admin can log in
- ✅ Public admin can view landing pages
- ✅ Public admin can create/edit landing pages
- ✅ Authentication is working correctly

### Phase 2 Complete When:

- ✅ Public admin UI is accessible
- ✅ Landing page management is functional
- ✅ Career management is migrated
- ✅ UI is polished and user-friendly

### Phase 3 Complete When:

- ✅ All public content can be managed
- ✅ Analytics are available
- ✅ Role-based access is implemented
- ✅ Activity logging is working

### Phase 4 Complete When:

- ✅ Security is hardened
- ✅ Documentation is complete
- ✅ System is production-ready
- ✅ Team is trained on new system

## 🔄 Migration Strategy

### Moving Existing Admin Features

1. **Career Management**

   - Currently in: `src/components/admin/landing-page/CareerManagement.tsx`
   - Move to: `src/components/public-admin/careers/CareerManagement.tsx`
   - Update API calls to use `publicAdminApi` instead of `apiClient`
   - Update routes from `/api/admin/careers` to `/api/admin/careers` (same path, different backend)

2. **Landing Page Management**

   - Currently in: `src/components/admin/LandingPageManagement.tsx`
   - Move to: `src/components/public-admin/landing-pages/`
   - Update API calls to use public admin API
   - Keep existing functionality, just change backend

3. **Form Submissions**
   - Currently managed in app admin
   - Move to public admin
   - Use public database for storage

## 🚨 Important Considerations

### 1. User Migration

**Question**: Should existing app admins have access to public admin?

**Recommendation**:

- Create separate public admin users
- App admins do NOT automatically get public admin access
- Public admins do NOT get app admin access
- If needed, create a "super admin" role that has both (rare)

### 2. Data Migration

**Question**: Should existing landing page data be migrated?

**Recommendation**:

- If landing pages are in app database → Migrate to public database
- Use migration script similar to careers migration
- Verify data integrity after migration

### 3. URL Structure

**Question**: What URL should public admin use?

**Recommendation**:

- Option A: `https://admin.contrezz.com` (subdomain - cleaner)
- Option B: `https://contrezz.com/admin` (path - simpler DNS)
- Choose based on DNS management preferences

## 📚 Next Steps

1. **Review this architecture** with the team
2. **Decide on URL structure** (subdomain vs path)
3. **Create implementation plan** with timelines
4. **Set up development environment** for public admin
5. **Begin Phase 1 implementation**

---

**Document Version**: 1.0  
**Last Updated**: December 14, 2025  
**Status**: Draft - Ready for Review
