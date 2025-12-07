# 🔍 How to Find Your Actual Database Name

**Last Updated:** December 6, 2024

## ✅ Good News!

Your VPC connection issue is FIXED! The app can now connect to the database server.

## ❌ New Issue

Error: `FATAL: no such database: contrezz`

This means the database name in your connection string doesn't match the actual database name in DigitalOcean.

---

## 🎯 Step 1: Find Your Database Name

### Option A: Users & Databases Tab

1. **DigitalOcean** → **Databases** → Your database cluster
2. Click on **"Users & Databases"** tab (left sidebar)
3. Look at the **"Databases"** section
4. You'll see a list of databases - **note the exact name**

Common database names you might see:

- `defaultdb` (DigitalOcean's default database)
- `Contrezz` (capital C)
- `contrezz` (lowercase)
- `contrezz-db`
- Something else

### Option B: Connection Details

1. **DigitalOcean** → **Databases** → Your database cluster
2. **Connection Details** section
3. Look at the **"Database"** field (or the default connection string)
4. The database name is after the last `/` in the URL

Example:

```
postgresql://user:pass@host:25061/defaultdb?sslmode=require
                                    ^^^^^^^^^ this is the database name
```

---

## 🎯 Step 2: Update Connection Strings

Once you know the actual database name, update both URLs:

### If your database is named `defaultdb`:

**DATABASE_URL:**

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/defaultdb?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20
```

**DIRECT_DATABASE_URL:**

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

### If your database is named `Contrezz` (capital C):

**DATABASE_URL:**

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/Contrezz?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20
```

**DIRECT_DATABASE_URL:**

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/Contrezz?sslmode=require
```

### If your database is named something else:

Replace `YOUR_DATABASE_NAME` with the actual name you found:

**DATABASE_URL:**

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25061/YOUR_DATABASE_NAME?sslmode=require&pgbouncer=true&connection_limit=5&pool_timeout=20
```

**DIRECT_DATABASE_URL:**

```
postgresql://doadmin:PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/YOUR_DATABASE_NAME?sslmode=require
```

---

## 📋 Quick Checklist

The database name in your connection string must:

- [ ] Match EXACTLY what's shown in DigitalOcean (case-sensitive!)
- [ ] Be the same in both DATABASE_URL and DIRECT_DATABASE_URL
- [ ] NOT be `Contrezz-db-pool` (that's the connection pool name, not database name)

---

## 🎯 Common Scenarios

### Scenario 1: You Never Created a Custom Database

**Likely database name:** `defaultdb`

**What to do:**

- Use `defaultdb` in your connection strings
- OR create a new database named `contrezz` in DigitalOcean

### Scenario 2: You Created a Database Named "Contrezz"

**Likely database name:** `Contrezz` (capital C)

**What to do:**

- Use `Contrezz` (capital C) in your connection strings
- Database names are case-sensitive!

### Scenario 3: You Want to Use a Database Named "contrezz"

**What to do:**

1. Go to **Users & Databases** tab in DigitalOcean
2. Click **"Add database"**
3. Create a new database named `contrezz` (lowercase)
4. Wait a few seconds for it to be created
5. Use `contrezz` in your connection strings

---

## ✅ After You Update

1. Update both `DATABASE_URL` and `DIRECT_DATABASE_URL` in DigitalOcean App Settings
2. **Save** and **Deploy**
3. Check logs - should see no more "no such database" errors
4. Then run migrations: `npx prisma migrate deploy`

---

## 🆘 Need Help?

**Tell me:**

1. What database name(s) do you see in the "Users & Databases" tab?
2. Do you want to use the existing database or create a new one named `contrezz`?

I'll give you the exact connection strings to use!
