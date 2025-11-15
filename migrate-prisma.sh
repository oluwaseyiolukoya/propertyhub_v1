#!/bin/bash

# Prisma Migration Script
# This script will run Prisma migrations

echo "🔄 Starting Prisma migration..."
echo ""

# Change to the backend directory
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found in backend directory"
    echo "Please ensure your DATABASE_URL is configured"
    exit 1
fi

echo "📋 Current Prisma schema status:"
npx prisma migrate status
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Run migrations
echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations applied successfully!"
    echo ""
else
    echo ""
    echo "❌ Migration failed. Trying db push instead..."
    echo ""
    npx prisma db push

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Database schema updated successfully with db push!"
        echo ""
    else
        echo ""
        echo "❌ Database update failed. Please check your DATABASE_URL and database connection."
        echo ""
        exit 1
    fi
fi

# Show final status
echo "📊 Final migration status:"
npx prisma migrate status
echo ""

echo "✅ Prisma migration complete!"

