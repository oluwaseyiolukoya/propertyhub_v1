#!/bin/bash

# Deploy Tax Calculator Fix to Production
# This script deploys the tax calculator status fix and adds feature to plans

set -e

echo "🚀 Deploying Tax Calculator Fix to Production"
echo "=============================================="
echo ""

# Check if we're on the production server
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  This script should be run ON the production server"
    echo ""
    echo "To deploy:"
    echo "1. SSH into your DigitalOcean server:"
    echo "   ssh root@your-server-ip"
    echo ""
    echo "2. Navigate to your backend directory:"
    echo "   cd /path/to/backend"
    echo ""
    echo "3. Run this script:"
    echo "   bash deploy-tax-calculator-fix.sh"
    exit 1
fi

echo "📥 Step 1/5: Pulling latest code..."
git pull origin main

echo ""
echo "📦 Step 2/5: Installing dependencies..."
npm install

echo ""
echo "🔨 Step 3/5: Generating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️ Step 4/5: Running migrations..."
npx prisma migrate deploy

echo ""
echo "🏗️ Step 5/5: Building application..."
npm run build

echo ""
echo "=============================================="
echo "✅ Code deployed successfully!"
echo ""

# Now add tax_calculator feature to production plans
echo "🔧 Adding tax_calculator feature to production plans..."
echo ""

npx tsx scripts/add-tax-feature-to-all-plans.ts

echo ""
echo "=============================================="
echo "✅ Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Restart your backend service:"
echo "      - PM2: pm2 restart backend"
echo "      - Systemd: sudo systemctl restart backend"
echo "      - Docker: docker-compose restart backend"
echo ""
echo "   2. Verify Tax Calculator is visible:"
echo "      - Log in as a property owner"
echo "      - Check if Tax Calculator appears in menu"
echo ""
echo "   3. Check logs for errors:"
echo "      - PM2: pm2 logs backend"
echo "      - Systemd: sudo journalctl -u backend -f"
echo ""


