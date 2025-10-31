# 🚀 PropertyHub SaaS - Deployment Guide

Welcome! This guide will help you deploy your Property Management SaaS platform to DigitalOcean.

## 📚 Documentation Overview

We've created comprehensive deployment documentation for you:

### Quick Start (15 minutes)
**📄 [`docs/QUICK_DEPLOY.md`](docs/QUICK_DEPLOY.md)**
- Fastest way to get your app live
- Step-by-step instructions
- Perfect for first-time deployment

### Complete Guide (45 minutes)
**📄 [`docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md`](docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md)**
- Detailed deployment instructions
- Architecture overview
- Monitoring and maintenance
- Troubleshooting guide
- Cost estimation
- Security best practices

### Deployment Checklist
**📄 [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md)**
- Pre-deployment tasks
- Step-by-step checklist
- Post-deployment verification
- Production readiness checks

### Environment Variables
**📄 [`docs/ENV_VARIABLES_GUIDE.md`](docs/ENV_VARIABLES_GUIDE.md)**
- Complete variable reference
- Security best practices
- How to set variables
- Troubleshooting

---

## 🎯 Which Guide Should I Use?

### I want to deploy ASAP
→ Start with **[`docs/QUICK_DEPLOY.md`](docs/QUICK_DEPLOY.md)**

### I want to understand everything
→ Read **[`docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md`](docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md)**

### I want a checklist to follow
→ Use **[`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md)**

### I need help with environment variables
→ Check **[`docs/ENV_VARIABLES_GUIDE.md`](docs/ENV_VARIABLES_GUIDE.md)**

---

## 🏗️ What You're Deploying

Your application consists of:

```
┌─────────────────────────────────────────────┐
│           DigitalOcean App Platform         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Frontend   │      │   Backend    │   │
│  │   (React)    │─────▶│  (Node.js)   │   │
│  │   Vite       │      │   Express    │   │
│  │   Static     │      │   Prisma     │   │
│  └──────────────┘      └──────┬───────┘   │
│                               │            │
│                               ▼            │
│                        ┌──────────────┐   │
│                        │  PostgreSQL  │   │
│                        │   Database   │   │
│                        └──────────────┘   │
└─────────────────────────────────────────────┘
```

---

## ⚡ Quick Deploy (15 Minutes)

### Prerequisites
1. DigitalOcean account
2. Git repository connected to DigitalOcean
3. Generate JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### Steps

#### 1. Create Database (3 min)
- Go to DigitalOcean → Databases → Create
- PostgreSQL 15, Basic plan ($15/month)
- Save connection string

#### 2. Deploy Backend (4 min)
- Go to Apps → Create App
- Connect repository
- Configure:
  - Source: `/backend`
  - Build: `npm install && npm run build`
  - Run: `npm start`
  - Port: `5000`
- Add environment variables (see guide)
- Attach database

#### 3. Deploy Frontend (3 min)
- Add Static Site component
- Configure:
  - Source: `/`
  - Build: `npm install && npm run build`
  - Output: `dist`
- Set `VITE_API_URL` to backend URL

#### 4. Initialize Database (2 min)
- Open backend console
- Run:
  ```bash
  npx prisma generate
  npx prisma db push --accept-data-loss
  npm run prisma:seed
  ```

#### 5. Test (2 min)
- Login with: `admin@propertyhub.com` / `Admin123!@#`
- Change password immediately!

**Done!** 🎉

For detailed instructions, see **[`docs/QUICK_DEPLOY.md`](docs/QUICK_DEPLOY.md)**

---

## 💰 Cost Estimate

### Minimum Setup (~$25/month)
- Backend: $5/month
- Frontend: $3/month
- Database: $15/month
- **Total: ~$25/month**

### Recommended Setup (~$50/month)
- Backend (Pro): $12/month
- Frontend: $3/month
- Database (Standard): $30/month
- Spaces (storage): $5/month
- **Total: ~$50/month**

---

## 🔒 Security Checklist

Before going live:
- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET (64+ characters)
- [ ] Use production Paystack keys (not test)
- [ ] Enable HTTPS (automatic with custom domain)
- [ ] Configure database firewall
- [ ] Mark sensitive variables as SECRET
- [ ] Test all authentication flows

---

## 📦 What's Included

### Backend (`/backend`)
- **Framework:** Express.js + TypeScript
- **Database:** Prisma ORM + PostgreSQL
- **Auth:** JWT-based authentication
- **Real-time:** Socket.io for live updates
- **Payments:** Paystack integration
- **Security:** Helmet, CORS, rate limiting

### Frontend (`/src`)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI:** Radix UI + Tailwind CSS
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Real-time:** Socket.io client

### Database
- **Engine:** PostgreSQL 15+
- **ORM:** Prisma
- **Migrations:** Automated with Prisma Migrate
- **Seeding:** Demo data included

---

## 🔧 Configuration Files

### `.do/app.yaml`
DigitalOcean App Platform configuration. Defines:
- Services (backend, frontend)
- Database connection
- Environment variables
- Build/run commands

### `vite.config.ts`
Frontend build configuration:
- Code splitting for optimal loading
- Production optimizations
- Development proxy

---

## 🚨 Common Issues

### Build Fails
- Check build logs in DigitalOcean
- Verify all dependencies in `package.json`
- Test locally: `npm run build`

### Database Connection Fails
- Verify `DATABASE_URL` is set
- Check database is running
- Add App Platform to trusted sources

### CORS Errors
- Verify `FRONTEND_URL` in backend
- Must match frontend URL exactly
- No trailing slashes

### 502 Bad Gateway
- Check backend is running
- Verify health check: `/api/health`
- Check backend logs

For more troubleshooting, see **[`docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md`](docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md#troubleshooting)**

---

## 📞 Support

### Documentation
- **Quick Deploy:** [`docs/QUICK_DEPLOY.md`](docs/QUICK_DEPLOY.md)
- **Complete Guide:** [`docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md`](docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md)
- **Checklist:** [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md)
- **Environment Variables:** [`docs/ENV_VARIABLES_GUIDE.md`](docs/ENV_VARIABLES_GUIDE.md)

### External Resources
- **DigitalOcean Docs:** https://docs.digitalocean.com/products/app-platform/
- **Prisma Docs:** https://www.prisma.io/docs/
- **Paystack Docs:** https://paystack.com/docs/

---

## 🎓 Learning Path

### First Time Deploying?
1. Read **[Quick Deploy](docs/QUICK_DEPLOY.md)** (15 min)
2. Follow the steps
3. Get your app live!
4. Later, read the complete guide to understand everything

### Want to Master Deployment?
1. Read **[Complete Guide](docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md)** (45 min)
2. Understand architecture and best practices
3. Use **[Checklist](docs/DEPLOYMENT_CHECKLIST.md)** for systematic deployment
4. Reference **[Environment Variables](docs/ENV_VARIABLES_GUIDE.md)** as needed

---

## 🎯 Next Steps After Deployment

1. **Change default password**
2. **Create your first property owner**
3. **Add custom domain** (optional)
4. **Enable Paystack** for payments
5. **Set up monitoring**
6. **Invite your team**

---

## 📝 Quick Commands

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Test backend health
curl https://your-backend-app.ondigitalocean.app/api/health

# Test frontend
curl https://your-frontend-app.ondigitalocean.app

# Run migrations (in backend console)
npx prisma generate && npx prisma db push

# Seed database
npm run prisma:seed
```

---

## ✅ Deployment Success Criteria

Your deployment is successful when:
- [ ] Frontend loads without errors
- [ ] Backend health check responds: `/api/health`
- [ ] Super admin can login
- [ ] Can create property owner
- [ ] Can create property
- [ ] Can create tenant
- [ ] Tenant can login
- [ ] Payment methods work (if Paystack configured)
- [ ] File uploads work
- [ ] Real-time notifications work

---

## 🌟 Features

### Multi-Tenant Architecture
- Property owners manage their properties
- Tenants have their own dashboard
- Property managers can be assigned

### Role-Based Access Control
- Super Admin: Platform management
- Property Owner: Property and tenant management
- Property Manager: Day-to-day operations
- Tenant: View lease, pay rent, submit maintenance

### Payment Processing
- Paystack integration
- Card tokenization
- Automated rent collection
- Payment history

### Real-Time Updates
- Socket.io for live notifications
- Instant updates across users
- No page refresh needed

### Document Management
- Upload lease agreements
- Store property documents
- Tenant document access

### Maintenance Tracking
- Tenants submit requests
- Managers track progress
- Status updates

---

**Ready to deploy?** Start with **[`docs/QUICK_DEPLOY.md`](docs/QUICK_DEPLOY.md)** 🚀

---

**Last Updated:** October 31, 2025  
**Version:** 1.0.0  
**Platform:** DigitalOcean App Platform

