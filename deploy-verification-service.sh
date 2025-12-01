#!/bin/bash

# Verification Service Deployment Helper Script
# This script helps prepare and deploy the verification service to DigitalOcean

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Verification Service Deployment Helper"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI not found. Please install it first:"
    echo "   brew install doctl"
    echo "   doctl auth init"
    exit 1
fi

echo "✅ doctl CLI found"
echo ""

# Function to generate secure random key
generate_key() {
    openssl rand -hex 32
}

# Function to generate API key
generate_api_key() {
    echo "vkey_$(openssl rand -hex 24)"
}

echo "📋 Step 1: Generate Security Keys"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ENCRYPTION_KEY=$(generate_key)
API_KEY=$(generate_api_key)

echo "Generated keys (save these securely):"
echo ""
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "API_KEY_MAIN_DASHBOARD=$API_KEY"
echo ""
echo "⚠️  IMPORTANT: Save these keys! You'll need them for deployment."
echo ""
read -p "Press Enter to continue..."

echo ""
echo "📋 Step 2: Create Verification Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Do you want to create a new PostgreSQL database? (y/n): " create_db

if [ "$create_db" = "y" ]; then
    echo "Creating verification database..."

    doctl databases create verification-db-prod \
      --engine pg \
      --version 15 \
      --size db-s-1vcpu-1gb \
      --region nyc3 \
      --num-nodes 1

    echo "✅ Database created!"
    echo ""
    echo "Get connection string with:"
    echo "  doctl databases connection verification-db-prod"
    echo ""
else
    echo "Skipping database creation."
fi

echo ""
echo "📋 Step 3: Create Redis Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Do you want to create a new Redis database? (y/n): " create_redis

if [ "$create_redis" = "y" ]; then
    echo "Creating Redis database..."

    doctl databases create verification-redis-prod \
      --engine redis \
      --version 7 \
      --size db-s-1vcpu-1gb \
      --region nyc3 \
      --num-nodes 1

    echo "✅ Redis created!"
    echo ""
    echo "Get connection string with:"
    echo "  doctl databases connection verification-redis-prod"
    echo ""
else
    echo "Skipping Redis creation."
fi

echo ""
echo "📋 Step 4: Environment Variables Template"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > verification-service-env-vars.txt << EOF
# Verification Service Environment Variables
# Copy these to DigitalOcean App Platform

NODE_ENV=production
PORT=8080

# Database (get from: doctl databases connection verification-db-prod)
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis (get from: doctl databases connection verification-redis-prod)
REDIS_URL=redis://user:pass@host:port

# DigitalOcean Spaces (use existing credentials)
SPACES_ACCESS_KEY_ID=<your-spaces-key>
SPACES_SECRET_ACCESS_KEY=<your-spaces-secret>
SPACES_REGION=nyc3
SPACES_BUCKET=contrezz-uploads
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Dojah API (get from Dojah dashboard)
DOJAH_API_KEY=<your-dojah-key>
DOJAH_APP_ID=<your-dojah-app-id>

# Security (generated above)
ENCRYPTION_KEY=$ENCRYPTION_KEY
API_KEY_MAIN_DASHBOARD=$API_KEY

# Main Dashboard (update with your backend URL)
MAIN_DASHBOARD_URL=https://your-backend.ondigitalocean.app
EOF

echo "✅ Environment variables template created: verification-service-env-vars.txt"
echo ""

echo ""
echo "📋 Step 5: Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to DigitalOcean App Platform:"
echo "   https://cloud.digitalocean.com/apps"
echo ""
echo "2. Create New App → GitHub → Select Repository:"
echo "   - Repository: oluwaseyiolukoya/propertyhub_v1"
echo "   - Branch: main"
echo "   - Source Directory: /verification-service"
echo ""
echo "3. Configure Service:"
echo "   - Name: verification-service"
echo "   - Type: Web Service"
echo "   - Instance Size: Basic (512 MB RAM) - \$12/month"
echo "   - Build Command: npm ci && npx prisma generate && npm run build"
echo "   - Run Command: npm run start"
echo "   - HTTP Port: 8080"
echo "   - Health Check: /health"
echo ""
echo "4. Add Environment Variables from: verification-service-env-vars.txt"
echo ""
echo "5. Create App and wait for deployment"
echo ""
echo "6. Run migrations:"
echo "   - Connect to verification database"
echo "   - Run: npx prisma migrate deploy"
echo "   - Run: npx prisma db seed"
echo ""
echo "7. Update main backend with:"
echo "   VERIFICATION_SERVICE_URL=https://verification-service-xxxxx.ondigitalocean.app"
echo "   VERIFICATION_API_KEY=$API_KEY"
echo ""
echo "8. Test deployment:"
echo "   curl https://verification-service-xxxxx.ondigitalocean.app/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Preparation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 For detailed instructions, see:"
echo "   VERIFICATION_SERVICE_DEPLOYMENT_GUIDE.md"
echo ""

