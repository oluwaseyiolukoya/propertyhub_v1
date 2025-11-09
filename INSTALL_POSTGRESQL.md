# 📦 Install PostgreSQL on macOS

PostgreSQL is required for the Contrezz backend to work. Here are three ways to install it:

---

## ✅ Option 1: Postgres.app (Easiest - Recommended)

**Best for:** Beginners, visual interface, easy management

### Steps:

1. **Download Postgres.app**
   - Go to: https://postgresapp.com/
   - Click "Download" (get the latest version)

2. **Install**
   - Open the downloaded `.dmg` file
   - Drag Postgres.app to Applications folder
   - Open Postgres.app from Applications

3. **Initialize**
   - Click "Initialize" to create a new PostgreSQL server
   - The elephant icon in menu bar shows it's running

4. **Add to PATH** (so terminal can find `psql`)
   ```bash
   echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

5. **Verify Installation**
   ```bash
   psql --version
   # Should show: psql (PostgreSQL) 14.x or higher
   ```

6. **Create Database**
   ```bash
   createdb contrezz_dev
   ```

✅ **Done!** PostgreSQL is installed and running.

---

## Option 2: Homebrew (For Developers)

**Best for:** Developers who use Homebrew for package management

### Steps:

1. **Install Homebrew** (if not already installed)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install PostgreSQL**
   ```bash
   brew install postgresql@14
   ```

3. **Start PostgreSQL**
   ```bash
   brew services start postgresql@14
   ```

4. **Verify Installation**
   ```bash
   psql --version
   # Should show: psql (PostgreSQL) 14.x
   ```

5. **Create Database**
   ```bash
   createdb contrezz_dev
   ```

✅ **Done!** PostgreSQL is installed and running.

---

## Option 3: Official Installer

**Best for:** Enterprise users, specific version requirements

### Steps:

1. **Download Installer**
   - Go to: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Select macOS and PostgreSQL 14.x
   - Download the installer

2. **Run Installer**
   - Open the downloaded `.dmg` file
   - Follow the installation wizard
   - Remember the password you set for the `postgres` user

3. **Add to PATH**
   ```bash
   echo 'export PATH="/Library/PostgreSQL/14/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

4. **Verify Installation**
   ```bash
   psql --version
   # Should show: psql (PostgreSQL) 14.x
   ```

5. **Create Database**
   ```bash
   createdb -U postgres contrezz_dev
   # Enter the password you set during installation
   ```

✅ **Done!** PostgreSQL is installed and running.

---

## After Installation: Setup Database

Once PostgreSQL is installed, set up the database:

### 1. Create Database
```bash
createdb contrezz_dev
```

### 2. Update Backend Environment Variables

Create or edit `backend/.env.local`:

```bash
# If using Postgres.app or Homebrew (no password)
DATABASE_URL="postgresql://$(whoami)@localhost:5432/contrezz_dev"

# If using official installer (with password)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/contrezz_dev"
```

### 3. Run Database Migrations
```bash
cd backend
npx prisma migrate dev
```

### 4. Seed Initial Data (Optional)
```bash
cd backend
npm run prisma:seed
```

This creates:
- Super Admin: `admin@contrezz.com` / `admin123`
- Sample data for testing

---

## Verify Everything Works

### 1. Check PostgreSQL is Running

**Postgres.app:**
- Look for elephant icon in menu bar
- Should show "Running on port 5432"

**Homebrew:**
```bash
brew services list | grep postgresql
# Should show: postgresql@14  started
```

**Official Installer:**
```bash
pg_ctl status -D /Library/PostgreSQL/14/data
# Should show: server is running
```

### 2. Test Database Connection
```bash
psql contrezz_dev
# Should connect to database
# Type \q to exit
```

### 3. Start Contrezz
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor
./start-dev.sh
```

Should now work without PostgreSQL errors!

---

## Common Issues

### Issue: "psql: command not found"

**Problem:** PostgreSQL binaries not in PATH

**Solution:**

For Postgres.app:
```bash
echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For Homebrew:
```bash
echo 'export PATH="/usr/local/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For Official Installer:
```bash
echo 'export PATH="/Library/PostgreSQL/14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Issue: "database does not exist"

**Problem:** Database not created

**Solution:**
```bash
createdb contrezz_dev
```

### Issue: "connection refused"

**Problem:** PostgreSQL not running

**Solution:**

For Postgres.app:
- Open Postgres.app
- Click "Start"

For Homebrew:
```bash
brew services start postgresql@14
```

For Official Installer:
```bash
pg_ctl start -D /Library/PostgreSQL/14/data
```

### Issue: "password authentication failed"

**Problem:** Wrong password or user

**Solution:**

Check your `backend/.env.local` file:
```bash
# For Postgres.app/Homebrew (usually no password)
DATABASE_URL="postgresql://$(whoami)@localhost:5432/contrezz_dev"

# For official installer
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/contrezz_dev"
```

---

## Which Option Should I Choose?

| Feature | Postgres.app | Homebrew | Official Installer |
|---------|-------------|----------|-------------------|
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Visual Interface | ✅ Yes | ❌ No | ✅ Yes |
| Auto-start on boot | ✅ Yes | ⚙️ Optional | ⚙️ Optional |
| Multiple versions | ✅ Yes | ✅ Yes | ❌ No |
| Command line tools | ✅ Yes | ✅ Yes | ✅ Yes |
| Best for | Beginners | Developers | Enterprise |

**Recommendation:** Use **Postgres.app** if you're new to PostgreSQL. It's the easiest to set up and manage.

---

## Quick Reference

### Start PostgreSQL
```bash
# Postgres.app: Open app and click "Start"
# Homebrew:
brew services start postgresql@14
# Official:
pg_ctl start -D /Library/PostgreSQL/14/data
```

### Stop PostgreSQL
```bash
# Postgres.app: Click "Stop" in app
# Homebrew:
brew services stop postgresql@14
# Official:
pg_ctl stop -D /Library/PostgreSQL/14/data
```

### Check Status
```bash
# Postgres.app: Look at menu bar icon
# Homebrew:
brew services list | grep postgresql
# Official:
pg_ctl status -D /Library/PostgreSQL/14/data
```

### Connect to Database
```bash
psql contrezz_dev
```

### List Databases
```bash
psql -l
```

---

## Next Steps

After installing PostgreSQL:

1. ✅ Create database: `createdb contrezz_dev`
2. ✅ Update `backend/.env.local` with DATABASE_URL
3. ✅ Run migrations: `cd backend && npx prisma migrate dev`
4. ✅ Seed data: `cd backend && npm run prisma:seed`
5. ✅ Start servers: `./start-dev.sh`
6. ✅ Login at: http://localhost:5173

---

**Need help? Check the troubleshooting section above or ask for assistance!**

