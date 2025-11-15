#!/bin/bash

# Database Backup Script
# This script creates a backup of the PostgreSQL database before migration

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Database Backup Script ===${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Extract database name from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL="${DATABASE_URL}"
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p' || echo "5432")

# Create backup directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"

echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo -e "${YELLOW}Host: ${DB_HOST}${NC}"
echo -e "${YELLOW}Port: ${DB_PORT}${NC}"
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"
echo ""

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}✗ Error: pg_dump not found${NC}"
    echo -e "${YELLOW}Install PostgreSQL client tools or use alternative backup method${NC}"
    exit 1
fi

# Create backup using pg_dump
echo -e "${YELLOW}Creating backup...${NC}"
echo -e "${YELLOW}Using DATABASE_URL: ${DB_URL:0:30}...${NC}"

# Try backup with error output
if pg_dump "$DB_URL" > "$BACKUP_FILE" 2>&1; then
    # Check if file was created and has content
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        echo -e "${GREEN}✓ Backup created successfully${NC}"

        # Compress backup
        echo -e "${YELLOW}Compressing backup...${NC}"
        gzip "$BACKUP_FILE"
        echo -e "${GREEN}✓ Backup compressed: ${BACKUP_FILE_COMPRESSED}${NC}"

        # Get file size
        FILE_SIZE=$(du -h "$BACKUP_FILE_COMPRESSED" | cut -f1)
        echo -e "${GREEN}✓ Backup size: ${FILE_SIZE}${NC}"

        # Save backup info
        echo "$BACKUP_FILE_COMPRESSED" > "$BACKUP_DIR/latest_backup.txt"
        echo -e "${GREEN}✓ Backup info saved to ${BACKUP_DIR}/latest_backup.txt${NC}"

        echo ""
        echo -e "${GREEN}=== Backup Complete ===${NC}"
        echo -e "${GREEN}Backup location: ${BACKUP_FILE_COMPRESSED}${NC}"
    else
        echo -e "${RED}✗ Backup file is empty or not created${NC}"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    ERROR_OUTPUT=$(pg_dump "$DB_URL" 2>&1)
    echo -e "${RED}✗ Backup failed!${NC}"
    echo -e "${RED}Error details:${NC}"
    echo "$ERROR_OUTPUT" | head -5
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "  1. Check PostgreSQL is running: pg_isready"
    echo -e "  2. Verify DATABASE_URL in .env file"
    echo -e "  3. Check database permissions"
    echo -e "  4. Try connecting manually: psql \"\$DATABASE_URL\""
    rm -f "$BACKUP_FILE"
    exit 1
fi

