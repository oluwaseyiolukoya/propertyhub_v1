#!/bin/bash

# Sync Production Data to Local Development Environment
# This script backs up production database and restores it locally

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Syncing Production Data to Local${NC}"
echo "===================================="
echo ""

# Check if PROD_DB_URL is set
if [ -z "$PROD_DB_URL" ]; then
  echo -e "${RED}❌ Error: PROD_DB_URL not set${NC}"
  echo ""
  echo "Please set it first:"
  echo ""
  echo -e "${YELLOW}  export PROD_DB_URL='postgresql://user:pass@host:port/db?sslmode=require'${NC}"
  echo ""
  echo "Get it from:"
  echo "  1. DigitalOcean Dashboard → Your App → Settings → Environment Variables"
  echo "  2. Or from DigitalOcean Console: echo \$DATABASE_URL"
  echo ""
  exit 1
fi

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
  echo -e "${RED}❌ Error: pg_dump not found${NC}"
  echo ""
  echo "Install PostgreSQL client:"
  echo "  macOS: brew install postgresql"
  echo "  Ubuntu: sudo apt-get install postgresql-client"
  echo ""
  exit 1
fi

# Create backups directory
mkdir -p backups

# Create backup
BACKUP_FILE="backups/production_backup_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${YELLOW}📦 Step 1: Creating production backup...${NC}"
echo "   File: $BACKUP_FILE"
echo ""

if pg_dump "$PROD_DB_URL" > "$BACKUP_FILE" 2>/dev/null; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo -e "${GREEN}✅ Backup created successfully ($BACKUP_SIZE)${NC}"
else
  echo -e "${RED}❌ Failed to create backup${NC}"
  echo ""
  echo "Possible issues:"
  echo "  - Invalid DATABASE_URL"
  echo "  - Network connection issues"
  echo "  - Database access denied"
  echo ""
  exit 1
fi
echo ""

# Set local database URL
LOCAL_DB_URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@localhost:5432/contrezz_local}"

echo -e "${YELLOW}🗑️  Step 2: Preparing local database...${NC}"
echo "   Database: contrezz_local"
echo ""

# Drop and recreate local database
if psql postgres -c "DROP DATABASE IF EXISTS contrezz_local;" 2>/dev/null; then
  echo "   ✅ Dropped existing database"
else
  echo -e "${YELLOW}   ⚠️  Could not drop database (might not exist)${NC}"
fi

if psql postgres -c "CREATE DATABASE contrezz_local;" 2>/dev/null; then
  echo "   ✅ Created fresh database"
  echo -e "${GREEN}✅ Local database ready${NC}"
else
  echo -e "${RED}❌ Failed to create local database${NC}"
  echo ""
  echo "Make sure PostgreSQL is running:"
  echo "  macOS: brew services start postgresql"
  echo "  Ubuntu: sudo service postgresql start"
  echo ""
  exit 1
fi
echo ""

# Restore to local
echo -e "${YELLOW}📥 Step 3: Restoring data to local database...${NC}"
echo "   This may take a few minutes..."
echo ""

if psql "$LOCAL_DB_URL" < "$BACKUP_FILE" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Data restored successfully${NC}"
else
  echo -e "${RED}❌ Failed to restore data${NC}"
  exit 1
fi
echo ""

# Generate Prisma Client
echo -e "${YELLOW}🔧 Step 4: Generating Prisma Client...${NC}"
echo ""

cd backend
if npx prisma generate > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Prisma Client generated${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: Could not generate Prisma Client${NC}"
  echo "   Run manually: cd backend && npx prisma generate"
fi
cd ..
echo ""

# Summary
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Production data synced to local successfully!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""

# Get record counts
echo -e "${BLUE}📊 Data Summary:${NC}"
echo ""

psql "$LOCAL_DB_URL" -t -c "
SELECT
  '  Customers: ' || COUNT(*) FROM customers
UNION ALL
SELECT
  '  Plans: ' || COUNT(*) FROM plans
UNION ALL
SELECT
  '  Users: ' || COUNT(*) FROM users
UNION ALL
SELECT
  '  Properties: ' || COUNT(*) FROM properties
UNION ALL
SELECT
  '  Projects: ' || COUNT(*) FROM developer_projects;
" 2>/dev/null || echo "  (Could not fetch counts)"

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1. Start backend:"
echo -e "   ${YELLOW}cd backend && npm run dev${NC}"
echo ""
echo "2. Start frontend (in another terminal):"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3. Open in browser:"
echo -e "   ${YELLOW}http://localhost:5173${NC}"
echo ""
echo "4. Login with production credentials"
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Ready to develop with production data!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Backup saved at: $BACKUP_FILE"
echo ""

