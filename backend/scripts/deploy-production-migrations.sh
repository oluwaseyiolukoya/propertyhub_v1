#!/bin/bash

# Script to safely deploy migrations to production
# Usage: ./scripts/deploy-production-migrations.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║     Production Database Migration Deployment     ║${NC}"
echo "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "${RED}❌ ERROR: DATABASE_URL not set${NC}"
  echo ""
  echo "Please set your production DATABASE_URL:"
  echo "  ${YELLOW}export DATABASE_URL='your_production_database_url'${NC}"
  echo ""
  exit 1
fi

# Show database connection info (without password)
DB_INFO=$(echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
echo "📍 Database: $DB_INFO"
echo ""

# Warning prompt
echo "${YELLOW}⚠️  WARNING: You are about to modify the PRODUCTION database!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "${RED}Deployment cancelled.${NC}"
  exit 1
fi

# Backup prompt
echo "📦 ${YELLOW}IMPORTANT: Have you backed up the production database?${NC}"
echo ""
read -p "Backup completed? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo ""
  echo "${YELLOW}Please backup your database first:${NC}"
  echo "  pg_dump -h your_host -U your_user -d your_db > backup_\$(date +%Y%m%d).sql"
  echo ""
  echo "${RED}Deployment cancelled.${NC}"
  exit 1
fi

# Check current migration status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Step 1: Checking current migration status..."
echo ""

npx prisma migrate status || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Deploy migrations
echo "🚀 Step 2: Deploying pending migrations..."
echo ""

if npx prisma migrate deploy; then
  echo ""
  echo "${GREEN}✅ Migrations deployed successfully!${NC}"
else
  echo ""
  echo "${RED}❌ Migration deployment failed!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Check error messages above"
  echo "  2. Verify DATABASE_URL is correct"
  echo "  3. Check if database is accessible"
  echo "  4. Consider manual migration if needed"
  echo ""
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verify critical tables
echo "🔍 Step 3: Verifying critical tables..."
echo ""

TABLES_OK=true

# Check onboarding_applications
if npx prisma db execute --stdin <<< "SELECT 1 FROM onboarding_applications LIMIT 1;" &> /dev/null; then
  echo "${GREEN}✅ onboarding_applications${NC}"
else
  echo "${RED}❌ onboarding_applications${NC}"
  TABLES_OK=false
fi

# Check report_schedules
if npx prisma db execute --stdin <<< "SELECT 1 FROM report_schedules LIMIT 1;" &> /dev/null; then
  echo "${GREEN}✅ report_schedules${NC}"
else
  echo "${RED}❌ report_schedules${NC}"
  TABLES_OK=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$TABLES_OK" = true ]; then
  echo "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
  echo "${GREEN}║            ✅ Deployment Successful!              ║${NC}"
  echo "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "📝 Next Steps:"
  echo ""
  echo "1. ${YELLOW}Restart your production server${NC}"
  echo "   Examples:"
  echo "     pm2 restart your-app"
  echo "     systemctl restart your-app"
  echo "     docker restart your-container"
  echo ""
  echo "2. ${YELLOW}Test the application${NC}"
  echo "   • Open: https://app.contrezz.com"
  echo "   • Login to admin dashboard"
  echo "   • Check for console errors"
  echo "   • Test onboarding section"
  echo "   • Test report scheduling"
  echo ""
  echo "3. ${YELLOW}Monitor for errors${NC}"
  echo "   • Check server logs"
  echo "   • Monitor error tracking (Sentry, etc.)"
  echo "   • Watch for 500 errors"
  echo ""
else
  echo "${RED}╔═══════════════════════════════════════════════════╗${NC}"
  echo "${RED}║     ⚠️  Tables Missing After Deployment          ║${NC}"
  echo "${RED}╚═══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Some tables are still missing after migration."
  echo ""
  echo "Troubleshooting:"
  echo "  1. Verify you're connected to the correct database"
  echo "  2. Check migration files exist in prisma/migrations/"
  echo "  3. Try re-running: ${YELLOW}npx prisma migrate deploy${NC}"
  echo "  4. Check logs for specific errors"
  echo ""
  echo "Need help? Check PRODUCTION_DEPLOYMENT_FIX.md"
  echo ""
fi

