#!/bin/bash

# ========================================
# Migrate Career Postings to Public DB
# ========================================
# This script migrates career postings from
# the app database to the public database

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Career Data Migration                ║"
echo "║  App DB → Public DB                   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check environment variables
if [ -z "$APP_DATABASE_URL" ]; then
    echo -e "${RED}❌ APP_DATABASE_URL not set${NC}"
    echo "Set it with: export APP_DATABASE_URL='postgresql://...'"
    exit 1
fi

if [ -z "$PUBLIC_DATABASE_URL" ]; then
    echo -e "${RED}❌ PUBLIC_DATABASE_URL not set${NC}"
    echo "Set it with: export PUBLIC_DATABASE_URL='postgresql://...'"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Test connections
echo "Testing database connections..."

if ! psql "$APP_DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to app database${NC}"
    exit 1
fi

if ! psql "$PUBLIC_DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to public database${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database connections successful${NC}"
echo ""

# Count records
echo "Counting records in app database..."
APP_COUNT=$(psql "$APP_DATABASE_URL" -t -c "SELECT COUNT(*) FROM career_postings WHERE \"deletedAt\" IS NULL;")
echo "Found $APP_COUNT career postings in app database"
echo ""

# Ask for confirmation
read -p "Proceed with migration? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Migration cancelled"
    exit 0
fi

# Create temporary directory
TMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TMP_DIR"

# Export from app database
echo ""
echo "📤 Exporting from app database..."

psql "$APP_DATABASE_URL" -c "\COPY (
    SELECT
        id, title, department, location, type, remote, experience,
        description, requirements, salary, status, \"postedBy\", \"postedAt\",
        \"expiresAt\", \"viewCount\", \"applicationCount\", metadata,
        \"createdAt\", \"updatedAt\", \"deletedAt\"
    FROM career_postings
    WHERE \"deletedAt\" IS NULL
) TO '$TMP_DIR/careers.csv' CSV HEADER"

echo -e "${GREEN}✅ Export complete${NC}"

# Import to public database
echo ""
echo "📥 Importing to public database..."

# First, update the schema if needed (add responsibilities and benefits columns)
psql "$PUBLIC_DATABASE_URL" -c "
    ALTER TABLE career_postings
    ADD COLUMN IF NOT EXISTS responsibilities TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}';
" 2>/dev/null || true

# Import data
psql "$PUBLIC_DATABASE_URL" -c "\COPY career_postings (
    id, title, department, location, type, remote, experience,
    description, requirements, salary, status, \"postedBy\", \"postedAt\",
    \"expiresAt\", \"viewCount\", \"applicationCount\", metadata,
    \"createdAt\", \"updatedAt\", \"deletedAt\"
) FROM '$TMP_DIR/careers.csv' CSV HEADER"

echo -e "${GREEN}✅ Import complete${NC}"

# Verify migration
echo ""
echo "🔍 Verifying migration..."

PUBLIC_COUNT=$(psql "$PUBLIC_DATABASE_URL" -t -c "SELECT COUNT(*) FROM career_postings WHERE \"deletedAt\" IS NULL;")
echo "Public database now has $PUBLIC_COUNT career postings"

if [ "$APP_COUNT" -eq "$PUBLIC_COUNT" ]; then
    echo -e "${GREEN}✅ Migration successful! Counts match.${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Counts don't match${NC}"
    echo "App DB: $APP_COUNT"
    echo "Public DB: $PUBLIC_COUNT"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
rm -rf "$TMP_DIR"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Migration Complete!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "1. Test public API endpoints"
echo "2. Update frontend to use public API"
echo "3. Set up sync service for future updates"
echo ""
