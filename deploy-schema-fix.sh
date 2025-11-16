#!/bin/bash

# Deploy Prisma Schema Fix
set -e

echo "🚀 Deploying Prisma Schema Fix"
echo "=============================="

# Stage files
git add backend/prisma/schema.prisma CUSTOMER_CREATION_500_FIX.md

# Commit
git commit -m "fix: add missing fields to Prisma schema for customer creation

- Added planCategory, projectLimit, projectsCount to customers model
- Added category, projectLimit to plans model
- Made propertyLimit nullable in plans model
- Fixes 500 error when creating customers in production
- Schema now matches the migration that was already applied"

# Push
git push origin main

echo ""
echo "✅ Changes pushed to main!"
echo ""
echo "📋 Next Steps for Production:"
echo "1. SSH to production server"
echo "2. cd /path/to/your/app"
echo "3. git pull origin main"
echo "4. cd backend && npx prisma generate"
echo "5. pm2 restart backend"
echo ""


