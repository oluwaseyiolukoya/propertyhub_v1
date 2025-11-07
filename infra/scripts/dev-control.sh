#!/bin/bash
# Dev Environment Control Script
# Use this to stop/start dev environment to save costs

set -e

ENV="dev"
REGION="us-east-1"

case "$1" in
  stop)
    echo "🛑 Stopping dev environment..."

    # Stop ECS service
    echo "  → Stopping ECS tasks..."
    aws ecs update-service \
      --cluster ph-${ENV}-cluster \
      --service ph-${ENV}-api \
      --desired-count 0 \
      --region $REGION

    # Stop RDS instance
    echo "  → Stopping RDS database..."
    aws rds stop-db-instance \
      --db-instance-identifier ph-${ENV}-db \
      --region $REGION || echo "  ⚠️  Database might already be stopped"

    echo "✅ Dev environment stopped!"
    echo "💰 Saving ~$1/hour (~$24/day if stopped overnight)"
    ;;

  start)
    echo "🚀 Starting dev environment..."

    # Start RDS instance
    echo "  → Starting RDS database (takes ~5 min)..."
    aws rds start-db-instance \
      --db-instance-identifier ph-${ENV}-db \
      --region $REGION || echo "  ⚠️  Database might already be running"

    # Wait for RDS to be available
    echo "  → Waiting for database..."
    aws rds wait db-instance-available \
      --db-instance-identifier ph-${ENV}-db \
      --region $REGION

    # Start ECS service
    echo "  → Starting ECS tasks..."
    aws ecs update-service \
      --cluster ph-${ENV}-cluster \
      --service ph-${ENV}-api \
      --desired-count 1 \
      --region $REGION

    echo "✅ Dev environment started!"
    echo "🌐 API: https://api.dev.contrezz.com/health"
    echo "🌐 App: https://app.dev.contrezz.com"
    ;;

  status)
    echo "📊 Dev environment status:"
    echo ""

    # ECS status
    echo "ECS Service:"
    aws ecs describe-services \
      --cluster ph-${ENV}-cluster \
      --services ph-${ENV}-api \
      --region $REGION \
      --query 'services[0].[serviceName,status,desiredCount,runningCount]' \
      --output table

    echo ""
    echo "RDS Database:"
    aws rds describe-db-instances \
      --db-instance-identifier ph-${ENV}-db \
      --region $REGION \
      --query 'DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus,DBInstanceClass]' \
      --output table
    ;;

  *)
    echo "Usage: $0 {start|stop|status}"
    echo ""
    echo "Commands:"
    echo "  start  - Start dev environment (ECS + RDS)"
    echo "  stop   - Stop dev environment to save costs"
    echo "  status - Check current status"
    echo ""
    echo "Examples:"
    echo "  ./dev-control.sh stop   # Stop before leaving for the day"
    echo "  ./dev-control.sh start  # Start when you begin coding"
    echo "  ./dev-control.sh status # Check what's running"
    exit 1
    ;;
esac

