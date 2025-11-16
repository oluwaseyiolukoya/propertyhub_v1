#!/bin/bash

# Sync Production Data via DigitalOcean Console
# This method creates the backup in production and downloads it

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Syncing Production Data (Alternative Method)${NC}"
echo "================================================"
echo ""

echo -e "${YELLOW}This method creates the backup IN production, then downloads it.${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Step 1: Create Backup in Production${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://cloud.digitalocean.com/apps"
echo "2. Click your app"
echo "3. Click 'Console' tab"
echo "4. Run these commands:"
echo ""
echo -e "${GREEN}   cd /tmp"
echo -e "   pg_dump \"\$DATABASE_URL\" > production_backup.sql"
echo -e "   gzip production_backup.sql"
echo -e "   ls -lh production_backup.sql.gz${NC}"
echo ""
echo "5. Note the file size shown"
echo ""
read -p "Press ENTER when backup is created in production..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Step 2: Download Backup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Since we can't directly download from the console, we'll use an alternative:"
echo ""
echo "Option A: Upload to a temporary location"
echo "  In production console, run:"
echo -e "${GREEN}   # This will output the backup content"
echo -e "   cat /tmp/production_backup.sql.gz | base64${NC}"
echo ""
echo "Option B: Use DigitalOcean Spaces or S3"
echo "Option C: Use the database backup feature in DigitalOcean"
echo ""
echo -e "${YELLOW}⚠️  This method is complex. Let's try a simpler approach...${NC}"
echo ""

exit 0

