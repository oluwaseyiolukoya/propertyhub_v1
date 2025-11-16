# Quick Fix Commands

## Run these commands in order:

```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend

# Option 1: Use db push (Recommended - bypasses shadow database)
npx prisma db push
npx prisma generate

# Option 2: If Option 1 doesn't work, mark migration as applied first
npx prisma migrate resolve --applied 20251108_add_onboarding_applications
npx prisma migrate dev --name add_purchase_orders
npx prisma generate
```

## After running commands:

1. Verify tables were created:
```bash
npx prisma studio
```
Check for `purchase_orders` and `purchase_order_items` tables

2. Restart backend server:
```bash
npm run dev
```

## What `prisma db push` does:

- ✅ Applies schema changes directly to database
- ✅ Skips shadow database validation
- ✅ Creates missing tables (purchase_orders, purchase_order_items)
- ✅ Updates existing tables (adds purchaseOrderId to project_invoices)
- ✅ Faster than migrations for development

## Why this works:

The shadow database issue occurs because Prisma tries to validate migrations against a temporary database. Using `db push` bypasses this validation and applies changes directly, which is perfect for development environments.

