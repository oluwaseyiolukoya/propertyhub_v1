#!/bin/bash

# Landing Page Management Setup Script
# This script sets up the Landing Page Management system

echo "🚀 Setting up Landing Page Management System"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Checking prerequisites...${NC}"

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: backend directory not found.${NC}"
    exit 1
fi

# Check if Prisma is installed
cd backend
if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}❌ Error: Prisma schema not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Step 2: Run Prisma migration
echo -e "${BLUE}📋 Step 2: Running database migration...${NC}"
echo ""

npx prisma migrate dev --name add_landing_page_submissions

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migration failed. Please check the error above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Migration completed successfully${NC}"
echo ""

# Step 3: Generate Prisma Client
echo -e "${BLUE}📋 Step 3: Generating Prisma Client...${NC}"
echo ""

npx prisma generate

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prisma generate failed. Please check the error above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prisma Client generated successfully${NC}"
echo ""

# Step 4: Instructions
cd ..
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📚 Next Steps:${NC}"
echo ""
echo "1. Restart your backend server:"
echo -e "   ${YELLOW}cd backend && npm run dev${NC}"
echo ""
echo "2. Restart your frontend server:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3. Login as admin and navigate to:"
echo -e "   ${YELLOW}Admin Dashboard > Landing Page${NC}"
echo ""
echo "4. Test the system:"
echo -e "   ${YELLOW}curl -X GET http://localhost:5000/api/admin/landing-forms/admin/stats${NC}"
echo -e "   ${YELLOW}(Replace with your admin auth token)${NC}"
echo ""
echo -e "${BLUE}📄 Documentation:${NC}"
echo "  - Architecture: docs/LANDING_PAGE_FORMS_ARCHITECTURE.md"
echo "  - Quick Start: docs/LANDING_PAGE_FORMS_QUICK_START.md"
echo "  - Implementation: docs/LANDING_PAGE_MANAGEMENT_IMPLEMENTATION.md"
echo ""
echo -e "${GREEN}Happy managing! 🚀${NC}"

