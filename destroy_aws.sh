#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🗑️  DESTROY AWS RESOURCES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  DESTROY AWS RESOURCES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will PERMANENTLY DELETE all AWS resources:"
echo "  • ECS Cluster"
echo "  • RDS Database"
echo "  • Load Balancer"
echo "  • VPC and Networking"
echo "  • All associated resources"
echo ""
echo "💰 This will STOP all AWS charges (~$93/month)"
echo ""
read -p "Are you sure you want to destroy AWS resources? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled. AWS resources not destroyed."
  exit 0
fi

echo ""
echo "🗑️  Destroying AWS resources..."
echo ""

cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/terraform

terraform destroy -auto-approve

if [ $? -eq 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ AWS RESOURCES DESTROYED SUCCESSFULLY!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "💰 You will no longer be charged for AWS resources!"
  echo ""
  echo "📊 Cost Savings:"
  echo "  Before: ~$93/month (AWS)"
  echo "  After:  ~$27/month (Digital Ocean)"
  echo "  Savings: $66/month ($792/year!)"
  echo ""
else
  echo ""
  echo "❌ Failed to destroy AWS resources!"
  echo ""
  echo "You may need to:"
  echo "1. Check AWS console for any remaining resources"
  echo "2. Manually delete resources if needed"
  echo "3. Contact AWS support if issues persist"
  echo ""
  exit 1
fi

