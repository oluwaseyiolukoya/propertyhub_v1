# 🔐 Contrezz Login Credentials

## 🚀 Quick Start

### Start Both Servers:

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Frontend will run on: http://localhost:5173

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
Backend API will run on: http://localhost:5000

---

## 👤 Login Credentials

### 🔴 Super Admin
- **Email:** `admin@contrezz.com`
- **Password:** `admin123`
- **User Type:** Super Admin
- **Access:** Full system administration, customer management, billing, analytics, system health

### 🟢 Property Owner
- **Email:** `john@metro-properties.com`
- **Password:** `owner123`
- **User Type:** Property Owner
- **Access:** Portfolio management, properties, tenants, financials, managers, access control

### 🔵 Property Manager
- **Email:** `sarah@contrezz.com`
- **Password:** `manager123`
- **User Type:** Property Manager
- **Access:** Property management, tenants, payments, maintenance, notifications

### 🟡 Tenant
- **Email:** `mike@email.com`
- **Password:** `tenant123`
- **User Type:** Tenant
- **Access:** Dashboard, payments, maintenance requests, documents, settings

---

## ✅ TEST ACCOUNT (Created via Database - REAL DATA!)

### 🟢 Property Owner - Test Real Estate LLC
- **Email:** `john.doe@testrealestate.com`
- **Password:** `testowner123`
- **User Type:** Property Owner
- **Company:** Test Real Estate LLC
- **Status:** Trial (14 days)
- **Database:** ✅ Stored in PostgreSQL (Real Data!)
- **Customer ID:** `a130b338-85cd-455a-bd7a-9278f00b5a21`
- **User ID:** `b909a2c4-b781-48f4-aca8-d538b2a0260f`
- **Access:** Full property owner dashboard, can add properties, units, tenants

**Note:** This account was created through the Admin dashboard and is stored in the real PostgreSQL database. All actions with this account will persist!

---

## 🔵 PROPERTY MANAGERS (Real Database Accounts)

All property managers below have been created in the real PostgreSQL database and can log in with the test password:

### Password for ALL managers: `password123`

1. **Oluwaseyi**
   - **Email:** `demo@example.com`
   - **Password:** `password123`
   - **User Type:** Property Manager
   - **Status:** ✅ Active

2. **Johnson**
   - **Email:** `johnson@gmail.com`
   - **Password:** `password123`
   - **User Type:** Property Manager
   - **Status:** ✅ Active

3. **Oluwaseyi**
   - **Email:** `demo_manager@gmail.com`
   - **Password:** `password123`
   - **User Type:** Property Manager
   - **Status:** ✅ Active

4. **John Adeleke**
   - **Email:** `demojohn@example.com`
   - **Password:** `password123`
   - **User Type:** Property Manager
   - **Status:** ✅ Active

5. **Tola Adebanjo**
   - **Email:** `tolaadebanjo@gmail.com`
   - **Password:** `password123`
   - **User Type:** Property Manager
   - **Status:** ✅ Active

**Note:** These managers are stored in the real database. You can assign them to properties in the Owner Dashboard!

---

## 🗄️ Database Status

**Current Setup:** ✅ **PostgreSQL Connected & Operational!**
- ✅ **Real PostgreSQL database** running on `localhost:5432`
- ✅ **Database name:** `contrezz`
- ✅ **16 tables created** and ready
- ✅ **Prisma Studio** available at http://localhost:5555
- ✅ **Real data persistence** - all changes are saved!
- ✅ **Mock authentication** still works for demo accounts (admin, owner, manager, tenant)
- ✅ **Database authentication** works for accounts created via Admin dashboard

**Database Browser:** Open http://localhost:5555 to view and edit data in Prisma Studio!

**Database Setup:** ✅ Already completed!
- ✅ PostgreSQL installed via Postgres.app
- ✅ Database `contrezz` created
- ✅ `backend/.env` configured  
- ✅ All migrations completed
- ✅ Prisma Studio running on port 5555

---

## 🎯 Testing Each Dashboard

### Test Super Admin:
1. Login with `admin@contrezz.com` / `admin123`
2. Access: Customers, Users, Billing, Analytics, Support Tickets, Platform Settings

### Test Property Owner:
1. Login with `john@metro-properties.com` / `owner123`
2. Access: Portfolio, Properties, Payments, Financial Reports, Managers, Access Control

### Test Property Manager:
1. Login with `sarah@contrezz.com` / `manager123`
2. Access: Properties, Tenants, Payments, Maintenance, Notifications, Documents

### Test Tenant:
1. Login with `mike@email.com` / `tenant123`
2. Access: Dashboard, Payments, Maintenance, Documents, Settings

---

## 🔧 Troubleshooting

### Login Not Working?
1. **Check Backend:** `curl http://localhost:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@contrezz.com","password":"admin123","userType":"admin"}'`
2. **Check Frontend:** Visit http://localhost:5173
3. **Clear Browser Cache:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. **Check Console:** Open browser DevTools (F12) and check for errors

### Backend Port Already in Use?
```bash
# Kill existing process
pkill -f "tsx watch"
# Restart backend
cd backend && npm run dev
```

### Frontend Not Loading?
```bash
# Kill existing process
pkill -f "vite"
# Restart frontend
npm run dev
```

---

## 📊 API Endpoints

**Base URL:** `http://localhost:5000/api`

### Authentication:
- `POST /auth/login` - User login
- `POST /auth/setup-password` - Setup password for new users
- `GET /auth/verify` - Verify auth token

### Admin Routes:
- `/customers` - Customer management
- `/users` - User management
- `/plans` - Subscription plans
- `/invoices` - Billing & invoices
- `/analytics` - System analytics
- `/system` - System settings

### Owner/Manager Routes:
- `/properties` - Property management
- `/units` - Unit management
- `/leases` - Lease management
- `/payments` - Payment management
- `/maintenance` - Maintenance requests

### Tenant Routes:
- `/tenant/dashboard` - Tenant dashboard data
- `/tenant/payments` - Tenant payments
- `/tenant/maintenance` - Maintenance requests

---

## 🎨 Features by Dashboard

### Super Admin Dashboard:
- ✅ Customer Management (Add, View, Suspend, Delete)
- ✅ User Management (Roles, Permissions)
- ✅ Billing & Plans (Subscription management)
- ✅ Analytics Dashboard (Revenue, Customer stats)
- ✅ System Health Monitoring
- ✅ Support Tickets (Create, Assign, Resolve)
- ✅ Platform Settings (System config, Email, Integrations)

### Property Owner Dashboard:
- ✅ Portfolio Overview (Properties, Revenue, Occupancy)
- ✅ Properties Management (Add, Edit, View all properties)
- ✅ Tenant Payments (Track, View payment history)
- ✅ Financial Reports (Income, Expenses, ROI)
- ✅ Property Managers (Hire, Manage, Performance)
- ✅ Access Control (Keycards, Access logs)
- ✅ Documents (Contracts, Leases, Policies)
- ✅ Settings (Profile, Notifications, Security)

### Property Manager Dashboard:
- ✅ Overview (Properties, Tenants, Maintenance stats)
- ✅ Property Management (Units, Occupancy, Financials)
- ✅ Tenant Management (Add, View, Lease management)
- ✅ Payment Management (Collect, Track, Reminders)
- ✅ Maintenance Tickets (Create, Assign, Track)
- ✅ Access Control (Keycards, Entry logs)
- ✅ Notifications (Send to tenants, View history)
- ✅ Documents (Generate, Upload, Share)
- ✅ Settings (Profile, Preferences)

### Tenant Dashboard:
- ✅ Dashboard Overview (Rent status, Unit info, Quick actions)
- ✅ Payments (Pay rent, View history, Payment methods, Auto-pay)
- ✅ Maintenance Requests (Submit, Track, View status)
- ✅ Documents (View lease, Download receipts)
- ✅ Settings (Profile, Notifications, Emergency contacts)

---

## 💡 Tips

1. **Responsive Design:** All dashboards work on mobile, tablet, and desktop
2. **Mock Data:** All data is demo data for testing purposes
3. **Real-time Updates:** Changes are reflected immediately in the UI
4. **Search & Filter:** Most tables have search and filter functionality
5. **Currency:** Default currency is Naira (₦)

---

## 🐛 Known Issues

- Database connection is disabled (using mock data)
- Email notifications not configured
- File uploads not implemented (mock only)

---

## 📝 Notes

- This is a development setup with mock data
- For production, set up PostgreSQL and configure environment variables
- Change default passwords in production
- Configure email SMTP for notifications
- Set up proper JWT secrets and security settings

---

**Last Updated:** October 17, 2025
**Version:** 1.0.0
