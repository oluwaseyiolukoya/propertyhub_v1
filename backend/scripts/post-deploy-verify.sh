#!/bin/bash

# 🔍 POST-DEPLOY VERIFICATION SCRIPT
# Runs automatically after deployment to verify everything is correct
# Exit code 0 = success, 1 = failure

set -e

echo "🔍 Post-Deploy Verification Starting..."
echo ""

# Check 1: Prisma Client is generated
if [ ! -d "node_modules/.prisma/client" ]; then
    echo "❌ FAIL: Prisma Client not generated"
    exit 1
fi
echo "✓ Prisma Client exists"

# Check 2: System roles exist
ROLE_COUNT=$(node -e 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.team_roles.count({where:{is_system_role:true}}).then(c=>{console.log(c);process.exit(c===5?0:1)}).catch(()=>process.exit(1)).finally(()=>p.$disconnect());' 2>&1 | tail -1)

if [ "$ROLE_COUNT" = "5" ]; then
    echo "✓ System roles: 5"
else
    echo "❌ FAIL: System roles count = $ROLE_COUNT (expected 5)"
    exit 1
fi

# Check 3: Notification templates exist
TEMPLATE_COUNT=$(node -e 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.notification_templates.count({where:{is_system:true}}).then(c=>{console.log(c);process.exit(c>=5?0:1)}).catch(()=>process.exit(1)).finally(()=>p.$disconnect());' 2>&1 | tail -1)

if [ "$TEMPLATE_COUNT" -ge "5" ]; then
    echo "✓ Notification templates: $TEMPLATE_COUNT"
else
    echo "❌ FAIL: Notification templates count = $TEMPLATE_COUNT (expected >= 5)"
    exit 1
fi

echo ""
echo "✅ All post-deploy checks passed!"
exit 0

