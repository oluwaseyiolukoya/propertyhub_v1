# 🚀 Start Backend Server - Manual Instructions

## ❌ **Issue**

The backend server cannot start because the `.env` file is missing or blocked.

---

## ✅ **Solution - Create .env File**

### **Step 1: Create the .env file**

Open your terminal and run:

```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend

cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/contrezz_dev?schema=public"
JWT_SECRET="local-dev-secret-key-change-in-production-min-32-chars-long"
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
PORT=5000
PAYSTACK_SECRET_KEY=sk_test_0667d06626e2ce1ded8549beab98c40cda1cba7a
EOF
```

### **Step 2: Verify the file was created**

```bash
cat .env
```

You should see the environment variables.

### **Step 3: Start the backend server**

```bash
npm run dev
```

---

## 📊 **Expected Output**

When the backend starts successfully, you should see:

```
🚀 Server is running on port 5000
✅ Database connected
✅ Socket.IO initialized
```

---

## 🔍 **Verify Backend is Running**

Open a new terminal and run:

```bash
curl http://localhost:5000/health
```

Or check the port:

```bash
lsof -i :5000
```

---

## 🌐 **Access Your Application**

Once backend is running:

1. **Frontend:** http://localhost:5173
2. **Backend API:** http://localhost:5000
3. **Prisma Studio:** http://localhost:5555

---

## 🎯 **After Backend Starts**

1. Open http://localhost:5173 in your browser
2. Log in to your account
3. Select a project
4. Look for **"Project Funding"** 💰 in the sidebar
5. Click it to see the new feature!

---

## 🚨 **If Database Connection Fails**

If you see database connection errors, you may need to:

1. **Start PostgreSQL:**

   ```bash
   # If using Homebrew
   brew services start postgresql@14

   # Or
   pg_ctl -D /usr/local/var/postgres start
   ```

2. **Create the database:**

   ```bash
   createdb contrezz_dev
   ```

3. **Run migrations:**
   ```bash
   cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend
   npx prisma db push
   ```

---

## 📝 **Alternative: Use Existing Database**

If you have an existing database URL, update the .env file:

```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend
nano .env
```

Change `DATABASE_URL` to your actual database connection string.

---

## ✅ **Quick Start (All Commands)**

```bash
# Navigate to backend
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend

# Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/contrezz_dev?schema=public"
JWT_SECRET="local-dev-secret-key-change-in-production-min-32-chars-long"
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
PORT=5000
PAYSTACK_SECRET_KEY=sk_test_0667d06626e2ce1ded8549beab98c40cda1cba7a
EOF

# Start backend
npm run dev
```

---

**Status:** Waiting for manual .env file creation  
**Action Required:** Run the commands above in your terminal
