# Complete URL Reference - Local & Production

Complete list of all URLs for local development and production environments.

---

## 🌐 Production URLs

### Public Frontend (Landing Pages, Careers, Blog)
- **Main Site**: `https://contrezz.com`
- **WWW Redirect**: `https://www.contrezz.com` → redirects to `https://contrezz.com`

### Application Frontend (Login, Dashboard)
- **App**: `https://app.contrezz.com`

### Public Admin Interface
- **Admin**: `https://admin.contrezz.com`

### Public API (Public Backend)
- **API Base**: `https://api.contrezz.com`
- **Health Check**: `https://api.contrezz.com/health`
- **Careers (Public)**: `https://api.contrezz.com/api/careers`
- **Admin Auth**: `https://api.contrezz.com/api/admin/auth`
- **Admin Landing Pages**: `https://api.contrezz.com/api/admin/landing-pages`
- **Admin Careers**: `https://api.contrezz.com/api/admin/careers`

### Application API (App Backend)
- **API Base**: `https://api.app.contrezz.com`
- **Health Check**: `https://api.app.contrezz.com/api/health`
- **Auth**: `https://api.app.contrezz.com/api/auth`
- **Users**: `https://api.app.contrezz.com/api/users`
- **Customers**: `https://api.app.contrezz.com/api/customers`

---

## 💻 Local Development URLs

### Frontend (Vite Dev Server)
- **Default**: `http://localhost:5173`
- **Public Pages**: `http://localhost:5173` (landing, careers, blog)
- **App Pages**: `http://localhost:5173` (login, dashboard - domain-based routing)
- **Public Admin**: `http://localhost:5173/admin` (path-based access)

### Local Domain Setup (Optional - More Realistic)
If you've configured `/etc/hosts`:

- **Public Site**: `http://contrezz.local:5173`
- **App**: `http://app.contrezz.local:5173`
- **Public Admin**: `http://admin.contrezz.local:5173`

**To set up local domains, add to `/etc/hosts`:**
```
127.0.0.1 contrezz.local
127.0.0.1 app.contrezz.local
127.0.0.1 admin.contrezz.local
```

### Public Backend (Local)
- **Base URL**: `http://localhost:5001`
- **Health Check**: `http://localhost:5001/health`
- **Careers (Public)**: `http://localhost:5001/api/careers`
- **Admin Auth**: `http://localhost:5001/api/admin/auth`
- **Admin Landing Pages**: `http://localhost:5001/api/admin/landing-pages`
- **Admin Careers**: `http://localhost:5001/api/admin/careers`

### Application Backend (Local)
- **Base URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`
- **Auth**: `http://localhost:5000/api/auth`
- **Users**: `http://localhost:5000/api/users`
- **Customers**: `http://localhost:5000/api/customers`

---

## 📋 URL Summary Table

### Production

| Service | URL | Purpose |
|--------|-----|---------|
| **Public Frontend** | `https://contrezz.com` | Landing pages, careers, blog |
| **App Frontend** | `https://app.contrezz.com` | Login, dashboard, app features |
| **Public Admin** | `https://admin.contrezz.com` | Public content admin interface |
| **Public API** | `https://api.contrezz.com` | Public backend API |
| **App API** | `https://api.app.contrezz.com` | Application backend API |

### Local Development

| Service | URL | Purpose |
|--------|-----|---------|
| **Frontend** | `http://localhost:5173` | All frontend (domain-based routing) |
| **Public Admin (Path)** | `http://localhost:5173/admin` | Public admin (path-based access) |
| **Public Backend** | `http://localhost:5001` | Public API backend |
| **App Backend** | `http://localhost:5000` | Application API backend |

---

## 🔗 API Endpoints Reference

### Public API (`api.contrezz.com` or `localhost:5001`)

#### Public Endpoints (No Auth)
- `GET /health` - Health check
- `GET /api/careers` - List public career postings
- `GET /api/careers/:id` - Get single career posting

#### Admin Endpoints (Requires Auth)
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/auth/me` - Get current admin
- `PUT /api/admin/auth/password` - Change password
- `POST /api/admin/auth/register` - Register new admin (admin only)

- `GET /api/admin/landing-pages` - List landing pages
- `GET /api/admin/landing-pages/:id` - Get landing page
- `POST /api/admin/landing-pages` - Create landing page
- `PUT /api/admin/landing-pages/:id` - Update landing page
- `DELETE /api/admin/landing-pages/:id` - Delete landing page
- `POST /api/admin/landing-pages/:id/publish` - Publish landing page
- `POST /api/admin/landing-pages/:id/unpublish` - Unpublish landing page

- `GET /api/admin/careers` - List career postings (admin view)
- `GET /api/admin/careers/stats` - Get career statistics
- `GET /api/admin/careers/:id` - Get career posting
- `POST /api/admin/careers` - Create career posting
- `PUT /api/admin/careers/:id` - Update career posting
- `DELETE /api/admin/careers/:id` - Delete career posting

### App API (`api.app.contrezz.com` or `localhost:5000`)

#### Auth Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

#### Other Endpoints
- `GET /api/health` - Health check
- `GET /api/users` - List users (admin)
- `GET /api/customers` - List customers
- `GET /api/plans` - List subscription plans
- ... (other app-specific endpoints)

---

## 🌍 Environment-Based URLs

### Frontend Environment Variables

**Local Development:**
```env
VITE_API_URL=http://localhost:5000
VITE_PUBLIC_API_URL=http://localhost:5001/api
VITE_PUBLIC_ADMIN_API_URL=http://localhost:5001/api/admin
```

**Production:**
```env
VITE_API_URL=https://api.app.contrezz.com
VITE_PUBLIC_API_URL=https://api.contrezz.com/api
VITE_PUBLIC_ADMIN_API_URL=https://api.contrezz.com/api/admin
```

### Backend Environment Variables

**Public Backend - Local:**
```env
PORT=5001
PUBLIC_DATABASE_URL=postgresql://user@localhost:5432/contrezz_public
ALLOWED_ORIGINS=http://localhost:5173,http://admin.contrezz.local:5173
PUBLIC_ADMIN_JWT_SECRET=local-dev-secret-key
```

**Public Backend - Production:**
```env
PORT=5001
PUBLIC_DATABASE_URL=postgresql://user:password@host:port/contrezz_public
ALLOWED_ORIGINS=https://admin.contrezz.com
PUBLIC_ADMIN_JWT_SECRET=production-secret-key
```

**App Backend - Local:**
```env
PORT=5000
DATABASE_URL=postgresql://user@localhost:5432/contrezz
FRONTEND_URL=http://localhost:5173
```

**App Backend - Production:**
```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:port/contrezz
FRONTEND_URL=https://app.contrezz.com
```

---

## 🔐 Authentication URLs

### Public Admin Authentication

**Local:**
- Login: `http://localhost:5173/admin` or `http://admin.contrezz.local:5173`
- API: `http://localhost:5001/api/admin/auth/login`

**Production:**
- Login: `https://admin.contrezz.com`
- API: `https://api.contrezz.com/api/admin/auth/login`

### App User Authentication

**Local:**
- Login: `http://localhost:5173/login` or `http://app.contrezz.local:5173/login`
- API: `http://localhost:5000/api/auth/login`

**Production:**
- Login: `https://app.contrezz.com/login`
- API: `https://api.app.contrezz.com/api/auth/login`

---

## 📱 Quick Access Guide

### For Development

**Start Services:**
```bash
# Terminal 1: Public Backend
cd public-backend
npm run dev
# Runs on http://localhost:5001

# Terminal 2: App Backend
cd backend
npm run dev
# Runs on http://localhost:5000

# Terminal 3: Frontend
npm run dev
# Runs on http://localhost:5173
```

**Access Points:**
- Frontend: `http://localhost:5173`
- Public Admin: `http://localhost:5173/admin`
- Public API: `http://localhost:5001/health`
- App API: `http://localhost:5000/api/health`

### For Production

**Access Points:**
- Main Site: `https://contrezz.com`
- App: `https://app.contrezz.com`
- Public Admin: `https://admin.contrezz.com`
- Public API: `https://api.contrezz.com/health`
- App API: `https://api.app.contrezz.com/api/health`

---

## 🗺️ Domain Architecture Map

```
Production:
├── contrezz.com
│   ├── Landing pages
│   ├── Careers (public)
│   └── Blog
│
├── app.contrezz.com
│   ├── Login
│   ├── Dashboard
│   └── App features
│
├── admin.contrezz.com
│   ├── Public admin login
│   ├── Landing page management
│   ├── Career management
│   └── Analytics
│
├── api.contrezz.com
│   ├── Public API
│   └── Public admin API
│
└── api.app.contrezz.com
    └── Application API

Local:
├── localhost:5173
│   ├── All frontend (domain-based routing)
│   └── /admin → Public admin
│
├── localhost:5001
│   └── Public backend API
│
└── localhost:5000
    └── App backend API
```

---

## 🔍 Testing URLs

### Health Checks

**Local:**
- Public API: `curl http://localhost:5001/health`
- App API: `curl http://localhost:5000/api/health`

**Production:**
- Public API: `curl https://api.contrezz.com/health`
- App API: `curl https://api.app.contrezz.com/api/health`

### DNS Verification

```bash
# Check production DNS
dig contrezz.com +short
dig app.contrezz.com +short
dig admin.contrezz.com +short
dig api.contrezz.com +short
dig api.app.contrezz.com +short
```

---

## 📝 Notes

1. **Local Development**: All frontend routes are served from `localhost:5173` with client-side routing
2. **Production**: Each subdomain serves different content based on domain detection
3. **Public Admin**: Can be accessed via path (`/admin`) locally or subdomain (`admin.contrezz.com`) in production
4. **CORS**: Backend APIs must allow the frontend origins in `ALLOWED_ORIGINS` or `CORS_ORIGIN`

---

**Last Updated:** December 15, 2025  
**Status:** Complete URL reference for all environments
