#!/bin/bash

echo "🔧 Fixing Database Configuration"
echo "================================="
echo ""

# Backup current .env.local
echo "1️⃣  Backing up current .env.local..."
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
cp .env.local .env.local.backup
echo "✅ Backup created: backend/.env.local.backup"

# Update DATABASE_URL
echo ""
echo "2️⃣  Updating DATABASE_URL..."
sed -i '' 's|DATABASE_URL="postgresql://localhost:5432/contrezz_dev"|DATABASE_URL="postgresql://oluwaseyio@localhost:5432/contrezz?schema=public"|g' .env.local

echo "✅ Updated DATABASE_URL to use 'contrezz' database"

# Show the change
echo ""
echo "3️⃣  New configuration:"
grep "^DATABASE_URL" .env.local

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuration fixed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Now restart the backend:"
echo "  1. Stop current backend (Ctrl+C)"
echo "  2. cd backend"
echo "  3. npm run dev"
echo ""
echo "After restart, admin should see all 7 customers!"

