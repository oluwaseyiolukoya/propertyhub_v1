#!/bin/bash
# Simple Prisma Studio Script (with retry logic)

set -e

ENV="dev"
REGION="us-east-1"
MAX_RETRIES=3

echo "🔐 Getting database credentials from Secrets Manager..."

# Retry logic
for i in $(seq 1 $MAX_RETRIES); do
  echo "   Attempt $i of $MAX_RETRIES..."

  DB_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id ph-${ENV}-app-secrets \
    --region $REGION \
    --query SecretString \
    --output text 2>&1)

  if [ $? -eq 0 ]; then
    break
  fi

  if [ $i -lt $MAX_RETRIES ]; then
    echo "   ⚠️  Failed, retrying in 2 seconds..."
    sleep 2
  else
    echo "❌ Failed to retrieve credentials after $MAX_RETRIES attempts"
    echo ""
    echo "💡 Try the manual method:"
    echo "   1. Get DATABASE_URL:"
    echo "      aws secretsmanager get-secret-value --secret-id ph-dev-app-secrets --region us-east-1 --query SecretString --output text | jq -r '.DATABASE_URL'"
    echo ""
    echo "   2. Run Prisma Studio:"
    echo "      cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend"
    echo "      export DATABASE_URL='<paste-url-here>'"
    echo "      npx prisma studio"
    exit 1
  fi
done

DATABASE_URL=$(echo $DB_SECRET | jq -r '.DATABASE_URL')

if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" == "null" ]; then
  echo "❌ Could not parse DATABASE_URL from Secrets Manager"
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

