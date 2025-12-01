#!/bin/bash

# Run Prisma Migrations in Production Container
# This script executes migrations inside the running production pod

set -e

echo "🚀 Running Prisma Migrations in Production"
echo "==========================================="
echo ""

# Get the pod name (adjust if your pod name is different)
POD_NAME="backend-5c8989bd46-wd4lj"

echo "📍 Target Pod: $POD_NAME"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ Error: kubectl not found"
    echo "📦 Please install kubectl or use DigitalOcean's web console"
    echo ""
    echo "Alternative: Run this command manually in your terminal:"
    echo "kubectl exec -it $POD_NAME -- bash -c 'cd /workspace/backend && npx prisma migrate deploy'"
    exit 1
fi

echo "⚠️  This will apply all pending migrations to production database."
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🔍 Checking current migration status..."
echo ""

kubectl exec -it $POD_NAME -- bash -c "cd /workspace/backend && npx prisma migrate status"

echo ""
echo "🔄 Deploying migrations..."
echo ""

kubectl exec -it $POD_NAME -- bash -c "cd /workspace/backend && npx prisma migrate deploy"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations deployed successfully!"
    echo ""
    echo "🔍 Final migration status:"
    kubectl exec -it $POD_NAME -- bash -c "cd /workspace/backend && npx prisma migrate status"
    echo ""
    echo "✅ Production database is now in sync!"
else
    echo ""
    echo "❌ Migration deployment failed"
    exit 1
fi

