#!/bin/bash

# Database Restore Script
# This script restores a database backup

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Database Restore Script ===${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Backup file not specified${NC}"
    echo "Usage: ./scripts/restore-database.sh <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Extract database name from DATABASE_URL
DB_URL="${DATABASE_URL}"
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"
echo ""

# Confirm restore
echo -e "${RED}⚠️  WARNING: This will overwrite all data in the database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
fi

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup...${NC}"
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
fi

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"
if psql "$DB_URL" < "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"

    # Clean up temp file if we decompressed
    if [ -f "$TEMP_FILE" ]; then
        rm "$TEMP_FILE"
    fi

    echo ""
    echo -e "${GREEN}=== Restore Complete ===${NC}"
    echo -e "${YELLOW}Note: You may need to run 'npx prisma generate' to update Prisma Client${NC}"
else
    echo -e "${RED}✗ Restore failed!${NC}"
    echo -e "${RED}Make sure PostgreSQL is running and DATABASE_URL is correct${NC}"
    exit 1
fi

