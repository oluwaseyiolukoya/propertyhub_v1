# Environment Variables Setup Guide

## Frontend Environment Variables

Create a file: `/Users/oluwaseyio/test_ui_figma_and_cursor/.env`

```env
# Backend API URL
VITE_API_URL=http://localhost:5000
```

For production, create: `/Users/oluwaseyio/test_ui_figma_and_cursor/.env.production`

```env
# Backend API URL (update with your deployed backend URL)
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## Backend Environment Variables

Create a file: `/Users/oluwaseyio/test_ui_figma_and_cursor/backend/.env`

```env
# Application
NODE_ENV=development
PORT=5000

# Database (Local PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/propertyhub

# Security
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

---

## How to Generate JWT Secret

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET`.

---

## Production Environment Variables

### For Render (Backend)

In your Render dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=<your-render-postgresql-connection-string>
JWT_SECRET=<your-generated-secret>
FRONTEND_URL=https://propertyhub-v1.vercel.app
```

### For Vercel (Frontend)

In your Vercel dashboard → Settings → Environment Variables:

```
Name: VITE_API_URL
Value: https://your-backend-url.onrender.com
Environments: Production, Preview, Development
```

---

## Quick Setup Script

You can create these files quickly by running:

### Frontend .env
```bash
cat > .env << 'EOL'
VITE_API_URL=http://localhost:5000
EOL
```

### Backend .env
```bash
cat > backend/.env << 'EOL'
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/propertyhub
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
FRONTEND_URL=http://localhost:5173
EOL
```

---

## Verification

### Check Frontend
```bash
# In project root
cat .env
# Should show: VITE_API_URL=http://localhost:5000
```

### Check Backend
```bash
# In backend directory
cd backend
cat .env
# Should show all backend environment variables
```

---

## Troubleshooting

### "Cannot find module 'dotenv'"
```bash
cd backend
npm install
```

### ".env file not being read"
- Make sure the file is named exactly `.env` (with the dot)
- Make sure it's in the correct directory
- Restart your dev server after creating .env files

### "VITE_API_URL is undefined"
- Frontend env variables MUST start with `VITE_`
- Restart Vite dev server: `npm run dev`
- Check if `.env` file is in project root (not in `src/`)

---

**Important**: Never commit `.env` files to Git! They are already in `.gitignore`.

