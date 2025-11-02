# DigitalOcean Deployment Checklist

Use this checklist to ensure a smooth deployment to DigitalOcean.

## Pre-Deployment

### 1. Code Preparation

- [ ] All code committed to Git
- [ ] Git repository pushed to GitHub/GitLab
- [ ] No sensitive data in code (passwords, API keys)
- [ ] `.env` files are in `.gitignore`
- [ ] All tests passing locally
- [ ] Build succeeds locally: `npm run build` (both frontend and backend)

### 2. Environment Variables Prepared

- [ ] JWT_SECRET generated (64+ characters)
- [ ] Paystack keys ready (if using payments)
- [ ] SMTP credentials ready (if using email)
- [ ] All required environment variables documented

### 3. Database Ready

- [ ] Database schema finalized
- [ ] Seed data prepared
- [ ] Migrations tested locally

## DigitalOcean Setup

### 4. Account Setup

- [ ] DigitalOcean account created
- [ ] Billing method added
- [ ] Git repository connected to DigitalOcean

### 5. Database Creation

- [ ] PostgreSQL database created
- [ ] Database cluster running
- [ ] Connection string saved
- [ ] Trusted sources configured (App Platform apps)
- [ ] Database user created (optional)

### 6. Backend Deployment

- [ ] Backend app created in App Platform
- [ ] Source directory set to `/backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Run command: `npm start`
- [ ] Port set to `5000`
- [ ] Health check configured: `/api/health`
- [ ] All environment variables added
- [ ] DATABASE_URL linked to managed database
- [ ] First deployment successful
- [ ] Backend URL saved

### 7. Frontend Deployment

- [ ] Frontend static site created
- [ ] Source directory set to `/`
- [ ] Build command: `npm install && npm run build`
- [ ] Output directory set to `dist`
- [ ] VITE_API_URL set to backend URL
- [ ] First deployment successful
- [ ] Frontend URL saved

### 8. Database Initialization

- [ ] Connected to backend console
- [ ] Ran `npx prisma generate`
- [ ] Ran `npx prisma db push --accept-data-loss`
- [ ] Ran `npm run prisma:seed`
- [ ] Verified tables created
- [ ] Super admin account created

## Post-Deployment

### 9. Testing

- [ ] Frontend loads successfully
- [ ] Backend health check responds: `/api/health`
- [ ] Super admin login works
- [ ] Can create property owner account
- [ ] Can create property
- [ ] Can create tenant
- [ ] Tenant login works
- [ ] Payment method addition works (if using Paystack)
- [ ] File uploads work
- [ ] Real-time notifications work (Socket.io)
- [ ] All CRUD operations work

### 10. Security

- [ ] Changed default super admin password
- [ ] JWT_SECRET is strong and unique
- [ ] Database firewall configured
- [ ] CORS settings correct
- [ ] HTTPS enabled (automatic with custom domain)
- [ ] Sensitive environment variables marked as SECRET
- [ ] Rate limiting enabled
- [ ] File upload restrictions in place

### 11. Custom Domain (Optional)

- [ ] Domain purchased
- [ ] DNS configured for frontend (CNAME)
- [ ] DNS configured for backend (CNAME)
- [ ] SSL certificates provisioned (automatic)
- [ ] FRONTEND_URL updated in backend
- [ ] VITE_API_URL updated in frontend
- [ ] Both services redeployed

### 12. File Storage (Optional)

- [ ] DigitalOcean Spaces created
- [ ] Spaces credentials generated
- [ ] Backend updated to use Spaces
- [ ] Environment variables added
- [ ] File upload tested

### 13. Monitoring

- [ ] Application logs accessible
- [ ] Database metrics visible
- [ ] Uptime monitoring configured
- [ ] Error tracking set up (Sentry, optional)
- [ ] Performance monitoring enabled
- [ ] Alert notifications configured

### 14. Backups

- [ ] Database automatic backups enabled (default)
- [ ] Backup restore tested
- [ ] Environment variables exported
- [ ] Deployment process documented

### 15. Documentation

- [ ] Admin credentials documented securely
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] User guide created

## Production Readiness

### 16. Performance

- [ ] Frontend build optimized (minified, tree-shaken)
- [ ] Backend response times acceptable (<500ms)
- [ ] Database queries optimized
- [ ] Caching implemented where appropriate
- [ ] CDN enabled for static assets (automatic)

### 17. Scalability

- [ ] Instance sizes appropriate for traffic
- [ ] Database connection pooling configured
- [ ] Redis added if scaling horizontally
- [ ] Load balancer configured (if needed)

### 18. Compliance

- [ ] Privacy policy added
- [ ] Terms of service added
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy defined

## Go-Live

### 19. Final Checks

- [ ] All features tested in production
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] Security scan passed
- [ ] Backup verified
- [ ] Rollback plan documented

### 20. Launch

- [ ] Announced to users
- [ ] Support channels ready
- [ ] Monitoring active
- [ ] Team briefed on deployment

## Post-Launch

### 21. Monitoring (First 24 Hours)

- [ ] Check logs every hour
- [ ] Monitor error rates
- [ ] Track user registrations
- [ ] Verify payment processing
- [ ] Check database performance
- [ ] Monitor resource usage

### 22. First Week

- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Adjust instance sizes if needed
- [ ] Review security logs

## Troubleshooting Checklist

If something goes wrong:

### Build Fails

- [ ] Check build logs in App Platform
- [ ] Verify all dependencies in package.json
- [ ] Test build locally: `npm run build`
- [ ] Check Node.js version compatibility

### Backend Won't Start

- [ ] Check runtime logs
- [ ] Verify DATABASE_URL is correct
- [ ] Check all required environment variables are set
- [ ] Verify health check endpoint works
- [ ] Check port is set to 5000

### Database Connection Fails

- [ ] Verify DATABASE_URL format
- [ ] Check database is running
- [ ] Verify trusted sources include App Platform
- [ ] Check connection limit in DATABASE_URL

### Frontend Can't Reach Backend

- [ ] Verify VITE_API_URL is correct
- [ ] Check CORS settings in backend
- [ ] Verify FRONTEND_URL in backend matches frontend domain
- [ ] Check network tab for actual error

### 502 Bad Gateway

- [ ] Check backend is running
- [ ] Verify health check passes
- [ ] Check backend logs for errors
- [ ] Verify port configuration

## Cost Optimization

### Monthly Review

- [ ] Review resource usage
- [ ] Downsize unused resources
- [ ] Check bandwidth usage
- [ ] Review database storage
- [ ] Optimize queries for efficiency
- [ ] Consider reserved instances for savings

## Maintenance Schedule

### Daily

- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Verify backups completed

### Weekly

- [ ] Review performance metrics
- [ ] Check security logs
- [ ] Update dependencies (if needed)
- [ ] Review user feedback

### Monthly

- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Review and rotate logs
- [ ] Security audit
- [ ] Cost review
- [ ] Backup restore test

---

## Quick Commands Reference

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Test backend health
curl https://your-backend-app.ondigitalocean.app/api/health

# View backend logs
doctl apps logs <app-id> --type RUN

# Restart backend
doctl apps restart <app-id>

# Run database migrations
# (In backend console)
npx prisma generate && npx prisma db push

# Seed database
npm run prisma:seed
```

---

**Last Updated:** October 31, 2025
**Version:** 1.0.0
