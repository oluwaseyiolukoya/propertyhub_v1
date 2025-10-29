# Property Management System - Backend

Express.js backend with TypeScript, Prisma ORM, and PostgreSQL.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts          # Application entry point
│   ├── routes/           # API route handlers
│   │   ├── auth.ts       # Authentication
│   │   ├── properties.ts # Property management
│   │   ├── payments.ts   # Payment processing
│   │   ├── tenants.ts    # Tenant management
│   │   └── ...
│   ├── middleware/
│   │   └── auth.ts       # JWT authentication middleware
│   ├── lib/
│   │   ├── db.ts         # Prisma client
│   │   ├── socket.ts     # Socket.io setup
│   │   └── ...
│   ├── services/         # Business logic (recommended)
│   ├── controllers/      # HTTP controllers (recommended)
│   └── repositories/     # Data access layer (recommended)
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts           # Database seeding
├── scripts/
│   └── ...               # Utility scripts
└── uploads/              # File uploads
```

## 🏗️ Architecture (Recommended)

### Layered Architecture

```
Routes (HTTP) → Controllers → Services → Repositories → Database
```

1. **Routes** (`src/routes/`): Define HTTP endpoints, validate requests
2. **Controllers** (`src/controllers/`): Handle HTTP req/res, call services
3. **Services** (`src/services/`): Business logic, orchestrate repositories
4. **Repositories** (`src/repositories/`): Data access, Prisma queries

### Migration Guide

To refactor existing code:

```typescript
// Before (route with mixed concerns)
router.get('/payments', async (req, res) => {
  const payments = await prisma.payments.findMany({ ... });
  res.json(payments);
});

// After (layered)
// routes/payments.ts
router.get('/payments', paymentsController.list);

// controllers/payments.controller.ts
export const list = async (req, res) => {
  const payments = await paymentsService.getPayments(req.query);
  res.json(payments);
};

// services/payments.service.ts
export const getPayments = async (filters) => {
  return paymentsRepository.findMany(filters);
};

// repositories/payments.repository.ts
export const findMany = async (filters) => {
  return prisma.payments.findMany({ where: filters });
};
```

## 🔧 Environment Variables

Required in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Authentication
JWT_SECRET="your-secret-key-min-32-chars"

# Payment Gateway (Paystack)
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."

# Optional
NODE_ENV="development"
PORT="3000"
REDIS_URL="redis://localhost:6379"  # For Socket.io scaling
```

## 📊 Database

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed

# Push schema without migrations (dev only)
npx prisma db push
```

### Schema Management

- Edit `prisma/schema.prisma` for schema changes
- Run `npx prisma migrate dev` to create migrations
- Migrations are in `prisma/migrations/`

## 🔐 Authentication

JWT-based authentication with role-based access control.

### Roles
- `SUPER_ADMIN`: Platform administrator
- `OWNER`: Property owner
- `MANAGER`: Property manager
- `TENANT`: Property tenant

### Middleware

```typescript
import { authenticateToken } from './middleware/auth';

// Protect route
router.get('/protected', authenticateToken, (req, res) => {
  // req.user contains authenticated user
  res.json({ user: req.user });
});
```

## 💳 Payment Integration

Paystack integration for payment processing.

### Configuration
- Owners configure their Paystack keys in settings
- Platform uses separate keys for subscriptions
- Webhook endpoint: `/api/paystack/webhook`

### Payment Flow
1. Initialize payment: `POST /api/payments/initialize`
2. Redirect to Paystack checkout
3. Paystack webhook confirms payment
4. Verify transaction: `GET /api/payments/verify/:reference`

## 🔌 Real-time Updates

Socket.io for real-time notifications.

### Events
- `paymentStatusUpdated`: Payment status changes
- `permissionsUpdated`: User permissions changed
- `accountBlocked`: Account status changed

### Usage

```typescript
import { io } from './lib/socket';

// Emit to specific user
io.to(`user:${userId}`).emit('paymentStatusUpdated', data);

// Emit to all property managers
io.to(`property:${propertyId}:managers`).emit('event', data);
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📝 API Documentation

See main docs:
- [Property Owner API](../docs/PROPERTY_OWNER_API_GUIDE.md)
- [Property Manager API](../docs/PROPERTY_MANAGER_API_GUIDE.md)
- [Tenant API](../docs/TENANT_API_GUIDE.md)

## 🐛 Debugging

```bash
# Enable Prisma query logging
# In .env
DATABASE_URL="postgresql://...?connection_limit=5&pool_timeout=20"

# Run with debug logs
DEBUG=* npm run dev

# Check database connections
npx prisma db execute --stdin <<< "SELECT count(*) FROM pg_stat_activity;"
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure production `DATABASE_URL`
- [ ] Run `npx prisma migrate deploy`
- [ ] Set up Redis for Socket.io (optional)
- [ ] Configure CORS for frontend domain
- [ ] Set up SSL/TLS
- [ ] Configure logging and monitoring

### Build

```bash
npm run build
npm start
```

## 📦 Dependencies

### Core
- `express`: Web framework
- `prisma`: ORM
- `@prisma/client`: Prisma client
- `jsonwebtoken`: JWT authentication
- `bcrypt`: Password hashing
- `socket.io`: Real-time communication

### Payment
- `axios`: HTTP client for Paystack API

### Development
- `typescript`: Type safety
- `ts-node-dev`: Development server
- `@types/*`: TypeScript definitions

## 🤝 Contributing

1. Follow the layered architecture pattern
2. Add tests for new features
3. Update API documentation
4. Run type checking before committing

---

For more information, see [../docs/README.md](../docs/README.md)
