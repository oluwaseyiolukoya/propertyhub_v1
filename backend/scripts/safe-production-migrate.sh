#!/bin/bash

# Safe Production Migration Script
# This script safely migrates the database schema in production
# with automatic backups and verification

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pre_migration_${TIMESTAMP}.sql"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Safe Production Migration Script         ║${NC}"
echo -e "${BLUE}║  Contrezz Property Management              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "${GREEN}➜${NC} $1"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL is not set in .env"
    exit 1
fi

print_step "Environment loaded successfully"
echo ""

# Step 1: Check migration status
print_step "Step 1: Checking current migration status..."
echo ""

npx prisma migrate status || true

echo ""
read -p "$(echo -e ${YELLOW}Continue with migration? This will modify the production database. [y/N]:${NC} )" -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Migration cancelled by user"
    exit 0
fi

# Step 2: Create backup directory
print_step "Step 2: Creating backup directory..."
mkdir -p "$BACKUP_DIR"
print_success "Backup directory ready: $BACKUP_DIR"
echo ""

# Step 3: Backup database
print_step "Step 3: Creating database backup..."
print_warning "This may take a few minutes depending on database size..."

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)(\?.*)?"

if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    
    export PGPASSWORD="$DB_PASS"
    
    # Create SQL backup
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -F p \
        --no-owner \
        --no-acl \
        > "$BACKUP_FILE" 2>&1
    
    unset PGPASSWORD
    
    # Verify backup was created
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        print_success "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        print_error "Backup failed or is empty!"
        exit 1
    fi
else
    print_error "Could not parse DATABASE_URL"
    exit 1
fi

echo ""

# Step 4: Run migrations
print_step "Step 4: Applying migrations to production..."
print_warning "DO NOT interrupt this process!"
echo ""

npx prisma migrate deploy

print_success "Migrations applied successfully!"
echo ""

# Step 5: Verify migration
print_step "Step 5: Verifying migration status..."
npx prisma migrate status

echo ""
print_success "Migration status verified!"
echo ""

# Step 6: Test database connection
print_step "Step 6: Testing database connection..."

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.\$connect();
    console.log('✅ Database connection successful');
    
    // Check if new tables exist
    const tables = await prisma.\$queryRaw\`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'verification_requests',
        'verification_documents',
        'verification_history',
        'provider_logs'
      )
    \`;
    
    console.log('✅ Verification tables found:', tables.length);
    
    await prisma.\$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

test();
"

if [ $? -eq 0 ]; then
    print_success "Database verification passed!"
else
    print_error "Database verification failed!"
    echo ""
    print_warning "Consider rolling back the migration"
    exit 1
fi

echo ""

# Step 7: Generate Prisma Client
print_step "Step 7: Generating Prisma Client..."
npx prisma generate
print_success "Prisma Client generated!"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Migration Completed! 🎉            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
print_success "All migrations applied successfully"
print_success "Backup saved: $BACKUP_FILE"
echo ""
print_warning "Next steps:"
echo "  1. Restart your application (pm2 restart / systemctl restart)"
echo "  2. Test critical features"
echo "  3. Monitor logs for any issues"
echo "  4. Keep the backup for at least 7 days"
echo ""
print_step "If you encounter issues, restore from backup:"
echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
echo ""

