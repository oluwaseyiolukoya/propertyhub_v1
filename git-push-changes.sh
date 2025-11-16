#!/bin/bash

echo "🔍 Checking Prisma schema changes..."

# Check if schema has changes
if git diff --quiet backend/prisma/schema.prisma; then
  echo "✅ No Prisma schema changes detected"
  SCHEMA_CHANGED=false
else
  echo "⚠️  Prisma schema has changes"
  SCHEMA_CHANGED=true
fi

# Stage all changes
echo ""
echo "📦 Staging all changes..."
git add .

# Show status
echo ""
echo "📋 Git status:"
git status --short

# Create commit
echo ""
echo "💾 Creating commit..."
git commit -m "fix: resolve customer creation 500 error and developer plans not showing

- Added missing Prisma schema fields (planCategory, projectLimit, projectsCount)
- Created migration for new fields
- Fixed plan categories in database (Developer plans now have category='development')
- Improved error handling in customer creation and auth endpoints
- Enhanced plan filtering logic in AddCustomerPage
- Restarted backend to load new Prisma Client
- Fixed login issues by restarting backend server

Fixes:
- POST /api/customers 500 error (missing schema fields)
- Developer plans not visible when creating developer accounts
- Login 500 errors on /api/public/branding and /api/auth/login"

# Pull latest changes
echo ""
echo "⬇️  Pulling latest changes from origin/main..."
git pull origin main --no-edit

# Push to main
echo ""
echo "⬆️  Pushing to origin/main..."
git push origin main

echo ""
echo "✅ Done!"


