# ⚡ Quick Start Checklist

## 🚨 URGENT: Do This First (Protect Your Production Database)

### Update Your Render Build Command NOW

Your current build command will **wipe your database** on every deploy. Update it immediately:

1. Go to **[Render Dashboard](https://dashboard.render.com)**
2. Click on your **Backend Service**
3. Click **Settings** (left sidebar)
4. Scroll to **Build Command**
5. Change from:
   ```bash
   npm install && npx prisma generate && npx prisma db push --accept-data-loss && npx tsx prisma/seed.ts && npm run build
   ```
   To:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   ```
6. Click **Save Changes**
7. ✅ Done! Your production database is now safe

---

## 🖥️ Local Development Setup

### 1. Create Local Environment File

Create `backend/.env` with your local database:

```bash
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/propertyhub_local"
JWT_SECRET="local-dev-secret-123"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
PORT=5000
```

### 2. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (new terminal)
cd /Users/oluwaseyio/test_ui_figma_and_cursor
npm run dev
```

### 3. Access Your Local App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Prisma Studio:** Run `cd backend && npm run prisma:studio`

---

## 🚀 Deploy to Production

### Simple Workflow:

```bash
# 1. Make your changes locally and test

# 2. Commit
git add .
git commit -m "Describe your changes"

# 3. Push (auto-deploys to Render & Vercel)
git push origin main

# 4. Done! ✅
```

---

## 🗄️ Making Database Changes

### When you need to add/modify database fields:

```bash
# 1. Edit backend/prisma/schema.prisma
# (Add your new field or model)

# 2. Create migration
cd backend
npx prisma migrate dev --name describe_change

# Examples:
# npx prisma migrate dev --name add_user_avatar
# npx prisma migrate dev --name add_notifications_table

# 3. Test locally

# 4. Commit and push
git add .
git commit -m "Add new database field"
git push origin main

# ✅ Production will apply migration safely, keeping all existing data
```

---

## 📱 Your Production URLs

- **Frontend:** https://propertyhub-v1.vercel.app
- **Backend:** https://propertyhub-backend-2suw.onrender.com
- **Health Check:** https://propertyhub-backend-2suw.onrender.com/health

### Login Credentials:

**Super Admin:**
- Email: `admin@propertyhub.com`
- Password: `admin123`

**Sample Property Owner:**
- Email: `john@metro-properties.com`
- Password: `owner123`

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login locally | Check if backend is running on port 5000 |
| Database error locally | Make sure PostgreSQL is running locally |
| CORS error | Check `FRONTEND_URL` in backend/.env |
| Migration failed | Check Render logs for specific error |
| Production data lost | Update Render build command (see top of this file) |

---

## 📚 Full Documentation

- **[Development Workflow Guide](./DEVELOPMENT_WORKFLOW.md)** ← Read this for detailed workflows
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** ← Full deployment setup
- **[Login Credentials](./LOGIN_CREDENTIALS.md)** ← All login information

---

## ✅ Success Checklist

- [ ] Updated Render build command to use `migrate deploy`
- [ ] Created `backend/.env` for local development
- [ ] Can run backend locally (`cd backend && npm run dev`)
- [ ] Can run frontend locally (`npm run dev`)
- [ ] Tested making a change and deploying to production
- [ ] Production database retained data after deploy

---

**You're all set!** 🎉

Continue building features locally, test thoroughly, then simply `git push origin main` to deploy.

Your production database will always be preserved as long as you:
1. ✅ Use `prisma migrate deploy` in Render (not `db push`)
2. ✅ Commit migration files to Git
3. ✅ Test migrations locally first

