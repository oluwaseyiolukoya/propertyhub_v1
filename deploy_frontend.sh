#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 DEPLOY FRONTEND TO DIGITAL OCEAN + CONFIGURE DOMAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOY FRONTEND + CONFIGURE DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /Users/oluwaseyio/test_ui_figma_and_cursor/terraform/digitalocean

echo "📋 Applying Terraform changes..."
echo ""

terraform apply \
  -var="domain_name=contrezz.com" \
  -auto-approve

if [ $? -eq 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ FRONTEND DEPLOYED SUCCESSFULLY!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📋 NEXT: CONFIGURE DNS"
  echo ""
  echo "Add these DNS records to your domain (contrezz.com):"
  echo ""
  echo "1. Frontend (Root domain):"
  echo "   Type: CNAME"
  echo "   Name: @"
  echo "   Value: [Will be shown in Digital Ocean dashboard]"
  echo ""
  echo "2. Backend API:"
  echo "   Type: CNAME"
  echo "   Name: api"
  echo "   Value: [Will be shown in Digital Ocean dashboard]"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🌐 Get DNS values from:"
  echo "   https://cloud.digitalocean.com/apps"
  echo ""
  echo "   Click your app → Settings → Domains"
  echo ""
else
  echo ""
  echo "❌ Deployment failed!"
  exit 1
fi

