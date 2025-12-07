#!/bin/bash

# Script to check which migrations need to be applied to production
# Usage: ./scripts/check-production-migrations.sh

set -e

echo "🔍 Checking Production Migration Status..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "${RED}❌ ERROR: DATABASE_URL not set${NC}"
  echo ""
  echo "Please set your production DATABASE_URL:"
  echo "  export DATABASE_URL='your_production_database_url'"
  echo ""
  exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Show database connection info (without password)
DB_INFO=$(echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
echo "📍 Database: $DB_INFO"
echo ""

# Check migration status
echo "📋 Running migration status check..."
echo ""

npx prisma migrate status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for critical tables
echo "🔍 Checking for critical tables..."
echo ""

# Check onboarding_applications
if npx prisma db execute --stdin <<< "SELECT 1 FROM onboarding_applications LIMIT 1;" &> /dev/null; then
  echo "${GREEN}✅ onboarding_applications table exists${NC}"
else
  echo "${RED}❌ onboarding_applications table MISSING${NC}"
  echo "   Migration: 20251108_add_onboarding_applications"
fi

# Check report_schedules
if npx prisma db execute --stdin <<< "SELECT 1 FROM report_schedules LIMIT 1;" &> /dev/null; then
  echo "${GREEN}✅ report_schedules table exists${NC}"
else
  echo "${RED}❌ report_schedules table MISSING${NC}"
  echo "   Migration: 20251206_add_report_schedules_table"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Provide action items
echo "📝 Next Steps:"
echo ""
echo "If migrations are pending:"
echo "  ${YELLOW}npx prisma migrate deploy${NC}"
echo ""
echo "If tables are missing but migrations show applied:"
echo "  1. Check if migrations were applied to correct database"
echo "  2. Verify DATABASE_URL points to production"
echo "  3. Re-run: npx prisma migrate deploy"
echo ""
echo "After applying migrations:"
echo "  1. Restart your production server"
echo "  2. Test admin dashboard: https://app.contrezz.com"
echo "  3. Check for 500 errors in browser console"
echo ""

