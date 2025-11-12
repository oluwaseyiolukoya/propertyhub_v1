#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 FIX DATABASE PERMISSIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX DATABASE PERMISSIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Paste your Digital Ocean PUBLIC connection string for DOADMIN user:"
echo "(Go to Connection Details → User: doadmin → Database: contrezz → Copy connection string)"
read -r ADMIN_URL
echo ""

echo "🔧 Granting permissions to contrezz_user..."
psql "$ADMIN_URL" <<'SQL'
-- Grant usage and create on public schema
GRANT USAGE, CREATE ON SCHEMA public TO contrezz_user;

-- Make contrezz_user the owner of the public schema
ALTER SCHEMA public OWNER TO contrezz_user;

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE contrezz TO contrezz_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO contrezz_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO contrezz_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO contrezz_user;

-- Show current permissions
\dn+ public
SQL

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Permissions fixed successfully!"
  echo ""
  echo "Now run migrations with contrezz_user:"
  echo "  ./run_migrations_local_v3.sh"
  echo ""
else
  echo ""
  echo "❌ Failed to fix permissions!"
  exit 1
fi

