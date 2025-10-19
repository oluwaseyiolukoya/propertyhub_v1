# PropertyHub Backend API

Backend API for the PropertyHub SaaS platform built with Express, TypeScript, Prisma, and PostgreSQL.

## 🚀 Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup PostgreSQL Database

Create a new PostgreSQL database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE propertyhub;

# Exit psql
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp env.example .env
```

Update the `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/propertyhub?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create database schema
npm run prisma:migrate
```

This will create all the necessary tables in your database.

### 5. Seed the Database

Populate the database with initial data (admin user, plans, sample customer):

```bash
npm run prisma:seed
```

### 6. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 🔑 Default Credentials

After seeding, you can login with these accounts:

**Super Admin:**
- Email: `admin@propertyhub.com`
- Password: `admin123`

**Property Owner:**
- Email: `john@metro-properties.com`
- Password: `owner123`

## 📚 API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/setup-password` - Setup password for new users
- `GET /api/auth/verify` - Verify JWT token

### Customers (Admin Only)

- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/:id/actions` - Customer actions (suspend, activate, etc.)

### Users (Admin Only)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Roles (Admin Only)

- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### Plans (Admin Only)

- `GET /api/plans` - Get all plans
- `POST /api/plans` - Create plan
- `PUT /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Delete plan

### Invoices (Admin Only)

- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice

### Support Tickets (Admin Only)

- `GET /api/support-tickets` - Get all tickets
- `GET /api/support-tickets/:id` - Get single ticket
- `POST /api/support-tickets` - Create ticket
- `PUT /api/support-tickets/:id` - Update ticket

### Analytics (Admin Only)

- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/system-health` - Get system health metrics
- `GET /api/analytics/activity-logs` - Get activity logs

### System Settings (Admin Only)

- `GET /api/system/settings` - Get all settings
- `GET /api/system/settings/:key` - Get single setting
- `POST /api/system/settings` - Create/update setting
- `DELETE /api/system/settings/:key` - Delete setting

## 🔐 Authentication

All API endpoints (except login and setup-password) require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Admin-only endpoints also require the user to have the `super_admin` or `admin` role.

## 🗄️ Database Schema

The database includes the following main entities:

- **Admin** - Super admin users
- **Customer** - Property management companies
- **User** - Property owners, managers, and tenants
- **Role** - User roles and permissions
- **Plan** - Subscription plans
- **Property** - Properties owned by customers
- **Unit** - Individual units within properties
- **Lease** - Tenant leases
- **Invoice** - Customer invoices
- **SupportTicket** - Support tickets
- **ActivityLog** - System activity logs
- **SystemSetting** - Platform settings

## 🛠️ Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma Client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

## 📊 Prisma Studio

You can view and edit your database using Prisma Studio:

```bash
npm run prisma:studio
```

This will open a web interface at `http://localhost:5555`

## 🔍 Troubleshooting

### Database Connection Error

If you get a database connection error, check:
1. PostgreSQL is running: `sudo service postgresql status`
2. Database exists: `psql -l | grep propertyhub`
3. Credentials in `.env` are correct

### Port Already in Use

If port 5000 is already in use, change it in `.env`:
```env
PORT=3001
```

### Prisma Client Not Generated

If you get "Cannot find module '@prisma/client'":
```bash
npm run prisma:generate
```

## 📝 Next Steps

1. Update the frontend to connect to these API endpoints
2. Implement email sending for invitations and notifications
3. Add file upload functionality for documents and images
4. Implement payment gateway integration
5. Add real-time features with WebSockets

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Proprietary - PropertyHub SaaS Platform


