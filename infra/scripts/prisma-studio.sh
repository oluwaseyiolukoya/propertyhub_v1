#!/bin/bash
# Prisma Studio Access Script
# Opens Prisma Studio connected to the dev database

set -e

ENV="dev"
REGION="us-east-1"

echo "🔐 Getting database credentials from Secrets Manager..."
DB_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id ph-${ENV}-app-secrets \
  --region $REGION \
  --query SecretString \
  --output text)

DATABASE_URL=$(echo $DB_SECRET | jq -r '.DATABASE_URL')

if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" == "null" ]; then
  echo "❌ Could not retrieve DATABASE_URL from Secrets Manager"
  exit 1
fi

echo "✅ Database credentials retrieved"
echo ""
echo "🚀 Starting Prisma Studio..."
echo "   Opening at: http://localhost:5555"
echo ""
echo "⚠️  Keep this terminal window open!"
echo "   Press Ctrl+C to stop Prisma Studio"
echo ""

# Export DATABASE_URL and start Prisma Studio
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
export DATABASE_URL="$DATABASE_URL"
npx prisma studio
