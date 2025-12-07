# 🚀 Apply Migrations NOW - DigitalOcean

## Current Problem

You're getting: `"remaining connection slots are reserved for non-replication superuser connections"`

This means all database connections are in use.

---

## ⚡ QUICK FIX (2 minutes)

### Step 1: Scale Down Backend (Free Connections)

```bash
# In DigitalOcean console or SSH
kubectl scale deployment backend --replicas=0

# Wait 15 seconds
sleep 15
```

This will:
- Stop your backend application
- Close all database connections
- Free up slots for migration

---

### Step 2: Apply Migrations

```bash
# Now apply migrations (connections are free)
npx prisma migrate deploy
```

Expected output:
```
✓ All migrations have been applied successfully.
```

---

### Step 3: Scale Backend Back Up

```bash
# Restart your application
kubectl scale deployment backend --replicas=1

# Check it's running
kubectl get pods
```

---

## ✅ Verify Success

```bash
# Check migration status
npx prisma migrate status

# Should say: "Database schema is up to date!"
```

---

## 🔄 **Complete Command Sequence**

Copy and paste this entire block:

```bash
echo "🛑 Stopping backend..."
kubectl scale deployment backend --replicas=0

echo "⏳ Waiting for connections to close..."
sleep 15

echo "🚀 Applying migrations..."
npx prisma migrate deploy

echo "✅ Starting backend..."
kubectl scale deployment backend --replicas=1

echo "🎯 Checking status..."
kubectl get pods

echo "✨ Done! Migrations applied."
```

---

## 🎯 Expected Timeline

- **Scale down:** 5 seconds
- **Wait:** 15 seconds
- **Migrate:** 10-30 seconds
- **Scale up:** 5 seconds
- **Total downtime:** ~1 minute

---

## 🚨 If You Can't Scale Down

Use this alternative (applies migration with minimal connections):

```bash
# Force use only 1 connection
export DATABASE_URL="${DATABASE_URL}?connection_limit=1&pool_timeout=30"

# Apply migrations
npx prisma migrate deploy

# Unset the modified URL
unset DATABASE_URL
```

---

## 📱 After Migration

1. **Restart your app** (if not using kubectl)
   ```bash
   # If using PM2
   pm2 restart backend
   
   # If using Docker
   docker restart backend
   ```

2. **Test the application**
   - Go to https://app.contrezz.com
   - Check admin dashboard
   - Verify no 500 errors

3. **Set up connection pooling** (prevents future issues)
   - See: `DIGITALOCEAN_CONNECTION_POOLING_SETUP.md`

---

## 🎓 What Just Happened

1. Your app was using all 25 database connections
2. Migration couldn't get a connection slot
3. By stopping the app, we freed up connections
4. Migration ran successfully
5. App restarted with updated schema

---

## 🛠️ Prevent This in Future

**Long-term fix:** Set up connection pooling

See the detailed guide: `DIGITALOCEAN_CONNECTION_POOLING_SETUP.md`

Quick summary:
1. Use DigitalOcean Connection Pool (port 25061)
2. Add `?pgbouncer=true` to your DATABASE_URL
3. Reduce connection_limit in your app
4. Keep direct URL for migrations

This will prevent connection limit issues permanently.

---

## ✨ Success Checklist

After running the commands above:

- [ ] Backend scaled down
- [ ] Migrations applied successfully
- [ ] Backend scaled back up
- [ ] Pods are running
- [ ] Application loads at https://app.contrezz.com
- [ ] Admin dashboard works
- [ ] No 500 errors
- [ ] Report scheduling works

---

**Time to complete:** 2 minutes  
**Downtime:** ~1 minute  
**Difficulty:** Easy  
**Risk:** Low (can rollback by restarting)

