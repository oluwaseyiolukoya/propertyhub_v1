# Using Environment Variables for Secrets

## 🔐 Why Use Environment Variables?

Environment variables keep sensitive information (passwords, API keys, tokens) **out of your code** and **out of git history**. This is a security best practice.

---

## 📋 Quick Start

### 1. Copy the Example File

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
cp .env.example .env
```

### 2. Edit `.env` with Your Real Credentials

```bash
# Open in your editor
nano .env
# or
code .env
```

Replace `YOUR_PASSWORD` with your actual database password:

```env
PROD_DB_URL="postgresql://contrezz_user:ACTUAL_PASSWORD_HERE@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require"
```

### 3. Verify `.env` is Ignored by Git

Check your `.gitignore` file includes:

```gitignore
.env
.env.local
.env.*.local
```

This ensures your secrets are **never committed** to git.

---

## 🚀 Using Environment Variables in Scripts

### Method 1: Load from `.env` File (Recommended)

Install `dotenv` if not already installed:

```bash
npm install dotenv
```

In your Node.js script:

```javascript
// Load environment variables from .env file
require('dotenv').config();

// Access the variable
const prodDbUrl = process.env.PROD_DB_URL;

console.log('Connecting to:', prodDbUrl.replace(/:[^:]*@/, ':****@')); // Hide password in logs
```

### Method 2: Export in Terminal (Temporary)

```bash
# Set for current terminal session only
export PROD_DB_URL="postgresql://contrezz_user:YOUR_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require"

# Now run your script
node your-script.js
```

### Method 3: Inline (One-time Use)

```bash
PROD_DB_URL="postgresql://..." node your-script.js
```

---

## 📝 Example: Sync Script with Environment Variables

**File: `backend/scripts/sync-production.js`**

```javascript
require('dotenv').config();
const { exec } = require('child_process');

const prodDbUrl = process.env.PROD_DB_URL;
const localDbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/contrezz_local';

if (!prodDbUrl) {
  console.error('❌ Error: PROD_DB_URL not set in .env file');
  process.exit(1);
}

console.log('📦 Starting production data sync...');

// Hide password in logs
const safeUrl = prodDbUrl.replace(/:[^:]*@/, ':****@');
console.log('📍 Source:', safeUrl);

// Run pg_dump
exec(`pg_dump "${prodDbUrl}" > backups/prod-backup-$(date +%Y%m%d-%H%M%S).sql`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  console.log('✅ Backup completed!');
});
```

**Usage:**

```bash
cd backend
node scripts/sync-production.js
```

---

## 🔍 Checking Your Setup

### Verify `.env` is Not Tracked by Git

```bash
git status
# .env should NOT appear in the list
```

### Verify Environment Variables Load Correctly

```bash
cd backend
node -e "require('dotenv').config(); console.log('PROD_DB_URL:', process.env.PROD_DB_URL ? '✅ Set' : '❌ Not set');"
```

---

## ⚠️ Important Security Notes

1. **NEVER commit `.env` files** to git
2. **NEVER hardcode passwords** in scripts or documentation
3. **Use `.env.example`** with placeholder values for documentation
4. **Rotate credentials** if they were ever exposed in git history
5. **Use different credentials** for development and production

---

## 📚 Additional Resources

- [dotenv npm package](https://www.npmjs.com/package/dotenv)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [12-Factor App: Config](https://12factor.net/config)

---

## 🆘 If You Accidentally Committed a Secret

1. **Immediately rotate the credential** (change the password/key)
2. **Remove from git history** using `git filter-branch` or BFG Repo-Cleaner
3. **Force push** the cleaned history: `git push --force`
4. **Notify your team** if it's a shared repository

See `ENV_SECRETS_BEST_PRACTICES.md` for detailed instructions.

