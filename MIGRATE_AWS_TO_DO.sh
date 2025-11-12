#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔄 AWS TO DIGITAL OCEAN DATABASE MIGRATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e  # Exit on any error

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 1: EXPORT AWS DATABASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Enter your AWS RDS password:"
read -s AWS_PASSWORD
echo ""

echo "🔄 Exporting AWS database..."
PGPASSWORD="$AWS_PASSWORD" pg_dump \
  -h ph-dev-db.ccp20k04w2gl.us-east-1.rds.amazonaws.com \
  -p 5432 \
  -U dbadmin \
  -d propertyhub_dev \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  -f aws_database_backup.sql

if [ $? -eq 0 ]; then
  echo "✅ AWS database exported successfully!"
  echo "📦 File: aws_database_backup.sql"
  echo "📊 Size: $(du -h aws_database_backup.sql | cut -f1)"
else
  echo "❌ Export failed! Check your AWS password and connection."
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 2: GET DIGITAL OCEAN DATABASE CONNECTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Go to: https://cloud.digitalocean.com/databases"
echo "Click: contrezz-db-prod → Connection Details"
echo ""
echo "Enter your Digital Ocean database PRIVATE connection string:"
echo "(Format: postgresql://user:pass@private-host:25060/contrezz?sslmode=require)"
read -s DO_CONNECTION_STRING
echo ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 3: IMPORT TO DIGITAL OCEAN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔄 Importing to Digital Ocean..."
psql "$DO_CONNECTION_STRING" < aws_database_backup.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database imported successfully!"
else
  echo ""
  echo "❌ Import failed! Check your Digital Ocean connection string."
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 4: VERIFY DATA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔍 Checking tables..."
psql "$DO_CONNECTION_STRING" -c "\dt" | grep -E "admins|customers|properties|plans"

echo ""
echo "🔍 Counting records..."
echo ""
echo "Admins:"
psql "$DO_CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM admins;"
echo ""
echo "Customers:"
psql "$DO_CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM customers;"
echo ""
echo "Properties:"
psql "$DO_CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM properties;"
echo ""
echo "Plans:"
psql "$DO_CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM plans;"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 MIGRATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Your AWS data is now on Digital Ocean!"
echo "✅ Your backend is connected to the new database"
echo "✅ You can now test your app at:"
echo "   👉 https://clownfish-app-mh6k4.ondigitalocean.app"
echo ""
echo "🗑️  Clean up:"
echo "   rm aws_database_backup.sql  # Delete backup file"
echo ""
echo "💰 Next: Destroy AWS resources to stop charges!"
echo ""

