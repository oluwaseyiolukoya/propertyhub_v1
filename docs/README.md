# Property Management System - Documentation Index

## 📚 Quick Start
- [Quick Start Checklist](setup/QUICK_START_CHECKLIST.md)
- [Local Setup Guide](setup/LOCAL_SETUP.md)
- [Environment Setup](setup/ENV_SETUP.md)
- [Deployment Guide](setup/DEPLOYMENT_GUIDE.md)

## 🏗️ Architecture & Design
- [Expense Architecture Guide](architecture/EXPENSE_ARCHITECTURE_GUIDE.md)
- [API Integration Summary](API_INTEGRATION_SUMMARY.md)

## 📖 User Guides
- [Multi-Currency Guide](guides/MULTI_CURRENCY_GUIDE.md)
- [Development Workflow](guides/DEVELOPMENT_WORKFLOW.md)
- [Tenant Login Guide](guides/TENANT_LOGIN_GUIDE.md)
- [Permission Debugging Guide](guides/PERMISSION_DEBUGGING_GUIDE.md)
- [Production-Ready Auth](PRODUCTION_READY_AUTH.md)
- [Realtime Updates Guide](REALTIME_UPDATES_GUIDE.md)
- [Role Change Best Practices](ROLE_CHANGE_BEST_PRACTICES.md)
- [Active Session Validation](ACTIVE_SESSION_VALIDATION.md)

## 🎯 Feature Documentation

### Tenant Management
- [Tenant Actions Working Feature](features/TENANT_ACTIONS_WORKING_FEATURE.md)
- [Tenant Actions Menu Feature](features/TENANT_ACTIONS_MENU_FEATURE.md)
- [Tenant Assignment Feature](features/TENANT_ASSIGNMENT_FEATURE.md)
- [Tenant Invitation Feature](features/TENANT_INVITATION_FEATURE.md)
- [Tenant Feature Complete](features/TENANT_FEATURE_COMPLETE.md)

### Access Control & Permissions
- [Access Control Real Data Complete](features/ACCESS_CONTROL_REAL_DATA_COMPLETE.md)
- [Access Control Renamed](features/ACCESS_CONTROL_RENAMED.md)
- [Access Control Stats Complete](features/ACCESS_CONTROL_STATS_COMPLETE.md)
- [Access Control Tooltips Added](features/ACCESS_CONTROL_TOOLTIPS_ADDED.md)
- [Manager Permissions Control](features/MANAGER_PERMISSIONS_CONTROL.md)
- [Granular Manager Permissions](features/GRANULAR_MANAGER_PERMISSIONS.md)
- [Permissions Database Integration](features/PERMISSIONS_DATABASE_INTEGRATION.md)

### Expense Management
- [Expense Management Complete](features/EXPENSE_MANAGEMENT_COMPLETE.md)
- [Expense Management Module](features/EXPENSE_MANAGEMENT_MODULE.md)
- [Expense Management Phase 1 Complete](features/EXPENSE_MANAGEMENT_PHASE1_COMPLETE.md)
- [Expense Dashboard Integration](features/EXPENSE_DASHBOARD_INTEGRATION.md)
- [Expense Visibility Control](features/EXPENSE_VISIBILITY_CONTROL.md)
- [Expense Visibility Update](features/EXPENSE_VISIBILITY_UPDATE.md)
- [Property Expenses Pagination](features/PROPERTY_EXPENSES_PAGINATION.md)

### Payment System
- [Payment Methods Implementation](features/PAYMENT_METHODS_IMPLEMENTATION.md)
- [Payment Overview Complete](features/PAYMENT_OVERVIEW_COMPLETE.md)
- [Payment Analytics Real Data](features/PAYMENT_ANALYTICS_REAL_DATA.md)

### Property & Unit Management
- [Delete Unit Feature](features/DELETE_UNIT_FEATURE.md)
- [Edit Unit Feature](features/EDIT_UNIT_FEATURE.md)
- [Unit Details Dialog](features/UNIT_DETAILS_DIALOG.md)

### Manager Features
- [Manager Unit Actions Menu](features/MANAGER_UNIT_ACTIONS_MENU.md)
- [Manager Analytics Feature](features/MANAGER_ANALYTICS_FEATURE.md)
- [Manager Activity Pagination Feature](features/MANAGER_ACTIVITY_PAGINATION_FEATURE.md)

### Owner Features
- [Owner Activity Pagination Feature](features/OWNER_ACTIVITY_PAGINATION_FEATURE.md)

## 📊 Status Reports
- [Bank Transfer Template Feature](reports/BANK_TRANSFER_TEMPLATE_FEATURE.md)
- [Login Issue Resolved](reports/LOGIN_ISSUE_RESOLVED.md)

## 🗄️ API Documentation
- [Property Manager API Guide](PROPERTY_MANAGER_API_GUIDE.md)
- [Property Owner API Guide](PROPERTY_OWNER_API_GUIDE.md)
- [Tenant API Guide](TENANT_API_GUIDE.md)

## 🔧 Database & Backend
- [Database Setup Complete](DATABASE_SETUP_COMPLETE.md)
- [Backend Setup Guide](BACKEND_SETUP_GUIDE.md)
- [PostgreSQL Setup Guide](POSTGRESQL_SETUP_GUIDE.md)

## 📝 Credentials & Access
- [Login Credentials](LOGIN_CREDENTIALS.md)

## 📦 Archive
Historical bug fixes, troubleshooting docs, and deprecated features are in [archive/](archive/)

---

## 🏛️ Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic (recommended)
│   │   ├── controllers/     # HTTP handlers (recommended)
│   │   ├── repositories/    # Data access layer (recommended)
│   │   ├── middleware/      # Auth, validation
│   │   └── lib/             # Utilities, DB, socket
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   └── scripts/             # Seed, migration scripts
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   └── figma/           # Figma-generated components
│   ├── features/            # Feature modules (recommended)
│   │   ├── payments/
│   │   ├── tenants/
│   │   └── properties/
│   ├── lib/
│   │   ├── api/             # API client functions
│   │   └── utils/           # Utilities
│   └── types/               # TypeScript types (recommended)
├── docs/                    # Documentation
│   ├── setup/               # Setup guides
│   ├── guides/              # How-to guides
│   ├── features/            # Feature docs
│   ├── architecture/        # Architecture docs
│   ├── reports/             # Status reports
│   └── archive/             # Historical docs
└── logs/                    # Application logs
```

## 🚀 Getting Started

1. **Setup**: Follow [Quick Start Checklist](setup/QUICK_START_CHECKLIST.md)
2. **Development**: Read [Development Workflow](guides/DEVELOPMENT_WORKFLOW.md)
3. **API**: Check API guides for your role (Owner/Manager/Tenant)
4. **Features**: Browse [features/](features/) for specific functionality

## 🤝 Contributing

When adding new features:
1. Create feature documentation in `docs/features/`
2. Update this index
3. Follow the architecture patterns in `docs/architecture/`
4. Test with the credentials in [Login Credentials](LOGIN_CREDENTIALS.md)
