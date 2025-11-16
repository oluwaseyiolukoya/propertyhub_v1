# Verify Purchase Orders Tables

## Check if Tables Exist

Run these commands to verify:

```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend

# Option 1: Use Prisma Studio (Visual)
npx prisma studio
# Look for: purchase_orders, purchase_order_items tables

# Option 2: Use psql (Command line)
export $(cat .env | grep -v '^#' | xargs)
psql "$DATABASE_URL" -c "\dt purchase*"

# Option 3: Check via Prisma Client
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'purchase%'\`.then(console.log).finally(() => prisma.\$disconnect())"
```

## Expected Tables

You should see:
- ✅ `purchase_orders`
- ✅ `purchase_order_items`

## If Tables Don't Exist

If tables are missing, try:

```bash
# Force push (will recreate tables)
npx prisma db push --force-reset

# Or use migrate instead
npx prisma migrate dev --name add_purchase_orders
```

## Next Steps After Verification

1. ✅ Tables exist → Test API endpoints
2. ✅ Tables exist → Continue with frontend integration
3. ❌ Tables missing → Use force push or migrate

