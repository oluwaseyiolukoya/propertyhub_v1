#!/bin/bash

# Destroy AWS Infrastructure
# ⚠️  DANGER: This will permanently delete all AWS resources
# Only run this after successful migration to Digital Ocean

set -e

echo "⚠️  AWS INFRASTRUCTURE DESTRUCTION"
echo "=================================="
echo ""
echo "This script will PERMANENTLY DELETE all AWS resources:"
echo "  • ECS Fargate services"
echo "  • RDS PostgreSQL database"
echo "  • Application Load Balancer"
echo "  • NAT Gateway"
echo "  • VPC and networking"
echo "  • S3 buckets"
echo "  • CloudFront distribution"
echo "  • All associated resources"
echo ""
echo "⚠️  THIS CANNOT BE UNDONE!"
echo ""

# Safety checks
echo "🔒 Safety Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Digital Ocean is working
echo "1. Verify Digital Ocean is working:"
read -p "   Is your application running successfully on Digital Ocean? (yes/no): " DO_WORKING
if [ "$DO_WORKING" != "yes" ]; then
    echo ""
    echo "❌ Please ensure Digital Ocean is working before destroying AWS"
    exit 1
fi

echo ""
echo "2. Verify data migration:"
read -p "   Have you verified all data was migrated successfully? (yes/no): " DATA_MIGRATED
if [ "$DATA_MIGRATED" != "yes" ]; then
    echo ""
    echo "❌ Please verify data migration before destroying AWS"
    exit 1
fi

echo ""
echo "3. Verify backup exists:"
read -p "   Do you have a recent database backup? (yes/no): " BACKUP_EXISTS
if [ "$BACKUP_EXISTS" != "yes" ]; then
    echo ""
    echo "❌ Please create a backup before destroying AWS"
    echo "   Run: ./scripts/backup-aws-database.sh"
    exit 1
fi

echo ""
echo "4. Verify testing period:"
read -p "   Have you tested Digital Ocean for at least 7 days? (yes/no): " TESTED
if [ "$TESTED" != "yes" ]; then
    echo ""
    echo "⚠️  It's recommended to test for at least 7 days before destroying AWS"
    read -p "   Do you want to proceed anyway? (yes/no): " PROCEED_ANYWAY
    if [ "$PROCEED_ANYWAY" != "yes" ]; then
        echo ""
        echo "❌ Destruction cancelled"
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  FINAL WARNING"
echo ""
echo "You are about to PERMANENTLY DELETE all AWS resources."
echo "This will:"
echo "  • Stop all running services"
echo "  • Delete all databases (if backups not enabled)"
echo "  • Remove all networking infrastructure"
echo "  • Delete all storage"
echo ""
echo "Type 'DESTROY AWS' to confirm:"
read -p "> " FINAL_CONFIRM

if [ "$FINAL_CONFIRM" != "DESTROY AWS" ]; then
    echo ""
    echo "❌ Destruction cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting AWS destruction..."
echo ""

# Navigate to AWS terraform directory
cd "$(dirname "$0")/../terraform/aws"

# Check if terraform state exists
if [ ! -f "terraform.tfstate" ]; then
    echo "⚠️  No terraform.tfstate found"
    echo "   AWS resources may have been manually created or already destroyed"
    read -p "   Continue with manual cleanup? (yes/no): " MANUAL_CLEANUP
    if [ "$MANUAL_CLEANUP" != "yes" ]; then
        exit 1
    fi
    echo ""
    echo "Please manually check and delete these resources in AWS Console:"
    echo "  1. ECS Services and Clusters"
    echo "  2. RDS Databases"
    echo "  3. Load Balancers"
    echo "  4. NAT Gateways"
    echo "  5. VPCs"
    echo "  6. S3 Buckets"
    echo "  7. CloudFront Distributions"
    echo "  8. ECR Repositories"
    echo "  9. Secrets Manager secrets"
    echo " 10. CloudWatch Log Groups"
    exit 0
fi

# Initialize terraform (in case not initialized)
echo "1️⃣  Initializing Terraform..."
terraform init

echo ""
echo "2️⃣  Creating destruction plan..."
terraform plan -destroy -out=destroy.tfplan

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Review the destruction plan above"
echo ""
read -p "Proceed with destruction? (yes/no): " PROCEED

if [ "$PROCEED" != "yes" ]; then
    echo ""
    echo "❌ Destruction cancelled"
    rm -f destroy.tfplan
    exit 0
fi

echo ""
echo "3️⃣  Destroying AWS infrastructure..."
echo "    This may take 10-15 minutes..."
echo ""

terraform apply destroy.tfplan

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ AWS infrastructure destroyed"
echo ""

# Clean up terraform state
read -p "Remove local terraform state files? (yes/no): " CLEAN_STATE
if [ "$CLEAN_STATE" = "yes" ]; then
    rm -f terraform.tfstate*
    rm -f destroy.tfplan
    echo "✅ Local state files removed"
fi

echo ""
echo "🎯 Post-Destruction Checklist:"
echo ""
echo "1. Verify in AWS Console that all resources are deleted:"
echo "   https://console.aws.amazon.com/"
echo ""
echo "2. Check for any remaining resources:"
echo "   • EC2 Dashboard → Running Instances"
echo "   • RDS Dashboard → Databases"
echo "   • VPC Dashboard → NAT Gateways"
echo "   • S3 Dashboard → Buckets"
echo "   • CloudWatch → Log Groups"
echo ""
echo "3. Check AWS billing:"
echo "   https://console.aws.amazon.com/billing/"
echo "   • Should see costs dropping to near \$0"
echo "   • May take 24-48 hours to reflect"
echo ""
echo "4. Optional: Close AWS account"
echo "   https://console.aws.amazon.com/billing/home#/account"
echo "   • Only if you don't plan to use AWS again"
echo ""
echo "5. Update documentation:"
echo "   • Remove AWS references"
echo "   • Update deployment docs to Digital Ocean"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Migration to Digital Ocean Complete!"
echo ""
echo "Monthly Cost Savings:"
echo "  AWS:           ~\$98/month"
echo "  Digital Ocean: ~\$32/month"
echo "  Savings:       ~\$66/month (67%)"
echo ""
echo "Annual Savings: ~\$792/year"
echo ""

