# Project Directory Structure

```
property-management-system/
├── backend/                          # Express.js backend
│   ├── src/
│   │   ├── index.ts                  # Application entry point
│   │   ├── routes/                   # API route handlers
│   │   │   ├── auth.ts               # Authentication & authorization
│   │   │   ├── properties.ts         # Property CRUD
│   │   │   ├── units.ts              # Unit management
│   │   │   ├── tenants.ts            # Tenant management
│   │   │   ├── leases.ts             # Lease management
│   │   │   ├── payments.ts           # Payment processing
│   │   │   ├── invoices.ts           # Invoice management
│   │   │   ├── expenses.ts           # Expense tracking
│   │   │   ├── settings.ts           # Payment gateway settings
│   │   │   ├── paystack.ts           # Paystack webhooks
│   │   │   ├── analytics.ts          # Analytics & reports
│   │   │   ├── dashboard.ts          # Dashboard data
│   │   │   ├── system.ts             # System settings
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT authentication middleware
│   │   ├── lib/
│   │   │   ├── db.ts                 # Prisma client
│   │   │   ├── socket.ts             # Socket.io setup
│   │   │   └── mock-db.ts            # Mock database (deprecated)
│   │   ├── services/                 # Business logic (recommended)
│   │   │   └── README.md
│   │   ├── controllers/              # HTTP controllers (recommended)
│   │   │   └── README.md
│   │   └── repositories/             # Data access layer (recommended)
│   │       └── README.md
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── migrations/               # Database migrations
│   │   └── seed.ts                   # Database seeding
│   ├── scripts/
│   │   ├── seed-metro-demo.ts        # Demo data seeding
│   │   └── ...
│   ├── uploads/                      # File uploads
│   │   └── logos/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md                     # Backend documentation
│
├── src/                              # React frontend
│   ├── main.tsx                      # Application entry point
│   ├── App.tsx                       # Main app component & routing
│   ├── index.css                     # Global styles
│   ├── components/                   # React components
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── figma/                    # Figma-generated components
│   │   ├── LoginPage.tsx
│   │   ├── SuperAdminDashboard.tsx
│   │   ├── PropertyOwnerDashboard.tsx
│   │   ├── PropertyManagerDashboard.tsx
│   │   ├── TenantDashboard.tsx
│   │   ├── PropertiesPage.tsx
│   │   ├── TenantManagement.tsx
│   │   ├── TenantPaymentsPage.tsx
│   │   ├── PaymentManagement.tsx
│   │   ├── FinancialReports.tsx
│   │   ├── PropertyOwnerSettings.tsx
│   │   ├── BillingPlansAdmin.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api/                      # API client functions
│   │   │   ├── auth.ts
│   │   │   ├── properties.ts
│   │   │   ├── tenants.ts
│   │   │   ├── payments.ts
│   │   │   ├── settings.ts
│   │   │   └── ...
│   │   ├── api-client.ts             # HTTP client wrapper
│   │   ├── api-config.ts             # API endpoint configuration
│   │   ├── permissions.ts            # Permission utilities
│   │   ├── currency.ts               # Currency utilities
│   │   ├── CurrencyContext.tsx       # Currency context provider
│   │   ├── socket.ts                 # Socket.io client
│   │   ├── sessionManager.ts         # Session management
│   │   ├── sessionValidator.ts       # Session validation
│   │   └── utils.ts                  # General utilities
│   ├── features/                     # Feature modules (recommended)
│   │   ├── payments/
│   │   ├── tenants/
│   │   ├── properties/
│   │   └── README.md
│   └── types/                        # TypeScript types (recommended)
│       └── README.md
│
├── docs/                             # Documentation
│   ├── README.md                     # Documentation index
│   ├── setup/                        # Setup & deployment guides
│   │   ├── QUICK_START_CHECKLIST.md
│   │   ├── LOCAL_SETUP.md
│   │   ├── ENV_SETUP.md
│   │   └── DEPLOYMENT_GUIDE.md
│   ├── guides/                       # How-to guides
│   │   ├── MULTI_CURRENCY_GUIDE.md
│   │   ├── DEVELOPMENT_WORKFLOW.md
│   │   ├── TENANT_LOGIN_GUIDE.md
│   │   └── PERMISSION_DEBUGGING_GUIDE.md
│   ├── features/                     # Feature documentation
│   │   ├── TENANT_ACTIONS_WORKING_FEATURE.md
│   │   ├── PAYMENT_METHODS_IMPLEMENTATION.md
│   │   ├── EXPENSE_MANAGEMENT_COMPLETE.md
│   │   └── ...
│   ├── architecture/                 # Architecture docs
│   │   └── EXPENSE_ARCHITECTURE_GUIDE.md
│   ├── reports/                      # Status reports
│   │   ├── BANK_TRANSFER_TEMPLATE_FEATURE.md
│   │   └── LOGIN_ISSUE_RESOLVED.md
│   ├── archive/                      # Historical docs & fixes
│   │   ├── TENANT_LOGIN_FIXED.md
│   │   ├── MANAGER_DASHBOARD_FIX.md
│   │   └── ...
│   ├── API_INTEGRATION_SUMMARY.md
│   ├── PROPERTY_OWNER_API_GUIDE.md
│   ├── PROPERTY_MANAGER_API_GUIDE.md
│   ├── TENANT_API_GUIDE.md
│   ├── DATABASE_SETUP_COMPLETE.md
│   ├── BACKEND_SETUP_GUIDE.md
│   ├── POSTGRESQL_SETUP_GUIDE.md
│   ├── LOGIN_CREDENTIALS.md
│   ├── PRODUCTION_READY_AUTH.md
│   ├── REALTIME_UPDATES_GUIDE.md
│   ├── ROLE_CHANGE_BEST_PRACTICES.md
│   └── ACTIVE_SESSION_VALIDATION.md
│
├── logs/                             # Application logs
│   └── server-dev.log
│
├── package.json                      # Frontend dependencies
├── tsconfig.json                     # TypeScript config
├── vite.config.ts                    # Vite config
├── tailwind.config.js                # Tailwind CSS config
├── postcss.config.js                 # PostCSS config
├── index.html                        # HTML entry point
├── .gitignore                        # Git ignore rules
├── README.md                         # Project overview
└── DIRECTORY_STRUCTURE.md            # This file
```

## 📁 Directory Conventions

### Backend (`backend/`)

#### Current Structure
- **`src/routes/`**: API endpoints (currently contains all logic)
- **`src/middleware/`**: Express middleware (auth, validation)
- **`src/lib/`**: Utilities, database client, Socket.io

#### Recommended Structure (for refactoring)
- **`src/services/`**: Business logic layer
  - Pure functions, no HTTP concerns
  - Orchestrates repositories
  - Example: `payments.service.ts`
  
- **`src/controllers/`**: HTTP request/response handlers
  - Validates input
  - Calls services
  - Formats responses
  - Example: `payments.controller.ts`
  
- **`src/repositories/`**: Data access layer
  - All Prisma queries
  - Database operations
  - Example: `payments.repository.ts`

### Frontend (`src/`)

#### Current Structure
- **`components/`**: All React components (currently flat)
- **`lib/api/`**: API client functions
- **`lib/`**: Utilities and context providers

#### Recommended Structure (for refactoring)
- **`features/`**: Feature-based modules
  - `features/payments/`: Payment-related components, hooks, API
  - `features/tenants/`: Tenant-related components, hooks, API
  - `features/properties/`: Property-related components, hooks, API
  - Each feature contains: `components/`, `hooks/`, `api/`, `utils/`, `types.ts`

- **`types/`**: Shared TypeScript types
  - `api.ts`: API request/response types
  - `domain.ts`: Domain entities
  - `auth.ts`: Authentication types
  - `payments.ts`: Payment types

- **`components/ui/`**: Generic, reusable UI components (keep as is)

### Documentation (`docs/`)

- **`setup/`**: Installation and deployment
- **`guides/`**: How-to guides for developers
- **`features/`**: Feature-specific documentation
- **`architecture/`**: System design documents
- **`reports/`**: Status and progress reports
- **`archive/`**: Historical fixes and deprecated docs

## 🔄 Migration Strategy

### Backend Refactoring

1. **Phase 1**: Create service layer
   - Extract business logic from routes to services
   - Start with high-value modules (payments, tenants)

2. **Phase 2**: Create repository layer
   - Move Prisma queries to repositories
   - Services call repositories instead of Prisma directly

3. **Phase 3**: Create controller layer
   - Move HTTP handling to controllers
   - Routes become thin wrappers

### Frontend Refactoring

1. **Phase 1**: Create type definitions
   - Extract types from components to `src/types/`
   - Create barrel exports

2. **Phase 2**: Organize by feature
   - Group related components into `src/features/`
   - Move API clients into feature folders

3. **Phase 3**: Extract custom hooks
   - Create reusable hooks per feature
   - Share common hooks in `src/lib/hooks/`

## 📝 Naming Conventions

### Files
- **Components**: PascalCase (e.g., `TenantPaymentsPage.tsx`)
- **Utilities**: camelCase (e.g., `api-client.ts`)
- **Types**: camelCase with `.types.ts` suffix (e.g., `payment.types.ts`)
- **Tests**: Same as source with `.test.ts` suffix

### Folders
- **Features**: kebab-case (e.g., `tenant-management/`)
- **Components**: PascalCase (e.g., `PaymentOverview/`)

### Code
- **Variables/Functions**: camelCase
- **Classes/Interfaces/Types**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Private members**: prefix with `_`

## 🎯 Best Practices

1. **Separation of Concerns**: Keep business logic separate from HTTP/UI
2. **Single Responsibility**: Each file/function does one thing well
3. **DRY**: Don't repeat yourself - extract common logic
4. **Type Safety**: Use TypeScript types everywhere
5. **Documentation**: Add README to each major directory
6. **Testing**: Colocate tests with source files

## 🔗 Related Documentation

- [Backend README](backend/README.md)
- [Frontend Features Guide](src/features/README.md)
- [API Documentation](docs/README.md)
- [Development Workflow](docs/guides/DEVELOPMENT_WORKFLOW.md)

---

**Last Updated**: October 2025
