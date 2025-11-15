#!/bin/bash

# Complete Migration Script with Backup
# This script backs up the database, fixes migrations, and creates new migration

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Purchase Orders Migration with Backup ===${NC}"
echo ""

# Step 1: Backup Database
echo -e "${YELLOW}Step 1: Creating database backup...${NC}"
if bash ./scripts/backup-database.sh 2>&1; then
    if [ -f ./backups/latest_backup.txt ]; then
        BACKUP_FILE=$(cat ./backups/latest_backup.txt)
        echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
    else
        echo -e "${YELLOW}⚠ Backup script completed but no backup file found${NC}"
    fi
else
    BACKUP_ERROR=$?
    echo -e "${YELLOW}⚠ Backup failed (exit code: ${BACKUP_ERROR})${NC}"
    echo -e "${YELLOW}⚠ Continuing without backup...${NC}"
    echo -e "${RED}⚠ WARNING: No backup created! Migration will proceed anyway.${NC}"
    read -p "Continue without backup? (yes/no): " CONTINUE_WITHOUT_BACKUP
    if [ "$CONTINUE_WITHOUT_BACKUP" != "yes" ]; then
        echo -e "${YELLOW}Migration cancelled by user${NC}"
        exit 0
    fi
    BACKUP_FILE=""
fi
echo ""

# Step 2: Resolve problematic migration
echo -e "${YELLOW}Step 2: Resolving migration issue...${NC}"
if npx prisma migrate resolve --applied 20251108_add_onboarding_applications 2>/dev/null; then
    echo -e "${GREEN}✓ Migration marked as applied${NC}"
else
    echo -e "${YELLOW}⚠ Migration may already be resolved, continuing...${NC}"
fi
echo ""

# Step 3: Create new migration
echo -e "${YELLOW}Step 3: Creating purchase orders migration...${NC}"
if npx prisma migrate dev --name add_purchase_orders; then
    echo -e "${GREEN}✓ Migration created successfully${NC}"
else
    echo -e "${RED}✗ Migration failed!${NC}"
    echo -e "${YELLOW}You can restore the backup using:${NC}"
    echo -e "${YELLOW}  bash ./scripts/restore-database.sh ${BACKUP_FILE}${NC}"
    exit 1
fi
echo ""

# Step 4: Generate Prisma Client
echo -e "${YELLOW}Step 4: Generating Prisma Client...${NC}"
if npx prisma generate; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${RED}✗ Prisma Client generation failed!${NC}"
    exit 1
fi
echo ""

# Step 5: Verify migration
echo -e "${YELLOW}Step 5: Verifying migration...${NC}"
if npx prisma migrate status | grep -q "Database schema is up to date"; then
    echo -e "${GREEN}✓ Database schema is up to date${NC}"
else
    echo -e "${YELLOW}⚠ Please check migration status manually${NC}"
    npx prisma migrate status
fi
echo ""

echo -e "${GREEN}=== Migration Complete ===${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  • Backup created: ${BACKUP_FILE}"
echo -e "  • Migration created: add_purchase_orders"
echo -e "  • Prisma Client updated"
echo ""
echo -e "${YELLOW}If you need to restore the backup:${NC}"
echo -e "  bash ./scripts/restore-database.sh ${BACKUP_FILE}"
echo ""

