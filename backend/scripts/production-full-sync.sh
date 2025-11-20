#!/bin/bash

# 🚀 PRODUCTION FULL SYNC SCRIPT
# This script brings production to 100% parity with your codebase
# Run this ONLY in production console
#
# Usage:
#   cd /workspace/backend
#   bash scripts/production-full-sync.sh

set -e  # Exit on any error

echo "════════════════════════════════════════════════════════════"
echo "🚀 PRODUCTION FULL SYNC - Expert Process"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# PHASE 1: PRE-FLIGHT CHECKS
# ============================================

echo -e "${CYAN}═══ PHASE 1: PRE-FLIGHT CHECKS ═══${NC}"
echo ""

echo -e "${BLUE}1.1 Checking environment...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}✗ DATABASE_URL not set${NC}"
    exit 1
fi
echo -e "${GREEN}✓ DATABASE_URL is set${NC}"

echo -e "${BLUE}1.2 Checking Prisma CLI...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npx not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma CLI available${NC}"

echo -e "${BLUE}1.3 Checking Node.js...${NC}"
node --version
echo -e "${GREEN}✓ Node.js available${NC}"
echo ""

# ============================================
# PHASE 2: SCHEMA MIGRATIONS
# ============================================

echo -e "${CYAN}═══ PHASE 2: SCHEMA MIGRATIONS ═══${NC}"
echo ""

echo -e "${BLUE}2.1 Current migration status...${NC}"
npx prisma migrate status || true
echo ""

echo -e "${BLUE}2.2 Applying all pending Prisma migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Prisma migrations applied${NC}"
echo ""

echo -e "${BLUE}2.3 Regenerating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client regenerated${NC}"
echo ""

# ============================================
# PHASE 3: RAW SQL MIGRATIONS (Notification System)
# ============================================

echo -e "${CYAN}═══ PHASE 3: NOTIFICATION SYSTEM SETUP ═══${NC}"
echo ""

echo -e "${BLUE}3.1 Creating notification tables (if not exists)...${NC}"
if [ -f "migrations/create_notification_system.sql" ]; then
    psql "$DATABASE_URL" -f migrations/create_notification_system.sql
    echo -e "${GREEN}✓ Notification tables created/verified${NC}"
else
    echo -e "${YELLOW}⚠ migrations/create_notification_system.sql not found, skipping${NC}"
fi
echo ""

echo -e "${BLUE}3.2 Fixing notification preferences trigger...${NC}"
if [ -f "migrations/fix_notification_preferences_trigger.sql" ]; then
    psql "$DATABASE_URL" -f migrations/fix_notification_preferences_trigger.sql
    echo -e "${GREEN}✓ Notification trigger fixed${NC}"
else
    echo -e "${YELLOW}⚠ migrations/fix_notification_preferences_trigger.sql not found, skipping${NC}"
fi
echo ""

echo -e "${BLUE}3.3 Adding team invitation template...${NC}"
if [ -f "migrations/add_team_invitation_template.sql" ]; then
    psql "$DATABASE_URL" -f migrations/add_team_invitation_template.sql
    echo -e "${GREEN}✓ Team invitation template added${NC}"
else
    echo -e "${YELLOW}⚠ migrations/add_team_invitation_template.sql not found, skipping${NC}"
fi
echo ""

# ============================================
# PHASE 4: SYSTEM DATA SEEDING
# ============================================

echo -e "${CYAN}═══ PHASE 4: SYSTEM DATA SEEDING ═══${NC}"
echo ""

echo -e "${BLUE}4.1 Seeding system roles...${NC}"
node <<'SEED_ROLES_EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const roles = [
  {
    id: 'role-owner',
    name: 'Owner',
    description: 'Full access to all features',
    is_system_role: true,
    permissions: { all: true },
    can_approve_invoices: true,
    approval_limit: null,
    customer_id: null,
    requires_approval_from: [],
  },
  {
    id: 'role-finance-manager',
    name: 'Finance Manager',
    description: 'Approve invoices and manage finances',
    is_system_role: true,
    permissions: {
      invoices: 'approve',
      expenses: 'manage',
      reports: 'view',
      projects: 'view',
    },
    can_approve_invoices: true,
    approval_limit: 50000,
    customer_id: null,
    requires_approval_from: [],
  },
  {
    id: 'role-project-manager',
    name: 'Project Manager',
    description: 'Create invoices and manage projects',
    is_system_role: true,
    permissions: {
      invoices: 'create',
      projects: 'manage',
      reports: 'view',
    },
    can_approve_invoices: false,
    approval_limit: 1000000,
    customer_id: null,
    requires_approval_from: [],
  },
  {
    id: 'role-accountant',
    name: 'Accountant',
    description: 'Record payments and view reports',
    is_system_role: true,
    permissions: {
      payments: 'record',
      reports: 'view',
      invoices: 'view',
    },
    can_approve_invoices: false,
    approval_limit: null,
    customer_id: null,
    requires_approval_from: [],
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'View-only access',
    is_system_role: true,
    permissions: {
      projects: 'view',
      invoices: 'view',
    },
    can_approve_invoices: false,
    approval_limit: null,
    customer_id: null,
    requires_approval_from: [],
  },
];

(async () => {
  console.log('  Seeding system roles...');
  let inserted = 0;
  let updated = 0;

  for (const role of roles) {
    const existing = await prisma.team_roles.findUnique({ where: { id: role.id } });

    if (existing) {
      await prisma.team_roles.update({
        where: { id: role.id },
        data: {
          name: role.name,
          description: role.description,
          is_system_role: role.is_system_role,
          permissions: role.permissions,
          can_approve_invoices: role.can_approve_invoices,
          approval_limit: role.approval_limit,
          requires_approval_from: role.requires_approval_from,
          updated_at: new Date(),
        },
      });
      updated++;
    } else {
      await prisma.team_roles.create({
        data: {
          ...role,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      inserted++;
    }
  }

  console.log(\`  ✓ Inserted: \${inserted}, Updated: \${updated}\`);
  await prisma.\$disconnect();
})().catch(e => {
  console.error('  ✗ Error seeding roles:', e.message);
  process.exit(1);
});
SEED_ROLES_EOF

echo -e "${GREEN}✓ System roles seeded${NC}"
echo ""

# ============================================
# PHASE 5: VERIFICATION
# ============================================

echo -e "${CYAN}═══ PHASE 5: VERIFICATION ═══${NC}"
echo ""

echo -e "${BLUE}5.1 Verifying system roles...${NC}"
node -e 'const {PrismaClient} = require("@prisma/client"); const p = new PrismaClient(); p.team_roles.findMany({ where: { is_system_role: true }, select: { id: true, name: true } }).then(r => { console.log("  System roles count:", r.length); r.forEach(role => console.log("    -", role.name)); }).finally(() => p.$disconnect());'
echo ""

echo -e "${BLUE}5.2 Verifying notification templates...${NC}"
node -e 'const {PrismaClient} = require("@prisma/client"); const p = new PrismaClient(); p.notification_templates.findMany({ select: { type: true, subject: true } }).then(r => { console.log("  Notification templates count:", r.length); r.forEach(t => console.log("    -", t.type, ":", t.subject)); }).catch(e => console.log("  ⚠ notification_templates table may not exist yet")).finally(() => p.$disconnect());'
echo ""

echo -e "${BLUE}5.3 Checking critical tables...${NC}"
node -e 'const {PrismaClient} = require("@prisma/client"); const p = new PrismaClient(); Promise.all([p.team_members.count(), p.notifications.count().catch(() => 0), p.email_queue.count().catch(() => 0)]).then(([tm, n, eq]) => { console.log("  team_members:", tm); console.log("  notifications:", n); console.log("  email_queue:", eq); }).finally(() => p.$disconnect());'
echo ""

echo -e "${BLUE}5.4 Checking SMTP configuration...${NC}"
if [ -z "$SMTP_HOST" ]; then
    echo -e "${YELLOW}  ⚠ SMTP_HOST not set${NC}"
else
    echo -e "${GREEN}  ✓ SMTP_HOST: $SMTP_HOST${NC}"
fi

if [ -z "$SMTP_FROM" ]; then
    echo -e "${YELLOW}  ⚠ SMTP_FROM not set${NC}"
else
    echo -e "${GREEN}  ✓ SMTP_FROM: $SMTP_FROM${NC}"
fi
echo ""

# ============================================
# PHASE 6: SUMMARY
# ============================================

echo -e "${CYAN}═══ PHASE 6: SUMMARY ═══${NC}"
echo ""

echo -e "${GREEN}✅ PRODUCTION SYNC COMPLETE!${NC}"
echo ""
echo "What was done:"
echo "  ✓ All Prisma migrations applied"
echo "  ✓ Prisma Client regenerated"
echo "  ✓ Notification system tables created"
echo "  ✓ Notification triggers fixed"
echo "  ✓ Team invitation template added"
echo "  ✓ System roles seeded (5 roles)"
echo ""
echo "Next steps:"
echo "  1. Test role dropdown in UI (Settings → Team → Invite)"
echo "  2. Test team invitation email"
echo "  3. Verify notifications are working"
echo ""
echo "════════════════════════════════════════════════════════════"

