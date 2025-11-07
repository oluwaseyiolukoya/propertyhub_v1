# 🚀 Start Here - DigitalOcean Deployment

## Welcome! Your app is ready to deploy.

This guide will help you get started quickly.

---

## 📚 Choose Your Path

### 🏃 I want to deploy NOW (15 minutes)
**→ Open [`docs/QUICK_DEPLOY.md`](docs/QUICK_DEPLOY.md)**

Perfect for:
- First-time deployment
- Getting app live quickly
- Learning by doing

---

### 📖 I want to understand EVERYTHING (45 minutes)
**→ Open [`docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md`](docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md)**

Perfect for:
- Understanding architecture
- Learning best practices
- Production deployment
- Troubleshooting reference

---

### ✅ I want a CHECKLIST (Systematic)
**→ Open [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md)**

Perfect for:
- Ensuring nothing is missed
- Team deployments
- Audit trail

---

### 🔍 I want to VALIDATE first
**→ Run `./scripts/pre-deploy-check.sh`**

Perfect for:
- Catching issues early
- Verifying readiness
- CI/CD pipelines

---

## 📖 All Documentation

| Document | Purpose | Time |
|----------|---------|------|
| **[DEPLOYMENT_README.md](DEPLOYMENT_README.md)** | Overview of all resources | 5 min |
| **[docs/QUICK_DEPLOY.md](docs/QUICK_DEPLOY.md)** | Fastest deployment path | 15 min |
| **[docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md](docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md)** | Complete guide | 45 min |
| **[docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** | Step-by-step checklist | 30 min |
| **[docs/ENV_VARIABLES_GUIDE.md](docs/ENV_VARIABLES_GUIDE.md)** | Environment variables | Reference |
| **[docs/DEPLOYMENT_SUMMARY.md](docs/DEPLOYMENT_SUMMARY.md)** | Quick summary | 10 min |

---

## ⚡ Super Quick Start

If you just want to get started right now:

### 1. Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
**Save this output!** You'll need it.

### 2. Go to DigitalOcean
- Sign up/login at https://digitalocean.com
- Go to "Apps" → "Create App"
- Connect your Git repository

### 3. Follow the Guide
Open [`docs/QUICK_DEPLOY.md`](docs/QUICK_DEPLOY.md) and follow steps 1-6.

**That's it!** Your app will be live in 15 minutes.

---

## 💰 Cost Estimate

| Plan | Monthly Cost | Best For |
|------|--------------|----------|
| **Minimum** | ~$25 | Testing, small projects |
| **Recommended** | ~$50 | Small business, startups |
| **Production** | ~$100 | Growing business |

See full breakdown in [`docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md`](docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md#cost-estimation)

---

## 🔑 What You'll Need

- [ ] DigitalOcean account (sign up at https://digitalocean.com)
- [ ] Git repository on GitHub/GitLab
- [ ] JWT secret (generate with command above)
- [ ] 15 minutes of time

**Optional:**
- [ ] Paystack account (for payments)
- [ ] Custom domain name

---

## 🏗️ What Gets Deployed

```
Frontend (React) ──→ Backend (Node.js) ──→ Database (PostgreSQL)
    $3/month           $5-12/month           $15-60/month
```

Total: **~$25-75/month**

---

## 🎯 Default Login

After deployment, login with:
```
Email: admin@contrezz.com
Password: Admin123!@#
```

**⚠️ Change this immediately after first login!**

---

## ✅ Deployment Success

You'll know it worked when:
- ✓ Frontend loads without errors
- ✓ You can login as admin
- ✓ You can create a property
- ✓ You can create a tenant
- ✓ Tenant can login

---

## 🚨 Need Help?

### Common Issues
- **Build fails?** → See troubleshooting in guides
- **CORS errors?** → Check FRONTEND_URL matches
- **Database connection fails?** → Verify trusted sources
- **502 error?** → Check backend logs

### Full Troubleshooting
See [`docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md#troubleshooting`](docs/DIGITALOCEAN_DEPLOYMENT_GUIDE.md#troubleshooting)

---

## 🎓 Recommended Path

### For Beginners
1. Read this file (you're here! ✓)
2. Run `./scripts/pre-deploy-check.sh`
3. Follow [`docs/QUICK_DEPLOY.md`](docs/QUICK_DEPLOY.md)
4. Test your app
5. Later, read complete guide

### For Experienced Developers
1. Read [`docs/DEPLOYMENT_SUMMARY.md`](docs/DEPLOYMENT_SUMMARY.md)
2. Review [`docs/ENV_VARIABLES_GUIDE.md`](docs/ENV_VARIABLES_GUIDE.md)
3. Use [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md)
4. Deploy systematically

---

## 🔄 Next Steps

After deployment:
1. Change admin password
2. Create property owner account
3. Add custom domain (optional)
4. Enable Paystack (optional)
5. Invite your team

---

## 📞 Support

- **Documentation:** See `docs/` folder
- **DigitalOcean:** https://docs.digitalocean.com/products/app-platform/
- **Prisma:** https://www.prisma.io/docs/
- **Paystack:** https://paystack.com/docs/

---

## 🎉 Ready to Deploy?

Choose your path above and let's get started! 🚀

**Most Popular:** [`docs/QUICK_DEPLOY.md`](docs/QUICK_DEPLOY.md) (15 minutes)

---

**Last Updated:** October 31, 2025
