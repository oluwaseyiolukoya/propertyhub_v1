#!/bin/bash

# Production Migration Script
# Safely migrates the project_stages tables to production database

set -e  # Exit on error

echo "🚀 Production Migration Script"
echo "================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "📝 Please create .env file with PROD_DB_URL"
    echo ""
    echo "Example:"
    echo "PROD_DB_URL=\"postgresql://contrezz_user:YOUR_PASSWORD@contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060/contrezz?sslmode=require\""
    exit 1
fi

# Load environment variables
export $(cat .env | grep PROD_DB_URL | xargs)

# Check if PROD_DB_URL is set
if [ -z "$PROD_DB_URL" ]; then
    echo "❌ Error: PROD_DB_URL not set in .env file"
    exit 1
fi

# Hide password in output
SAFE_URL=$(echo $PROD_DB_URL | sed 's/:.*@/:****@/')
echo "📍 Target Database: $SAFE_URL"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found"
    echo "📦 Please install PostgreSQL client:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Check if migration file exists
MIGRATION_FILE="../migrations/add_project_stages_system_fixed.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Migration: Add Project Stages System"
echo "📄 File: $MIGRATION_FILE"
echo ""

# Ask for confirmation
read -p "⚠️  This will modify the production database. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🔄 Running migration..."
echo ""

# Run the migration
if psql "$PROD_DB_URL" < "$MIGRATION_FILE"; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🔍 Verifying tables..."
    psql "$PROD_DB_URL" -c "\dt project_*"
    echo ""
    echo "✅ All done! You can now create projects in production."
else
    echo ""
    echo "❌ Migration failed. Check the error messages above."
    exit 1
fi



