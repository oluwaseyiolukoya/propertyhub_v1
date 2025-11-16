# 🚀 Quick Start Guide - Contrezz Platform

## ✅ System Status

**All services are now running correctly!**

- ✅ Backend API: http://localhost:5000
- ✅ Frontend App: http://localhost:5173
- ✅ Database: PostgreSQL connected
- ✅ Authentication: Working

---

## 🔑 Login Credentials

### Admin Access
```
Email: admin@contrezz.com
Password: admin123
```
**Access**: Full admin dashboard, onboarding management, all features

### Property Owner (Test)
```
Email: john@metro-properties.com
Password: owner123
```
**Access**: Property owner dashboard

### Property Manager (Test)
```
Email: manager@metro-properties.com
Password: manager123
```
**Access**: Property manager dashboard

---

## 🎯 How to Access

### 1. Open the Application
Navigate to: **http://localhost:5173**

### 2. Admin Login
1. Click **"Admin Login"** button (top right)
2. Enter admin credentials (see above)
3. Click **"Sign In"**
4. You'll be redirected to the Admin Dashboard

### 3. Explore Onboarding System
1. In Admin Dashboard, click **"Onboarding"** tab
2. View all submitted applications
3. Review, approve, or reject applications

### 4. Test Public Onboarding
1. Go back to landing page (click logo)
2. Click **"Get Started"** button
3. Fill out the onboarding form
4. Submit application
5. View it in Admin Dashboard → Onboarding tab

---

## 🛠️ Development Commands

### Start Backend
```bash
cd backend
npm run dev
```
**Runs on**: http://localhost:5000

### Start Frontend
```bash
npm run dev
```
**Runs on**: http://localhost:5173

### Start Prisma Studio
```bash
cd backend
npx prisma studio
```
**Runs on**: http://localhost:5555

### Stop All Services
```bash
# Stop backend
pkill -f "tsx watch"

# Stop frontend
pkill -f "vite"

# Stop Prisma Studio
pkill -f "prisma studio"
```

---

## 🔍 Verify Everything is Working

### Check Backend
```bash
curl http://localhost:5000/health
```
**Expected**: `{"status":"ok",...}`

### Check Frontend
Open browser: http://localhost:5173

### Check Database
```bash
cd backend
npx prisma studio
```
Browse tables in Prisma Studio

### Test Login API
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@contrezz.com","password":"admin123"}'
```
**Expected**: `{"token":"...","user":{...}}`

---

## 📋 Key Features to Test

### ✅ Admin Dashboard
- [x] Login with admin credentials
- [x] View dashboard overview
- [x] Navigate between tabs
- [x] View analytics
- [x] Manage users
- [x] **NEW**: Onboarding management

### ✅ Onboarding System
- [x] Public "Get Started" page
- [x] Multi-step form (Property Owner, Manager, Tenant)
- [x] Application submission
- [x] Admin review dashboard
- [x] Application status tracking
- [x] Approve/Reject workflow
- [x] Account activation

### ✅ Public Pages
- [x] Landing page
- [x] About Us
- [x] Pricing
- [x] API Documentation
- [x] Integrations
- [x] Contact Us
- [x] Schedule Demo
- [x] Blog
- [x] Careers
- [x] Help Center
- [x] Community
- [x] Status
- [x] Security

---

## 🐛 Troubleshooting

### Issue: Login not working
**Solution**: Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: Backend not responding
**Solution**: 
```bash
cd backend
pkill -f "tsx watch"
npm run dev
```

### Issue: Frontend not loading
**Solution**:
```bash
pkill -f "vite"
npm run dev
```

### Issue: Database error
**Solution**:
```bash
cd backend
npx prisma generate
npx prisma db push
```

### Issue: Port already in use
**Solution**:
```bash
# Find process
lsof -i :5000  # or :5173

# Kill it
kill -9 <PID>
```

---

## 📊 System Architecture

```
Frontend (React)          Backend (Express)       Database (PostgreSQL)
http://localhost:5173 --> http://localhost:5000 --> localhost:5432
                          
- Landing Page            - Auth API              - users
- Get Started            - Onboarding API        - onboarding_applications
- Admin Dashboard        - Admin API             - customers
- All Public Pages       - All Business Logic    - 30+ tables
```

---

## 🎉 What's New

### Onboarding System (Just Implemented)
- ✅ Public application form
- ✅ Admin review dashboard
- ✅ Multi-step workflow
- ✅ Email notifications (ready)
- ✅ Status tracking
- ✅ Account activation

### Recent Fixes
- ✅ Fixed bcrypt import error
- ✅ Configured correct API port
- ✅ Restarted all services
- ✅ Verified authentication

---

## 📞 Need Help?

### Check Logs
```bash
# Backend logs
tail -f backend/backend-dev.log

# Frontend logs (in terminal where npm run dev is running)
```

### Database Access
```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### API Testing
Use tools like:
- **Postman**: Import API endpoints
- **curl**: Command-line testing
- **Browser DevTools**: Network tab

---

## ✅ Current Status Summary

**Last Updated**: November 8, 2025

| Service | Status | URL | Notes |
|---------|--------|-----|-------|
| Frontend | ✅ Running | http://localhost:5173 | Vite dev server |
| Backend | ✅ Running | http://localhost:5000 | Express + TypeScript |
| Database | ✅ Connected | localhost:5432 | PostgreSQL |
| Auth | ✅ Working | /api/auth/* | JWT tokens |
| Onboarding | ✅ Ready | /api/onboarding/* | Public + Admin |

**All systems operational!** 🎉

---

## 🚀 Next Steps

1. **Test Admin Login**: http://localhost:5173 → Admin Login
2. **Explore Onboarding**: Admin Dashboard → Onboarding tab
3. **Test Public Flow**: Landing Page → Get Started
4. **Review Applications**: Admin Dashboard → Onboarding
5. **Approve/Activate**: Test full workflow

**You're all set!** 🎊


