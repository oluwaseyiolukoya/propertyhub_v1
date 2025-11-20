#!/bin/bash

# 🔍 PRODUCTION PARITY VERIFICATION SCRIPT
# Checks if production has everything it needs
#
# Usage:
#   cd /workspace/backend
#   bash scripts/verify-production-parity.sh

echo "════════════════════════════════════════════════════════════"
echo "🔍 PRODUCTION PARITY VERIFICATION"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Check function
check() {
    local name="$1"
    local command="$2"
    local expected="$3"

    echo -e "${BLUE}Checking: $name${NC}"
    result=$(eval "$command" 2>&1)

    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        echo ""
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# ============================================
# SCHEMA CHECKS
# ============================================

echo "═══ SCHEMA CHECKS ═══"
echo ""

check "Prisma migrations status" \
    "npx prisma migrate status 2>&1" \
    "Database schema is up to date"

check "team_roles table exists" \
    "node -e 'const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();p.team_roles.count().then(c=>console.log(\"exists\")).catch(()=>console.log(\"missing\")).finally(()=>p.\$disconnect());'" \
    "exists"

check "team_members table exists" \
    "node -e 'const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();p.team_members.count().then(c=>console.log(\"exists\")).catch(()=>console.log(\"missing\")).finally(()=>p.\$disconnect());'" \
    "exists"

check "notifications table exists" \
    "node -e 'const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();p.notifications.count().then(c=>console.log(\"exists\")).catch(()=>console.log(\"missing\")).finally(()=>p.\$disconnect());'" \
    "exists"

check "email_queue table exists" \
    "node -e 'const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();p.email_queue.count().then(c=>console.log(\"exists\")).catch(()=>console.log(\"missing\")).finally(()=>p.\$disconnect());'" \
    "exists"

check "notification_templates table exists" \
    "node -e 'const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();p.notification_templates.count().then(c=>console.log(\"exists\")).catch(()=>console.log(\"missing\")).finally(()=>p.\$disconnect());'" \
    "exists"

# ============================================
# SYSTEM DATA CHECKS
# ============================================

echo "═══ SYSTEM DATA CHECKS ═══"
echo ""

check "System roles count (should be 5)" \
    "node -e 'const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();p.team_roles.count({where:{is_system_role:true}}).then(c=>console.log(c)).finally(()=>p.\$disconnect());'" \
    "5"

check "Owner role exists" \
    "node -e 'const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();p.team_roles.findUnique({where:{id:\"role-owner\"}}).then(r=>console.log(r?\"exists\":\"missing\")).finally(()=>p.\$disconnect());'" \
    "exists"

check "Finance Manager role exists" \
    "node -e 'const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();p.team_roles.findUnique({where:{id:\"role-finance-manager\"}}).then(r=>console.log(r?\"exists\":\"missing\")).finally(()=>p.\$disconnect());'" \
    "exists"

check "Team invitation template exists" \
    "node -e 'const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();p.notification_templates.findFirst({where:{type:\"team_invitation\"}}).then(r=>console.log(r?\"exists\":\"missing\")).catch(()=>console.log(\"table_missing\")).finally(()=>p.\$disconnect());'" \
    "exists"

# ============================================
# ENVIRONMENT CHECKS
# ============================================

echo "═══ ENVIRONMENT CHECKS ═══"
echo ""

if [ -z "$SMTP_HOST" ]; then
    echo -e "${YELLOW}⚠ SMTP_HOST not set${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ SMTP_HOST is set: $SMTP_HOST${NC}"
fi

if [ -z "$SMTP_FROM" ]; then
    echo -e "${YELLOW}⚠ SMTP_FROM not set${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ SMTP_FROM is set: $SMTP_FROM${NC}"
fi

if [ -z "$SMTP_USER" ]; then
    echo -e "${YELLOW}⚠ SMTP_USER not set${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ SMTP_USER is set${NC}"
fi

if [ -z "$SMTP_PASS" ]; then
    echo -e "${YELLOW}⚠ SMTP_PASS not set${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ SMTP_PASS is set${NC}"
fi

echo ""

# ============================================
# SUMMARY
# ============================================

echo "════════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo ""
    echo "Production is in perfect parity with your codebase!"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Production schema is correct, but check environment variables."
    echo ""
    exit 0
else
    echo -e "${RED}❌ CHECKS FAILED${NC}"
    echo ""
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Run: bash scripts/production-full-sync.sh"
    echo ""
    exit 1
fi

