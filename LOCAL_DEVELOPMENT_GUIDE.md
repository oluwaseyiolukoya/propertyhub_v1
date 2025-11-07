# 🏠 Local Development Guide

This guide will help you set up and run Contrezz locally for development.

---

## 🚀 Quick Start

### One-Command Setup

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor
./start-local-dev.sh
```

This script will:

- ✅ Start PostgreSQL (if not running)
- ✅ Create local database
- ✅ Apply database schema
- ✅ Seed initial data
- ✅ Create `.env.local` file

Then follow the instructions to start backend and frontend.

---

## 📋 Manual Setup (If Needed)

### Step 1: Install PostgreSQL

```bash
brew install postgresql@15
brew services start postgresql@15
```

### Step 2: Create Database

```bash
createdb contrezz_dev
```

### Step 3: Configure Backend

Create `backend/.env.local`:

```bash
cd backend
cat > .env.local <<EOF
DATABASE_URL="postgresql://localhost:5432/contrezz_dev"
JWT_SECRET="local-dev-secret-key-change-in-production"
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
EOF
```

### Step 4: Apply Schema and Seed

```bash
cd backend
npx prisma db push
npm run prisma:seed
```

---

## 🏃 Running the Application

### Terminal 1: Backend

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm run dev
```

**Backend runs at**: http://localhost:3000

### Terminal 2: Frontend

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor
npm run dev
```

**Frontend runs at**: http://localhost:5173

### Terminal 3: Prisma Studio (Optional)

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npx prisma studio
```

**Prisma Studio at**: http://localhost:5555

---

## 🔐 Login Credentials (Local)

After seeding, you can log in with:

**Super Admin:**

- Email: `admin@contrezz.com`
- Password: `admin123`

**Property Owner:**

- Email: `john@metro-properties.com`
- Password: `owner123`

**Property Manager:**

- Email: `manager@metro-properties.com`
- Password: `manager123`

**Tenant:**

- Email: `tenant1@metro-properties.com`
- Password: `tenant123`

---

## 🔄 Development Workflow

### 1. Make Code Changes

#### Backend Changes

- Edit files in `backend/src/`
- Server auto-restarts on changes
- Check terminal for errors

#### Frontend Changes

- Edit files in `src/`
- Hot Module Replacement (instant updates)
- Check browser console for errors

### 2. Database Changes

#### Add/Modify Tables or Fields

```bash
# 1. Edit backend/prisma/schema.prisma
# Example: Add a new field
model users {
  id       String   @id
  email    String   @unique
  avatar   String?  // New field
  // ... other fields
}

# 2. Apply changes
cd backend
npx prisma db push

# 3. Regenerate Prisma Client
npx prisma generate

# 4. Restart backend (Ctrl+C and npm run dev)
```

#### Create Migration (For Production)

```bash
cd backend
npx prisma migrate dev --name add_user_avatar
```

This creates a migration file that can be deployed to production.

### 3. Test Your Changes

- ✅ Test in browser at http://localhost:5173
- ✅ Check API responses in Network tab
- ✅ View database in Prisma Studio
- ✅ Check backend logs in terminal

### 4. Commit and Push

```bash
git add .
git commit -m "feat: Your feature description"
git push origin main
```

**GitHub Actions will automatically deploy to AWS dev environment!**

---

## 🗄️ Database Management

### View Data (Prisma Studio)

```bash
cd backend
npx prisma studio
```

Open http://localhost:5555

### Reset Database

```bash
cd backend
npx prisma db push --accept-data-loss
npm run prisma:seed
```

### Backup Local Database

```bash
pg_dump contrezz_dev > backup_$(date +%Y%m%d).sql
```

### Restore Local Database

```bash
dropdb contrezz_dev
createdb contrezz_dev
psql contrezz_dev < backup_20250107.sql
```

---

## 🐛 Debugging

### Backend Debugging

#### View Logs

Check the terminal where `npm run dev` is running.

#### Debug with VS Code

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

### Frontend Debugging

#### Browser DevTools

- Press `F12` or `Cmd+Option+I`
- Check Console tab for errors
- Check Network tab for API calls

#### React DevTools

Install React DevTools browser extension.

### Database Debugging

#### Check Connection

```bash
psql contrezz_dev -c "SELECT 1;"
```

#### View Schema

```bash
psql contrezz_dev -c "\dt"
```

#### Run SQL Query

```bash
psql contrezz_dev -c "SELECT * FROM admins;"
```

---

## 🔧 Common Issues

### Issue 1: "Port 3000 already in use"

**Solution**: Kill the process using port 3000

```bash
lsof -ti:3000 | xargs kill -9
```

### Issue 2: "Port 5173 already in use"

**Solution**: Kill the process using port 5173

```bash
lsof -ti:5173 | xargs kill -9
```

### Issue 3: "Database does not exist"

**Solution**: Create the database

```bash
createdb contrezz_dev
cd backend
npx prisma db push
npm run prisma:seed
```

### Issue 4: "Prisma Client not generated"

**Solution**: Regenerate Prisma Client

```bash
cd backend
npx prisma generate
```

### Issue 5: "Cannot connect to database"

**Solution**: Ensure PostgreSQL is running

```bash
brew services start postgresql@15
pg_isready
```

---

## 🎯 Environment Variables

### Backend (.env.local)

```bash
# Database
DATABASE_URL="postgresql://localhost:5432/contrezz_dev"

# Authentication
JWT_SECRET="local-dev-secret-key"

# Environment
NODE_ENV="development"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"

# Optional: Payment Gateway (for testing)
PAYSTACK_PUBLIC_KEY=""
PAYSTACK_SECRET_KEY=""
```

### Frontend (.env.local)

Create `/.env.local` in project root:

```bash
VITE_API_URL=http://localhost:3000
VITE_DATADOG_ENABLED=false
```

---

## 📊 Local vs AWS Dev

| Aspect                | Local            | AWS Dev        |
| --------------------- | ---------------- | -------------- |
| **Speed**             | Instant          | 5-8 min deploy |
| **Cost**              | Free             | ~$30-50/month  |
| **Database**          | Local PostgreSQL | RDS PostgreSQL |
| **Use Case**          | Active coding    | Testing, demos |
| **Hot Reload**        | ✅ Yes           | ❌ No          |
| **Internet Required** | ❌ No            | ✅ Yes         |

**Recommendation**: Use **local** for development, **AWS dev** for testing/demos.

---

## 🚀 Deploy to AWS

When ready to test on AWS:

```bash
# Commit your changes
git add .
git commit -m "feat: New feature"
git push origin main

# GitHub Actions deploys automatically (5-8 minutes)

# Start AWS dev environment (if stopped)
cd infra/scripts
./dev-control.sh start

# Access at: https://app.dev.contrezz.com
```

---

## 💡 Pro Tips

### Tip 1: Use Multiple Terminal Tabs

```bash
# Tab 1: Backend
cd backend && npm run dev

# Tab 2: Frontend
npm run dev

# Tab 3: Prisma Studio
cd backend && npx prisma studio

# Tab 4: Git commands
git status
```

### Tip 2: Auto-Restart on Crash

Use `nodemon` or `pm2` for backend:

```bash
npm install -g pm2
cd backend
pm2 start "npm run dev" --name api
pm2 logs api
```

### Tip 3: Use VS Code Extensions

- **Prisma**: Syntax highlighting for `.prisma` files
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Thunder Client**: API testing (like Postman)

### Tip 4: Database Snapshots

Before major changes:

```bash
pg_dump contrezz_dev > snapshot_before_migration.sql
```

---

## 📝 Checklist: Starting Development

- [ ] PostgreSQL installed and running
- [ ] Local database created (`contrezz_dev`)
- [ ] Backend `.env.local` configured
- [ ] Schema applied (`npx prisma db push`)
- [ ] Data seeded (`npm run prisma:seed`)
- [ ] Backend running (`npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Can log in at http://localhost:5173

---

## 🎉 You're Ready!

**Start coding!**

- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Prisma Studio: http://localhost:5555

**When you push to GitHub, changes automatically deploy to AWS!** 🚀

---

## 📚 Related Documentation

- [DEPLOYMENT_SUCCESS.md](./DEPLOYMENT_SUCCESS.md) - AWS deployment guide
- [PRISMA_STUDIO_GUIDE.md](./PRISMA_STUDIO_GUIDE.md) - Database management
- [START_HERE.md](./START_HERE.md) - Project overview

---

**Happy coding!** 💻
