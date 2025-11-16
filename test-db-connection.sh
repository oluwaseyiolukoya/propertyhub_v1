#!/bin/bash

# Test database connection before syncing

set -e

echo "🔍 Testing Production Database Connection"
echo "=========================================="
echo ""

if [ -z "$PROD_DB_URL" ]; then
  echo "❌ Error: PROD_DB_URL not set"
  echo ""
  echo "Run: export PROD_DB_URL='your-database-url'"
  exit 1
fi

echo "Testing connection..."
echo ""

if psql "$PROD_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✅ Connection successful!"
  echo ""
  echo "Database info:"
  psql "$PROD_DB_URL" -t -c "
    SELECT
      'Tables: ' || COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = 'public';
  "
  echo ""
  echo "✅ Ready to sync! Run: ./sync-production-to-local.sh"
else
  echo "❌ Connection failed"
  echo ""
  echo "Possible issues:"
  echo "  1. IP not yet whitelisted (wait 30-60 seconds)"
  echo "  2. Wrong DATABASE_URL"
  echo "  3. Network issues"
  echo ""
  echo "Try again in 30 seconds..."
fi

