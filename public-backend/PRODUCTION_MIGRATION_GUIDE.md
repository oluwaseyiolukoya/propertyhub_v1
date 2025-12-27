# Production Migration Guide

## 🚨 Current Issue

The `career_applications` table doesn't exist in production because migrations haven't been applied.

## ✅ Solution: Run Migrations in Production

### Automatic Migration (Recommended)

The deployment now automatically runs migrations on startup via `start.sh`. After the next deployment, migrations will be applied automatically.

### Manual Migration (If Needed)

If you need to run migrations manually in production:

#### Option 1: Via DigitalOcean App Platform Console

1. **Go to your app**: https://cloud.digitalocean.com/apps
2. **Select**: `contrezz-public-api`
3. **Go to**: Runtime → Console
4. **Run**:
   ```bash
   cd /workspace/public-backend
   npx prisma migrate deploy
   ```

#### Option 2: Via SSH/Doctl

```bash
# Connect to your app
doctl apps logs <app-id> --type run --follow

# Or use the console in DigitalOcean dashboard
```

#### Option 3: Force Rebuild

1. **Go to your app** in DigitalOcean
2. **Click**: Actions → Force Rebuild
3. The `start.sh` script will run migrations automatically

## 📋 Migrations That Need to Be Applied

1. `20251226214438_add_career_applications` - Creates `career_applications` table
2. `20251226220412_add_cover_letter_url` - Adds `coverLetterUrl` column

## 🔍 Verify Migrations

After running migrations, verify they were applied:

```bash
cd /workspace/public-backend
npx prisma migrate status
```

You should see:

```
Database schema is up to date!
```

## 🐛 Troubleshooting

### Error: "Migration already applied"

- This is fine - it means the migration was already run
- Check migration status: `npx prisma migrate status`

### Error: "Database connection failed"

- Verify `PUBLIC_DATABASE_URL` is set correctly in App Platform
- Check database is accessible from the app

### Error: "Table already exists"

- The migration may have been partially applied
- Check migration status and resolve manually if needed

## 📚 Related Files

- Start script: `public-backend/start.sh`
- Deployment config: `public-backend/.do/app.yaml`
- Migrations: `public-backend/prisma/migrations/`
