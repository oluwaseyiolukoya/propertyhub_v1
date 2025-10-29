# 🏠 Local Development Setup

## Prerequisites Setup

### 1. Install PostgreSQL (Choose ONE option)

#### Option A: Postgres.app (Easiest for Mac - Recommended)
1. Download from: https://postgresapp.com/
2. Drag to Applications folder
3. Open Postgres.app
4. Click "Initialize" to create a new server
5. PostgreSQL will run automatically when you start your Mac

#### Option B: Homebrew (Command Line)
```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create your user (if needed)
createuser -s postgres
```

#### Option C: Docker (If you prefer containers)
```bash
# Create and start PostgreSQL container
docker run --name propertyhub-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=propertyhub_local \
  -p 5432:5432 \
  -d postgres:16

# Start it whenever you need it
docker start propertyhub-postgres
```

### 2. Verify PostgreSQL is Running

```bash
# Check if PostgreSQL is running
psql --version

# Should show something like: psql (PostgreSQL) 16.x
```

---

## Create Local Environment File

Create `backend/.env` for local development:

```bash
cd backend
cp env.example .env
```

Then edit `backend/.env` with these values:

```env
# Database - Local PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/propertyhub_local?schema=public"

# Server
PORT=5000
NODE_ENV=development

# JWT - Use different secret than production
JWT_SECRET=local-dev-secret-change-this-to-something-random
JWT_EXPIRES_IN=7d

# CORS - Your local frontend
FRONTEND_URL=http://localhost:5173

# Email (optional for now)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

**Important Notes:**
- ✅ Use `propertyhub_local` database (separate from production)
- ✅ Use different JWT secret than production
- ✅ `.env` is in `.gitignore` so it won't be pushed to GitHub

---

## Setup Local Database

```bash
# Navigate to backend folder
cd backend

# Create local database
createdb propertyhub_local

# Run migrations to create tables
npx prisma migrate dev

# Seed the database with initial data
npm run prisma:seed
```

You'll get login credentials for local development:
- **Admin:** `admin@propertyhub.com` / `admin123`
- **Owner:** `john@metro-properties.com` / `owner123`

---

## Start Development Servers

Open **3 terminals**:

### Terminal 1: Backend Server
```bash
cd backend
npm run dev
```

Expected output:
```
🚀 Server running on port 5000
📝 Environment: development
🌐 CORS enabled for: http://localhost:5173
```

### Terminal 2: Frontend Server
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor
npm run dev
```

Expected output:
```
VITE ready in Xms
Local: http://localhost:5173/
```

### Terminal 3: Prisma Studio (Optional - Database GUI)
```bash
cd backend
npm run prisma:studio
```

Opens at: http://localhost:5555

---

## Access Your Local App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/health
- **Prisma Studio:** http://localhost:5555 (if running)

### Login Credentials (Local):
- Email: `admin@propertyhub.com`
- Password: `admin123`

---

## Common Issues & Solutions

### Issue: "Port 5000 already in use"
```bash
# Find what's using port 5000
lsof -ti:5000

# Kill that process
kill -9 $(lsof -ti:5000)
```

### Issue: "Connection refused" to PostgreSQL
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql
# or
docker ps | grep postgres

# Start PostgreSQL
brew services start postgresql@16
# or
docker start propertyhub-postgres
```

### Issue: "Database does not exist"
```bash
# Create the database
createdb propertyhub_local

# Then run migrations
cd backend
npx prisma migrate dev
```

### Issue: "Can't find module" errors
```bash
# Reinstall dependencies
cd backend
npm install

cd ..
npm install
```

---

## Quick Daily Workflow

```bash
# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd /Users/oluwaseyio/test_ui_figma_and_cursor && npm run dev

# Open browser
open http://localhost:5173
```

---

## File Structure Overview

```
/Users/oluwaseyio/test_ui_figma_and_cursor/
├── backend/
│   ├── .env                    ← Your local environment (DO NOT COMMIT)
│   ├── env.example             ← Template for .env
│   ├── prisma/
│   │   ├── schema.prisma       ← Database schema
│   │   ├── migrations/         ← Migration files (DO COMMIT)
│   │   └── seed.ts             ← Seed data
│   ├── src/
│   │   ├── index.ts            ← Server entry point
│   │   ├── routes/             ← API routes
│   │   └── middleware/         ← Auth, etc.
│   └── package.json
├── src/                        ← Frontend code
├── package.json                ← Frontend dependencies
└── .env (optional)             ← Frontend environment variables
```

---

## Environment Variables Summary

### Local Development (backend/.env):
- `DATABASE_URL` → Local PostgreSQL database
- `NODE_ENV` → `development`
- `FRONTEND_URL` → `http://localhost:5173`
- `JWT_SECRET` → Your local secret

### Production (Render):
- `DATABASE_URL` → Render PostgreSQL URL
- `NODE_ENV` → `production`
- `FRONTEND_URL` → `https://propertyhub-v1.vercel.app`
- `JWT_SECRET` → Production secret (different from local)

---

## Making Changes

### Regular Code Changes (No DB Changes):
```bash
# 1. Edit your code in src/
# 2. Save (hot-reload works automatically)
# 3. Test in browser at http://localhost:5173
# 4. When ready to deploy:
git add .
git commit -m "Add new feature"
git push origin main
```

### Database Schema Changes:
```bash
# 1. Edit backend/prisma/schema.prisma
# 2. Create migration
cd backend
npx prisma migrate dev --name describe_your_change

# 3. Test locally
npm run dev

# 4. When ready to deploy:
git add .
git commit -m "Add database changes"
git push origin main
```

---

## Troubleshooting

### Reset Local Database (if things go wrong):
```bash
cd backend
npx prisma migrate reset  # ⚠️ Wipes local data only

# Then re-seed
npm run prisma:seed
```

### Check Database Connection:
```bash
cd backend
npx prisma studio
# If it opens, your database connection works!
```

### View Logs:
```bash
# Backend logs are in the terminal where you ran `npm run dev`
# Look for:
# - ❌ Errors (in red)
# - ⚠️ Warnings (in yellow)
# - ✅ Success messages (in green)
```

---

## ✅ You're Ready When:

- [ ] PostgreSQL is installed and running
- [ ] Created `backend/.env` with local settings
- [ ] Created local database: `propertyhub_local`
- [ ] Ran migrations: `npx prisma migrate dev`
- [ ] Seeded database: `npm run prisma:seed`
- [ ] Backend starts successfully: `npm run dev`
- [ ] Frontend starts successfully: `npm run dev`
- [ ] Can login at http://localhost:5173

---

**Next:** Open 2 terminals and start coding! 🚀

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
npm run dev
```

Your local app will auto-reload when you make changes.

