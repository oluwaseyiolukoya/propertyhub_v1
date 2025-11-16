# Run Purchase Orders Migration

## Steps to Run Migration

1. **Open a terminal** and navigate to the backend directory:
```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend
```

2. **Run the Prisma migration**:
```bash
npx prisma migrate dev --name add_purchase_orders
```

3. **Generate Prisma Client** (if needed):
```bash
npx prisma generate
```

4. **Verify the migration**:
```bash
npx prisma studio
```
Then check if the `purchase_orders` and `purchase_order_items` tables exist.

## What This Migration Does

- ✅ Creates `purchase_orders` table
- ✅ Creates `purchase_order_items` table
- ✅ Adds `purchaseOrderId` field to `project_invoices` table
- ✅ Creates necessary indexes
- ✅ Sets up foreign key relationships

## If Migration Fails

If you encounter errors, try:

1. **Check database connection**:
```bash
npx prisma db pull
```

2. **Reset database** (⚠️ WARNING: This will delete all data):
```bash
npx prisma migrate reset
```

3. **Apply migration manually**:
```bash
npx prisma db push
```

## After Migration

Once the migration is successful, restart the backend server:
```bash
npm run dev
```

The backend API endpoints for purchase orders will then be available!

