#!/bin/bash

echo "🔧 Verification Service Environment Setup"
echo "=========================================="
echo ""

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "✅ Generated ENCRYPTION_KEY: $ENCRYPTION_KEY"

# Generate API key for main dashboard
API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ Generated API_KEY_MAIN_DASHBOARD: $API_KEY"

echo ""
echo "📝 Required Environment Variables:"
echo ""
echo "1. DATABASE_URL - PostgreSQL connection string"
echo "   Example: postgresql://user:password@localhost:5432/verification_db"
echo ""
echo "2. REDIS_URL - Redis connection string"
echo "   Example: redis://localhost:6379"
echo ""
echo "3. DOJAH_API_KEY - Get from https://dojah.io/dashboard"
echo "4. DOJAH_APP_ID - Get from https://dojah.io/dashboard"
echo ""
echo "5. AWS_ACCESS_KEY_ID - AWS S3 credentials"
echo "6. AWS_SECRET_ACCESS_KEY - AWS S3 credentials"
echo "7. AWS_S3_BUCKET - S3 bucket name for document storage"
echo ""
echo "📋 Generated Keys (add these to your .env):"
echo ""
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "API_KEY_MAIN_DASHBOARD=$API_KEY"
echo ""
echo "⚠️  IMPORTANT: Add the same API_KEY to backend/.env as:"
echo "VERIFICATION_API_KEY=$API_KEY"
echo ""
echo "📁 Edit these files:"
echo "  - verification-service/.env"
echo "  - backend/.env"
echo ""
