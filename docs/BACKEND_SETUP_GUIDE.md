# 🚀 Contrezz Backend Setup Guide

This guide will walk you through setting up the complete backend infrastructure for Contrezz Super Admin dashboard.

## 📦 What We've Built

### Backend Architecture

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema with all models
│   └── seed.ts             # Initial data seeding
├── src/
│   ├── index.ts            # Express server entry point
│   ├── lib/
│   │   └── db.ts           # Prisma client configuration
│   ├── middleware/
│   │   └── auth.ts         # Authentication & authorization
│   └── routes/
│       ├── auth.ts         # Login, password setup, token verification
│       ├── customers.ts    # Customer CRUD & management
│       ├── users.ts        # User management
│       ├── roles.ts        # Role & permissions management
│       ├── plans.ts        # Subscription plans management
│       ├── invoices.ts     # Billing & invoices
│       ├── support-tickets.ts  # Support ticket system
│       ├── analytics.ts    # Dashboard analytics & metrics
│       └── system.ts       # Platform settings
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

### Database Models Created

#### Super Admin Models:
- **Admin** - Super admin user accounts
- **Customer** - Property management companies (your clients)
- **User** - All platform users (owners, managers, tenants)
- **Role** - User roles with permissions
- **Plan** - Subscription/pricing plans
- **Invoice** - Customer billing
- **SupportTicket** - Customer support system
- **ActivityLog** - Audit trail of all actions
- **SystemSetting** - Platform configuration

#### Property Management Models:
- **Property** - Properties owned by customers
- **Unit** - Individual rental units
- **PropertyManager** - Manager assignments
- **Lease** - Tenant lease agreements

## 🔧 Installation Steps

### 1. Install PostgreSQL

#### macOS (using Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows:
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Open PostgreSQL shell
psql postgres

# Create database
CREATE DATABASE contrezz;

# Create user (optional, or use default postgres user)
CREATE USER contrezz_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE contrezz TO contrezz_user;

# Exit
\q
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

Create `.env` file in the backend directory:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/contrezz?schema=public"

# Server
PORT=5000
NODE_ENV=development

# JWT Secret - CHANGE THIS TO A RANDOM STRING
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-use-random-string
JWT_EXPIRES_IN=7d

# CORS - Frontend URL
FRONTEND_URL=http://localhost:5173
```

**⚠️ IMPORTANT:** Change the `JWT_SECRET` to a strong random string in production!

### 5. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate

# When prompted for migration name, enter: "initial_setup"
```

### 6. Seed Initial Data

```bash
npm run prisma:seed
```

This creates:
- ✅ Super Admin account
- ✅ 3 Subscription plans (Starter, Professional, Enterprise)
- ✅ Sample customer (Metro Properties LLC)
- ✅ Sample property owner user
- ✅ Default roles (Property Owner, Property Manager, Tenant)
- ✅ System settings

### 7. Start the Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📝 Environment: development
🌐 CORS enabled for: http://localhost:5173
```

### 8. Verify Installation

Test the health endpoint:

```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ",
  "uptime": 1.234
}
```

## 🔐 Default Login Credentials

After seeding, use these credentials to test:

### Super Admin Dashboard:
```
Email: admin@contrezz.com
Password: admin123
User Type: Admin
```

### Property Owner Dashboard:
```
Email: john@metro-properties.com
Password: owner123
User Type: Owner
```

## 📊 View Database (Optional)

Open Prisma Studio to view/edit database visually:

```bash
npm run prisma:studio
```

Opens at: http://localhost:5555

## 🔌 API Endpoints Available

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/setup-password` - Set password for new users
- `GET /api/auth/verify` - Verify JWT token

### Customer Management (Admin Only)
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/:id/actions` - Customer actions (suspend/activate/etc)

### User Management (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Roles & Permissions (Admin Only)
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### Subscription Plans (Admin Only)
- `GET /api/plans` - List all plans
- `POST /api/plans` - Create plan
- `PUT /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Delete plan

### Billing & Invoices (Admin Only)
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice status

### Support Tickets (Admin Only)
- `GET /api/support-tickets` - List all tickets
- `GET /api/support-tickets/:id` - Get ticket details
- `POST /api/support-tickets` - Create ticket
- `PUT /api/support-tickets/:id` - Update ticket

### Analytics & Metrics (Admin Only)
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/system-health` - System health metrics
- `GET /api/analytics/activity-logs` - Activity logs

### System Settings (Admin Only)
- `GET /api/system/settings` - Get all settings
- `POST /api/system/settings` - Create/update setting
- `DELETE /api/system/settings/:key` - Delete setting

## 🧪 Testing the API

### Example: Login Request

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@contrezz.com",
    "password": "admin123",
    "userType": "admin"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@contrezz.com",
    "name": "Super Admin",
    "role": "super_admin",
    "userType": "admin"
  }
}
```

### Example: Get Customers (with auth)

```bash
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 🔄 Next Steps

### 1. Connect Frontend to Backend

Update your frontend `LoginPage.tsx` to call the API:

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginForm.email,
        password: loginForm.password,
        userType: loginForm.userType
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Store token
      localStorage.setItem('token', data.token);
      // Call onLogin with user data
      onLogin(data.user.userType, data.user);
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (error) {
    alert('Network error');
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Create API Service Layer

Create `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const api = {
  // Auth
  login: (email: string, password: string, userType: string) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password, userType })
    }).then(r => r.json()),

  // Customers
  getCustomers: () =>
    fetch(`${API_BASE_URL}/customers`, {
      headers: getAuthHeaders()
    }).then(r => r.json()),

  createCustomer: (data: any) =>
    fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Add more as needed...
};
```

## 🐛 Troubleshooting

### Issue: Database connection failed

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Ensure database exists: `psql -l | grep contrezz`

### Issue: Port 5000 already in use

**Solution:**
Change PORT in `.env`:
```env
PORT=3001
```

### Issue: Prisma Client errors

**Solution:**
```bash
npm run prisma:generate
```

### Issue: Migration failed

**Solution:**
Reset database and re-run:
```bash
npx prisma migrate reset
npm run prisma:migrate
npm run prisma:seed
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)

## 🎉 Success!

Your backend is now ready! The Super Admin dashboard can now:
- ✅ Authenticate users with JWT
- ✅ Manage customers (CRUD operations)
- ✅ Manage users and roles
- ✅ Handle subscription plans
- ✅ Track invoices and billing
- ✅ Support ticket system
- ✅ Analytics and reporting
- ✅ System settings management

All data is persisted in PostgreSQL and you have a fully functional REST API!


