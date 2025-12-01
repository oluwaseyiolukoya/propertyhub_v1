#!/bin/bash

# ============================================
# Prisma Migration Health Check Script
# ============================================
# This script checks if your database and migrations
# are in sync and provides actionable advice.
#
# Usage:
#   bash scripts/check-migration-health.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Prisma Migration Health Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check 1: Prisma CLI available
echo -e "${YELLOW}🔍 Check 1: Prisma CLI${NC}"
if command -v npx &> /dev/null; then
  echo -e "${GREEN}✅ Prisma CLI available${NC}"
else
  echo -e "${RED}❌ Prisma CLI not found${NC}"
  exit 1
fi
echo ""

# Check 2: Database connection
echo -e "${YELLOW}🔍 Check 2: Database Connection${NC}"
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database connection successful${NC}"
else
  echo -e "${RED}❌ Cannot connect to database${NC}"
  echo -e "${YELLOW}   Check your DATABASE_URL in .env${NC}"
  exit 1
fi
echo ""

# Check 3: Migration status
echo -e "${YELLOW}🔍 Check 3: Migration Status${NC}"
MIGRATION_STATUS=$(npx prisma migrate status 2>&1)

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
  echo -e "${GREEN}✅ All migrations applied${NC}"
  MIGRATIONS_OK=true
elif echo "$MIGRATION_STATUS" | grep -q "Following migration have failed"; then
  echo -e "${RED}❌ Failed migrations detected${NC}"
  echo ""
  echo "$MIGRATION_STATUS" | grep -A 5 "Following migration have failed"
  echo ""
  echo -e "${YELLOW}📝 To fix:${NC}"
  echo "   If you fixed the database manually:"
  echo "   npx prisma migrate resolve --applied \"migration_name\""
  echo ""
  echo "   If you rolled back the migration:"
  echo "   npx prisma migrate resolve --rolled-back \"migration_name\""
  MIGRATIONS_OK=false
elif echo "$MIGRATION_STATUS" | grep -q "pending migrations"; then
  echo -e "${YELLOW}⚠️  Pending migrations detected${NC}"
  echo ""
  echo "$MIGRATION_STATUS" | grep -A 10 "pending migrations"
  echo ""
  echo -e "${YELLOW}📝 To apply:${NC}"
  echo "   npx prisma migrate deploy"
  MIGRATIONS_OK=false
else
  echo -e "${YELLOW}⚠️  Unknown migration status${NC}"
  echo "$MIGRATION_STATUS"
  MIGRATIONS_OK=false
fi
echo ""

# Check 4: Schema drift
echo -e "${YELLOW}🔍 Check 4: Schema Drift${NC}"
DRIFT_CHECK=$(npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script 2>&1 || true)

if [ -z "$DRIFT_CHECK" ] || echo "$DRIFT_CHECK" | grep -q "No difference detected"; then
  echo -e "${GREEN}✅ No schema drift detected${NC}"
  DRIFT_OK=true
else
  echo -e "${YELLOW}⚠️  Schema drift detected${NC}"
  echo ""
  echo "Your schema.prisma doesn't match the database."
  echo ""
  echo -e "${YELLOW}📝 To fix:${NC}"
  echo "   Create a new migration:"
  echo "   bash scripts/create-migration.sh \"sync_schema_drift\""
  DRIFT_OK=false
fi
echo ""

# Check 5: Uncommitted migrations
echo -e "${YELLOW}🔍 Check 5: Git Status${NC}"
if git diff --quiet prisma/migrations/ 2>/dev/null; then
  echo -e "${GREEN}✅ No uncommitted migrations${NC}"
  GIT_OK=true
else
  echo -e "${YELLOW}⚠️  Uncommitted migration files detected${NC}"
  echo ""
  git status prisma/migrations/ --short
  echo ""
  echo -e "${YELLOW}📝 To fix:${NC}"
  echo "   git add prisma/migrations/"
  echo "   git commit -m \"migration: describe your change\""
  GIT_OK=false
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$MIGRATIONS_OK" = true ] && [ "$DRIFT_OK" = true ] && [ "$GIT_OK" = true ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo -e "${GREEN}   Your database is healthy and in sync.${NC}"
  echo ""
  exit 0
else
  echo -e "${YELLOW}⚠️  Issues detected:${NC}"
  [ "$MIGRATIONS_OK" = false ] && echo "   - Migration issues"
  [ "$DRIFT_OK" = false ] && echo "   - Schema drift"
  [ "$GIT_OK" = false ] && echo "   - Uncommitted changes"
  echo ""
  echo -e "${YELLOW}📚 See docs/WHY_DATABASE_BREAKS_AND_PERMANENT_SOLUTION.md${NC}"
  echo ""
  exit 1
fi




