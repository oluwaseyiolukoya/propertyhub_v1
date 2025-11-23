#!/bin/bash

# ============================================
# Prisma Migration Helper Script
# ============================================
# This script ensures you follow the correct workflow
# for creating database migrations.
#
# Usage:
#   bash scripts/create-migration.sh "describe_your_change"
#
# Example:
#   bash scripts/create-migration.sh "add_user_preferences_table"
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if migration name provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Migration name required${NC}"
  echo ""
  echo "Usage: bash scripts/create-migration.sh \"describe_your_change\""
  echo ""
  echo "Examples:"
  echo "  bash scripts/create-migration.sh \"add_user_preferences\""
  echo "  bash scripts/create-migration.sh \"update_customer_schema\""
  exit 1
fi

MIGRATION_NAME="$1"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Prisma Migration Creator${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Check if schema.prisma has been modified
echo -e "${YELLOW}📋 Step 1: Checking schema.prisma...${NC}"

if git diff --quiet prisma/schema.prisma; then
  echo -e "${YELLOW}⚠️  Warning: schema.prisma has no uncommitted changes${NC}"
  echo -e "${YELLOW}   Did you forget to edit it?${NC}"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✅ schema.prisma has changes${NC}"
fi

echo ""

# Step 2: Check migration status
echo -e "${YELLOW}📋 Step 2: Checking migration status...${NC}"

if ! npx prisma migrate status > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: Migrations are out of sync${NC}"
  echo ""
  echo "Please run one of these first:"
  echo "  npx prisma migrate resolve --applied \"migration_name\""
  echo "  npx prisma migrate resolve --rolled-back \"migration_name\""
  exit 1
fi

echo -e "${GREEN}✅ Migration status is clean${NC}"
echo ""

# Step 3: Create migration
echo -e "${YELLOW}📋 Step 3: Creating migration...${NC}"
echo ""

npx prisma migrate dev --name "$MIGRATION_NAME"

if [ $? -ne 0 ]; then
  echo ""
  echo -e "${RED}❌ Migration failed${NC}"
  echo ""
  echo "Common issues:"
  echo "  1. Database is locked (close other connections)"
  echo "  2. Schema has errors (check syntax)"
  echo "  3. Migration conflicts with existing data"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Migration created successfully${NC}"
echo ""

# Step 4: Show what was created
echo -e "${YELLOW}📋 Step 4: Migration files created:${NC}"
LATEST_MIGRATION=$(ls -t prisma/migrations | head -1)
echo -e "${BLUE}   prisma/migrations/$LATEST_MIGRATION/${NC}"
echo ""

# Step 5: Remind to commit
echo -e "${YELLOW}📋 Step 5: Next steps:${NC}"
echo ""
echo -e "${GREEN}1. Review the migration:${NC}"
echo "   cat prisma/migrations/$LATEST_MIGRATION/migration.sql"
echo ""
echo -e "${GREEN}2. Test your application:${NC}"
echo "   npm run dev"
echo ""
echo -e "${GREEN}3. Commit to git:${NC}"
echo "   git add prisma/migrations/"
echo "   git add prisma/schema.prisma"
echo "   git commit -m \"migration: $MIGRATION_NAME\""
echo "   git push"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Migration workflow complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

