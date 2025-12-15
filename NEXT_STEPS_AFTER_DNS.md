# Next Steps After DNS Configuration

## ✅ What You've Completed

- [x] Created public database on DigitalOcean
- [x] Deployed public backend API
- [x] Configured DNS records
- [x] Set up split architecture

## 🔍 Step 1: Verify DNS is Correct (5-30 minutes)

After updating the DNS record in Namecheap, wait and verify:

```bash
# Check DNS resolution
dig api.contrezz.com +short
# Should show: contrezz-public-api-hetj8.ondigitalocean.app

dig api.app.contrezz.com +short  
# Should show: contrezz-backend-prod-nnju5.ondigitalocean.app
```

## 🧪 Step 2: Test Both APIs

```bash
# Test public API
curl https://api.contrezz.com/health
curl https://api.contrezz.com/api/careers

# Test app API
curl https://api.app.contrezz.com/health
```

## 📊 Step 3: Migrate Real Career Data (When Ready)

When you have careers in production, migrate them:

```bash
# Set production database URLs
export APP_DATABASE_URL="postgresql://doadmin:XXXXX@your-prod-db.ondigitalocean.com:25060/contrezz_app?sslmode=require"
export PUBLIC_DATABASE_URL="postgresql://doadmin:YOUR_PASSWORD@contrezz-public-db-do-user-18499071-0.k.db.ondigitalocean.com:25060/contrezz_public?sslmode=require"

# Run migration
./scripts/migrate-careers-to-public.sh
```

## 💻 Step 4: Update Frontend

Update your frontend to use the new public API:

1. **Update environment variables:**
   ```bash
   # In public frontend .env
   VITE_PUBLIC_API_URL=https://api.contrezz.com/api
   VITE_APP_SIGNUP_URL=https://app.contrezz.com/signup
   ```

2. **Update API clients:**
   - See: `docs/FRONTEND_INTEGRATION_GUIDE.md`
   - Create `publicApi.ts` client
   - Update career components

3. **Test locally:**
   ```bash
   cd public-frontend
   npm run dev
   # Verify careers load from public API
   ```

## 🚀 Step 5: Deploy Frontend Updates

After testing locally:

1. Deploy public frontend (Vercel/Netlify)
2. Deploy app frontend
3. Test in production

## 📈 Step 6: Monitor & Optimize

1. **Set up monitoring:**
   - DigitalOcean Insights
   - Uptime monitoring
   - Error tracking

2. **Performance:**
   - Monitor API response times
   - Check database performance
   - Optimize queries if needed

## ✅ Final Verification Checklist

- [ ] DNS resolves correctly for both domains
- [ ] Both APIs respond to health checks
- [ ] Public API serves careers correctly
- [ ] App API works as before
- [ ] Frontend uses correct API endpoints
- [ ] SSL certificates are active
- [ ] No CORS errors
- [ ] All user flows work

## 🎯 Success Criteria

You'll know everything is working when:

- ✅ `https://api.contrezz.com/health` returns 200
- ✅ `https://api.contrezz.com/api/careers` returns career data
- ✅ `https://api.app.contrezz.com/health` returns 200
- ✅ Frontend loads careers from public API
- ✅ App dashboard works normally
- ✅ No console errors in browser

## 📚 Documentation Reference

- DNS Guide: `docs/SPLIT_ARCHITECTURE_DNS_GUIDE.md`
- Frontend Integration: `docs/FRONTEND_INTEGRATION_GUIDE.md`
- Deployment: `public-backend/DEPLOYMENT_INSTRUCTIONS.md`
- Complete Guide: `DIGITALOCEAN_FULL_SEPARATION_GUIDE.md`

---

**Status:** DNS configured, APIs deployed, ready for data migration and frontend updates!
