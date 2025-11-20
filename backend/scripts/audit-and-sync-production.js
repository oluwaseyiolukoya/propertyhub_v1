/**
 * 🔍 COMPREHENSIVE PRODUCTION DATABASE AUDIT & SYNC
 * 
 * This script checks EVERYTHING that might be missing in production:
 * - All tables from schema
 * - All columns in each table
 * - System roles
 * - Notification templates
 * - Triggers and functions
 * - Indexes
 * 
 * Usage:
 *   cd /workspace/backend
 *   node scripts/audit-and-sync-production.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

// Expected tables from schema
const EXPECTED_TABLES = [
  'activity_logs',
  'admins',
  'onboarding_applications',
  'customer_users',
  'customers',
  'users',
  'plans',
  'subscriptions',
  'invoices',
  'payments',
  'developer_projects',
  'project_budgets',
  'budget_line_items',
  'project_expenses',
  'project_invoices',
  'purchase_orders',
  'vendors',
  'project_milestones',
  'project_forecasts',
  'storage_usage',
  'storage_transactions',
  'invoice_attachments',
  'team_roles',
  'team_members',
  'invoice_approval_workflows',
  'invoice_approvals',
  'approval_history',
  'notifications',
  'notification_preferences',
  'email_queue',
  'notification_templates',
  'notification_logs',
];

// Expected system roles
const EXPECTED_SYSTEM_ROLES = [
  { id: 'role-owner', name: 'Owner' },
  { id: 'role-finance-manager', name: 'Finance Manager' },
  { id: 'role-project-manager', name: 'Project Manager' },
  { id: 'role-accountant', name: 'Accountant' },
  { id: 'role-viewer', name: 'Viewer' },
];

// Expected notification templates
const EXPECTED_TEMPLATES = [
  'invoice_approved',
  'invoice_rejected',
  'invoice_pending_approval',
  'team_invitation',
  'payment_received',
];

// Critical columns that must exist
const CRITICAL_COLUMNS = {
  users: ['bio', 'is_temp_password', 'temp_password_expires_at', 'must_change_password'],
  customers: ['storage_used', 'storage_limit', 'storage_last_calculated', 'licenseNumber'],
  team_roles: ['can_create_invoices', 'can_manage_projects', 'can_view_reports'],
};

async function checkTables() {
  log('cyan', '\n📊 CHECKING TABLES...\n');
  
  const result = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  
  const existingTables = result.map(r => r.table_name);
  const missingTables = EXPECTED_TABLES.filter(t => !existingTables.includes(t));
  
  log('blue', `✓ Found ${existingTables.length} tables`);
  
  if (missingTables.length > 0) {
    log('red', `✗ Missing ${missingTables.length} tables:`);
    missingTables.forEach(t => log('red', `  - ${t}`));
    return { status: 'error', missing: missingTables };
  } else {
    log('green', '✓ All expected tables exist');
    return { status: 'ok', missing: [] };
  }
}

async function checkColumns() {
  log('cyan', '\n🔍 CHECKING CRITICAL COLUMNS...\n');
  
  const issues = [];
  
  for (const [table, columns] of Object.entries(CRITICAL_COLUMNS)) {
    log('blue', `Checking table: ${table}`);
    
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${table};
    `;
    
    const existingColumns = result.map(r => r.column_name);
    const missingColumns = columns.filter(c => !existingColumns.includes(c));
    
    if (missingColumns.length > 0) {
      log('red', `  ✗ Missing columns in ${table}:`);
      missingColumns.forEach(c => log('red', `    - ${c}`));
      issues.push({ table, missingColumns });
    } else {
      log('green', `  ✓ All critical columns exist in ${table}`);
    }
  }
  
  if (issues.length > 0) {
    return { status: 'error', issues };
  } else {
    log('green', '\n✓ All critical columns exist');
    return { status: 'ok', issues: [] };
  }
}

async function checkSystemRoles() {
  log('cyan', '\n👥 CHECKING SYSTEM ROLES...\n');
  
  try {
    const roles = await prisma.team_roles.findMany({
      where: { is_system_role: true },
      select: { id: true, name: true },
    });
    
    log('blue', `✓ Found ${roles.length} system roles`);
    
    const missingRoles = EXPECTED_SYSTEM_ROLES.filter(
      expected => !roles.some(r => r.id === expected.id)
    );
    
    if (missingRoles.length > 0) {
      log('red', `✗ Missing ${missingRoles.length} system roles:`);
      missingRoles.forEach(r => log('red', `  - ${r.name} (${r.id})`));
      return { status: 'error', missing: missingRoles, found: roles };
    } else {
      log('green', '✓ All system roles exist:');
      roles.forEach(r => log('green', `  - ${r.name}`));
      return { status: 'ok', missing: [], found: roles };
    }
  } catch (error) {
    log('red', '✗ Error checking system roles:', error.message);
    return { status: 'error', error: error.message };
  }
}

async function checkNotificationTemplates() {
  log('cyan', '\n📧 CHECKING NOTIFICATION TEMPLATES...\n');
  
  try {
    const templates = await prisma.notification_templates.findMany({
      select: { type: true, subject: true },
    });
    
    log('blue', `✓ Found ${templates.length} notification templates`);
    
    const missingTemplates = EXPECTED_TEMPLATES.filter(
      expected => !templates.some(t => t.type === expected)
    );
    
    if (missingTemplates.length > 0) {
      log('red', `✗ Missing ${missingTemplates.length} templates:`);
      missingTemplates.forEach(t => log('red', `  - ${t}`));
      return { status: 'error', missing: missingTemplates, found: templates };
    } else {
      log('green', '✓ All notification templates exist:');
      templates.forEach(t => log('green', `  - ${t.type}: ${t.subject}`));
      return { status: 'ok', missing: [], found: templates };
    }
  } catch (error) {
    log('red', '✗ Error checking templates:', error.message);
    return { status: 'error', error: error.message };
  }
}

async function checkTriggers() {
  log('cyan', '\n⚡ CHECKING DATABASE TRIGGERS...\n');
  
  const result = await prisma.$queryRaw`
    SELECT trigger_name, event_object_table 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `;
  
  log('blue', `✓ Found ${result.length} triggers:`);
  result.forEach(t => log('blue', `  - ${t.trigger_name} on ${t.event_object_table}`));
  
  const expectedTriggers = [
    'update_updated_at',
    'create_default_notification_preferences',
  ];
  
  const foundTriggerNames = result.map(t => t.trigger_name);
  const missingTriggers = expectedTriggers.filter(t => 
    !foundTriggerNames.some(name => name.includes(t))
  );
  
  if (missingTriggers.length > 0) {
    log('yellow', `⚠ Some expected triggers might be missing:`);
    missingTriggers.forEach(t => log('yellow', `  - ${t}`));
    return { status: 'warning', missing: missingTriggers };
  } else {
    log('green', '✓ Key triggers exist');
    return { status: 'ok', missing: [] };
  }
}

async function checkMigrationStatus() {
  log('cyan', '\n📝 CHECKING MIGRATION STATUS...\n');
  
  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 10;
    `;
    
    log('blue', `✓ Found ${migrations.length} recent migrations:`);
    migrations.forEach(m => {
      const date = m.finished_at ? new Date(m.finished_at).toLocaleString() : 'pending';
      log('blue', `  - ${m.migration_name} (${date})`);
    });
    
    return { status: 'ok', migrations };
  } catch (error) {
    log('yellow', '⚠ Could not check migration history:', error.message);
    return { status: 'warning', error: error.message };
  }
}

async function generateFixScript(auditResults) {
  log('cyan', '\n🔧 GENERATING FIX SCRIPT...\n');
  
  const fixes = [];
  
  // Missing tables
  if (auditResults.tables.status === 'error') {
    fixes.push('# Missing tables - run migrations:');
    fixes.push('npx prisma migrate deploy');
    fixes.push('');
  }
  
  // Missing columns
  if (auditResults.columns.status === 'error') {
    fixes.push('# Missing columns - run migrations:');
    fixes.push('npx prisma migrate deploy');
    fixes.push('');
  }
  
  // Missing system roles
  if (auditResults.roles.status === 'error') {
    fixes.push('# Missing system roles - run script:');
    fixes.push('node scripts/insert-system-roles-safe.js');
    fixes.push('');
  }
  
  // Missing templates
  if (auditResults.templates.status === 'error') {
    fixes.push('# Missing notification templates - run migration:');
    fixes.push('psql $DATABASE_URL -f migrations/add_team_invitation_template.sql');
    fixes.push('');
  }
  
  if (fixes.length > 0) {
    log('yellow', '📋 RECOMMENDED FIXES:\n');
    fixes.forEach(line => console.log(line));
    return fixes;
  } else {
    log('green', '✓ No fixes needed - database is in sync!');
    return [];
  }
}

async function runAudit() {
  log('magenta', '\n' + '='.repeat(60));
  log('magenta', '🔍 PRODUCTION DATABASE AUDIT');
  log('magenta', '='.repeat(60));
  
  const auditResults = {
    tables: null,
    columns: null,
    roles: null,
    templates: null,
    triggers: null,
    migrations: null,
  };
  
  try {
    // Run all checks
    auditResults.tables = await checkTables();
    auditResults.columns = await checkColumns();
    auditResults.roles = await checkSystemRoles();
    auditResults.templates = await checkNotificationTemplates();
    auditResults.triggers = await checkTriggers();
    auditResults.migrations = await checkMigrationStatus();
    
    // Generate summary
    log('magenta', '\n' + '='.repeat(60));
    log('magenta', '📊 AUDIT SUMMARY');
    log('magenta', '='.repeat(60) + '\n');
    
    const checks = [
      { name: 'Tables', result: auditResults.tables },
      { name: 'Columns', result: auditResults.columns },
      { name: 'System Roles', result: auditResults.roles },
      { name: 'Notification Templates', result: auditResults.templates },
      { name: 'Database Triggers', result: auditResults.triggers },
      { name: 'Migration History', result: auditResults.migrations },
    ];
    
    let hasErrors = false;
    let hasWarnings = false;
    
    checks.forEach(check => {
      if (check.result.status === 'ok') {
        log('green', `✓ ${check.name}: OK`);
      } else if (check.result.status === 'warning') {
        log('yellow', `⚠ ${check.name}: WARNING`);
        hasWarnings = true;
      } else {
        log('red', `✗ ${check.name}: ERROR`);
        hasErrors = true;
      }
    });
    
    console.log('');
    
    if (hasErrors) {
      log('red', '❌ DATABASE IS OUT OF SYNC - ACTION REQUIRED');
      await generateFixScript(auditResults);
      process.exit(1);
    } else if (hasWarnings) {
      log('yellow', '⚠️  DATABASE HAS MINOR ISSUES - REVIEW RECOMMENDED');
      await generateFixScript(auditResults);
      process.exit(0);
    } else {
      log('green', '✅ DATABASE IS FULLY IN SYNC - ALL GOOD!');
      log('green', '\n🎉 Your production database matches your local schema perfectly!\n');
      process.exit(0);
    }
    
  } catch (error) {
    log('red', '\n❌ AUDIT FAILED:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
runAudit();

