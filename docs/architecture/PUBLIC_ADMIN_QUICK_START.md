# Public Content Admin - Quick Start Guide

## 🎯 Goal

Create a **completely separate admin interface** for managing public content (landing pages, careers, blog) that is independent from the main application admin dashboard.

## 🏗️ Architecture Summary

### Separation Strategy

```
┌─────────────────────────────────────┐
│   PUBLIC CONTENT ADMIN              │
│   (Separate & Independent)          │
├─────────────────────────────────────┤
│ • Own authentication system         │
│ • Own user management               │
│ • Own database (public-backend)      │
│ • Own admin UI                       │
│ • Accessible at /admin or           │
│   admin.contrezz.com                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   MAIN APP ADMIN                    │
│   (Existing - Unchanged)            │
├─────────────────────────────────────┤
│ • App user management               │
│ • Properties, tenants, billing      │
│ • Accessible at app.contrezz.com    │
└─────────────────────────────────────┘
```

## 📊 Key Differences

| Aspect       | Public Admin          | App Admin            |
| ------------ | --------------------- | -------------------- |
| **Database** | `contrezz_public`     | `contrezz`           |
| **Backend**  | `public-backend`      | `backend`            |
| **Users**    | `public_admins` table | `users` table        |
| **Auth**     | Separate JWT secret   | App JWT secret       |
| **Domain**   | `contrezz.com/admin`  | `app.contrezz.com`   |
| **Purpose**  | Public content only   | Application features |

## 🚀 Quick Implementation Steps

### Step 1: Database Schema (5 minutes)

Add to `public-backend/prisma/schema.prisma`:

```prisma
model public_admins {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String   // bcrypt hashed
  role      String   @default("editor") // admin, editor, viewer
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions  public_admin_sessions[]
  logs      public_admin_activity_logs[]

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
}

model public_admin_activity_logs {
  id         String   @id @default(uuid())
  adminId    String
  action     String
  resource   String
  resourceId String?
  details    Json?
  createdAt  DateTime @default(now())

  admin      public_admins @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([createdAt])
}
```

Run migration:

```bash
cd public-backend
npx prisma migrate dev --name add_public_admin_models
```

### Step 2: Backend Authentication (15 minutes)

Create `public-backend/src/services/admin.service.ts`:

- Password hashing (bcrypt)
- Admin CRUD operations
- Authentication logic

Create `public-backend/src/middleware/adminAuth.ts`:

- JWT validation
- Role checking
- Session management

### Step 3: Admin Routes (20 minutes)

Create `public-backend/src/routes/admin/auth.ts`:

- Login, logout, register endpoints

Create `public-backend/src/routes/admin/landing-pages.ts`:

- CRUD operations for landing pages

Update `public-backend/src/index.ts`:

- Mount admin routes at `/api/admin/*`

### Step 4: Frontend Admin UI (30 minutes)

Create `src/components/public-admin/`:

- `PublicAdminLogin.tsx`
- `PublicAdminLayout.tsx`
- `PublicAdminDashboard.tsx`

Create `src/lib/api/publicAdminApi.ts`:

- API client for admin endpoints

Add routing in `src/App.tsx`:

- `/admin/login` → Login page
- `/admin/*` → Protected admin routes

## 📁 File Structure Preview

```
public-backend/
├── src/
│   ├── routes/
│   │   └── admin/              # NEW
│   │       ├── auth.ts
│   │       └── landing-pages.ts
│   ├── middleware/
│   │   └── adminAuth.ts        # NEW
│   └── services/
│       └── admin.service.ts    # NEW

src/
├── components/
│   └── public-admin/           # NEW
│       ├── PublicAdminLogin.tsx
│       ├── PublicAdminLayout.tsx
│       └── PublicAdminDashboard.tsx
└── lib/
    └── api/
        └── publicAdminApi.ts   # NEW
```

## 🔐 Authentication Flow

```
1. Admin visits: /admin/login
2. Enters email/password
3. Frontend → POST /api/admin/auth/login
4. Backend validates against public_admins table
5. Returns JWT token (PUBLIC_ADMIN_JWT_SECRET)
6. Frontend stores token
7. All admin API calls include token in header
8. Backend validates token on each request
```

## 🎨 UI Structure

```
/admin
├── /login                    # Login page
├── /dashboard                # Overview (stats, quick actions)
├── /landing-pages           # Landing page management
│   ├── /list                # List all pages
│   ├── /create              # Create new page
│   └── /:id/edit            # Edit page
├── /careers                 # Career management
│   ├── /list                # List all postings
│   ├── /create              # Create posting
│   └── /:id/edit            # Edit posting
└── /analytics               # Content analytics
```

## 🔒 Security Features

1. **Separate Authentication**

   - Different JWT secret: `PUBLIC_ADMIN_JWT_SECRET`
   - Different user table: `public_admins`
   - No cross-authentication with app admin

2. **Role-Based Access**

   - `admin`: Full access
   - `editor`: Can edit content
   - `viewer`: Read-only

3. **Session Management**

   - Token expiration (24 hours)
   - Session tracking in database
   - Logout invalidates session

4. **Activity Logging**
   - All admin actions logged
   - Audit trail for compliance
   - IP address and user agent tracking

## 📝 Environment Variables

Add to `public-backend/.env`:

```env
# Public Admin Authentication
PUBLIC_ADMIN_JWT_SECRET=your-secret-key-here
PUBLIC_ADMIN_JWT_EXPIRES_IN=24h

# Admin UI URL (for CORS)
PUBLIC_ADMIN_UI_URL=http://localhost:5173/admin
# Production: https://contrezz.com/admin
```

Add to frontend `.env`:

```env
# Public Admin API
VITE_PUBLIC_ADMIN_API_URL=http://localhost:5001/api/admin
# Production: https://api.contrezz.com/api/admin
```

## ✅ Benefits

1. **Complete Independence**

   - Public content team can work independently
   - No dependencies on app admin
   - Separate deployment cycles

2. **Security Isolation**

   - Public admin breach doesn't affect app admin
   - Different authentication systems
   - Separate security boundaries

3. **Scalability**

   - Can scale independently
   - Different caching strategies
   - Optimized for public content

4. **Maintainability**
   - Clear separation of concerns
   - Easier to understand
   - Independent feature development

## 🌐 DNS Configuration

Since you've chosen the subdomain approach (`admin.contrezz.com`), you'll need to:

1. **Add CNAME record** in Namecheap:

   - Host: `admin`
   - Value: Your DigitalOcean frontend app default domain

2. **Add custom domain** in DigitalOcean:

   - Go to frontend app → Settings → Domains
   - Add: `admin.contrezz.com`
   - SSL certificate will auto-provision

3. **See detailed steps**: `SETUP_ADMIN_SUBDOMAIN.md`

## 🚦 Getting Started

1. **Review Architecture**: Read `PUBLIC_CONTENT_ADMIN_ARCHITECTURE.md`
2. **Review Plan**: Read `PUBLIC_ADMIN_IMPLEMENTATION_PLAN.md`
3. **Setup DNS**: Follow `SETUP_ADMIN_SUBDOMAIN.md` (after Phase 1)
4. **Start Phase 1**: Begin with database schema
5. **Test Incrementally**: Test each phase before moving to next

---

**Ready to start?** Begin with Phase 1: Database Schema
