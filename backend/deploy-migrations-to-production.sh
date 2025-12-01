#!/bin/bash

# Deploy Prisma Migrations to Production
# This script safely deploys all pending migrations to production database

set -e  # Exit on error

echo "🚀 Deploy Migrations to Production"
echo "===================================="
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Load PROD_DB_URL
export $(cat .env | grep PROD_DB_URL | xargs)

# Check if PROD_DB_URL is set
if [ -z "$PROD_DB_URL" ]; then
    echo "❌ Error: PROD_DB_URL not set in .env file"
    echo ""
    echo "📝 Please add to backend/.env:"
    echo "PROD_DB_URL=\"postgresql://user:password@host:port/database?sslmode=require\""
    exit 1
fi

# Hide password in output
SAFE_URL=$(echo $PROD_DB_URL | sed 's/:.*@/:****@/')
echo "📍 Target Database: $SAFE_URL"
echo ""

# Check current migration status
echo "🔍 Checking current migration status..."
echo ""
DATABASE_URL="$PROD_DB_URL" npx prisma migrate status

echo ""
echo "⚠️  This will apply ALL pending migrations to production."
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🔄 Deploying migrations..."
echo ""

# Deploy migrations
DATABASE_URL="$PROD_DB_URL" npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations deployed successfully!"
    echo ""
    echo "🔍 Final migration status:"
    DATABASE_URL="$PROD_DB_URL" npx prisma migrate status
    echo ""
    echo "✅ Production database is now in sync!"
else
    echo ""
    echo "❌ Migration deployment failed"
    exit 1
fi

