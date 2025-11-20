#!/bin/bash

# 🔧 COMPREHENSIVE PRODUCTION DATABASE FIX SCRIPT
# This script fixes ALL missing elements in production database
#
# Usage:
#   cd /workspace/backend
#   bash scripts/fix-all-production-issues.sh

set -e  # Exit on any error

echo "🚀 Starting comprehensive production database sync..."
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Prisma CLI
echo -e "${BLUE}Step 1: Checking Prisma CLI...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npx not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma CLI available${NC}"
echo ""

# Step 2: Check migration status
echo -e "${BLUE}Step 2: Checking migration status...${NC}"
npx prisma migrate status
echo ""

# Step 3: Run all pending migrations
echo -e "${BLUE}Step 3: Running pending migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrations applied${NC}"
echo ""

# Step 4: Regenerate Prisma Client
echo -e "${BLUE}Step 4: Regenerating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client regenerated${NC}"
echo ""

# Step 5: Run audit script
echo -e "${BLUE}Step 5: Running database audit...${NC}"
node scripts/audit-and-sync-production.js
AUDIT_EXIT_CODE=$?
echo ""

# Step 6: Insert system roles if needed
if [ $AUDIT_EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}⚠ Audit found issues, attempting to fix...${NC}"
    echo ""
    
    echo -e "${BLUE}Step 6a: Inserting system roles...${NC}"
    node scripts/insert-system-roles-safe.js
    echo ""
    
    echo -e "${BLUE}Step 6b: Re-running audit...${NC}"
    node scripts/audit-and-sync-production.js
    echo ""
fi

# Step 7: Verify final state
echo -e "${BLUE}Step 7: Final verification...${NC}"
echo ""

echo -e "${BLUE}Checking system roles:${NC}"
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.team_roles.findMany({where:{is_system_role:true},select:{name:true}}).then(r=>{console.log('System roles:',r.length);r.forEach(x=>console.log('  -',x.name))}).finally(()=>p.\$disconnect());"
echo ""

echo -e "${BLUE}Checking notification templates:${NC}"
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.notification_templates.count().then(c=>console.log('Templates:',c)).finally(()=>p.\$disconnect());"
echo ""

echo -e "${BLUE}Checking critical tables:${NC}"
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();Promise.all([p.team_members.count(),p.invoice_attachments.count(),p.storage_usage.count()]).then(([tm,ia,su])=>console.log('team_members:',tm,'invoice_attachments:',ia,'storage_usage:',su)).finally(()=>p.\$disconnect());"
echo ""

echo "=================================================="
echo -e "${GREEN}✅ Production database sync complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Test role dropdown in UI"
echo "2. Try creating a project"
echo "3. Try inviting a team member"
echo "4. Verify all features work"
echo ""

