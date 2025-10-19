# PropertyHub Documentation

Welcome to the PropertyHub documentation! This directory contains all guides and references for the PropertyHub SaaS platform.

## 📚 Main Documentation

### Setup Guides
- **[Backend Setup Guide](BACKEND_SETUP_GUIDE.md)** - Complete guide to setting up the backend server
- **[PostgreSQL Setup Guide](POSTGRESQL_SETUP_GUIDE.md)** - Database installation and configuration
- **[Database Setup Complete](DATABASE_SETUP_COMPLETE.md)** - Final database setup verification

### API Documentation
- **[API Integration Summary](API_INTEGRATION_SUMMARY.md)** - Overview of all API endpoints
- **[Property Owner API Guide](PROPERTY_OWNER_API_GUIDE.md)** - API documentation for Property Owner dashboard
- **[Property Manager API Guide](PROPERTY_MANAGER_API_GUIDE.md)** - API documentation for Property Manager dashboard
- **[Tenant API Guide](TENANT_API_GUIDE.md)** - API documentation for Tenant portal

### Access & Credentials
- **[Login Credentials](LOGIN_CREDENTIALS.md)** - Login credentials for all user types and dashboards

---

## 🗄️ Archive

The `archive/` folder contains historical documentation about bug fixes and feature implementations during development. These are kept for reference but are no longer actively maintained.

---

## 🚀 Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   cd backend && npm install
   ```

2. **Setup Database:**
   - Follow [PostgreSQL Setup Guide](POSTGRESQL_SETUP_GUIDE.md)
   - Run migrations: `cd backend && npx prisma migrate dev`
   - Seed data: `npm run seed`

3. **Start Development Servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

4. **Access Dashboards:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Prisma Studio: http://localhost:5555

5. **Login:**
   - See [Login Credentials](LOGIN_CREDENTIALS.md) for all dashboard access

---

## 🏗️ Project Structure

```
/
├── backend/           # Express.js backend with PostgreSQL
├── src/              # React frontend with TypeScript
├── docs/             # Documentation (you are here)
└── README.md         # Project README
```

---

## 📞 Support

For issues or questions, please refer to the relevant API guide or setup documentation above.

---

**Last Updated:** October 19, 2025

