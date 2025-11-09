#!/bin/bash

# Backup AWS RDS Database Before Migration
# This script creates a complete backup of your AWS database

set -e

echo "🔒 AWS Database Backup Script"
echo "=============================="
echo ""

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/contrezz_aws_backup_${TIMESTAMP}.sql"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "📦 Backup will be saved to: ${BACKUP_FILE}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install it first:"
    echo "   brew install awscli"
    exit 1
fi

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump not found. Install PostgreSQL client:"
    echo "   brew install postgresql"
    exit 1
fi

echo "🔍 Fetching RDS instance details..."
echo ""

# Get RDS endpoint from AWS
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --query 'DBInstances[?DBInstanceIdentifier==`contrezz-dev`].Endpoint.Address' \
    --output text 2>/dev/null || echo "")

if [ -z "$RDS_ENDPOINT" ]; then
    echo "⚠️  Could not auto-detect RDS endpoint."
    echo "Please enter your RDS endpoint manually:"
    read -p "RDS Endpoint: " RDS_ENDPOINT
fi

echo "📍 RDS Endpoint: ${RDS_ENDPOINT}"
echo ""

# Get database credentials
read -p "Database name [contrezz]: " DB_NAME
DB_NAME=${DB_NAME:-contrezz}

read -p "Database user [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Database password: " DB_PASSWORD
echo ""
echo ""

# Export database
echo "🚀 Starting database export..."
echo "This may take a few minutes depending on database size..."
echo ""

export PGPASSWORD="${DB_PASSWORD}"

pg_dump \
    -h "${RDS_ENDPOINT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -F p \
    -f "${BACKUP_FILE}" \
    --verbose \
    --no-owner \
    --no-acl

unset PGPASSWORD

# Check if backup was successful
if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo ""
    echo "✅ Backup completed successfully!"
    echo "📊 Backup size: ${BACKUP_SIZE}"
    echo "📁 Location: ${BACKUP_FILE}"
    echo ""

    # Create a compressed version
    echo "🗜️  Creating compressed backup..."
    gzip -c "${BACKUP_FILE}" > "${BACKUP_FILE}.gz"
    COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "✅ Compressed backup: ${BACKUP_FILE}.gz (${COMPRESSED_SIZE})"
    echo ""

    # Create metadata file
    cat > "${BACKUP_DIR}/backup_metadata_${TIMESTAMP}.txt" << EOF
Contrezz AWS Database Backup
=============================

Backup Date: $(date)
Source: AWS RDS
Endpoint: ${RDS_ENDPOINT}
Database: ${DB_NAME}
User: ${DB_USER}

Files:
- SQL Dump: $(basename ${BACKUP_FILE}) (${BACKUP_SIZE})
- Compressed: $(basename ${BACKUP_FILE}.gz) (${COMPRESSED_SIZE})

Restore Instructions:
--------------------
1. Digital Ocean:
   psql "\${DO_DATABASE_URL}" < ${BACKUP_FILE}

2. Local:
   psql -U postgres -d contrezz < ${BACKUP_FILE}

3. From compressed:
   gunzip -c ${BACKUP_FILE}.gz | psql "\${DATABASE_URL}"

Notes:
------
- Keep this backup safe until migration is verified
- Test restore on Digital Ocean before destroying AWS
- Backup includes schema and data
EOF

    echo "📝 Metadata saved: ${BACKUP_DIR}/backup_metadata_${TIMESTAMP}.txt"
    echo ""
    echo "🎉 Backup process complete!"
    echo ""
    echo "Next steps:"
    echo "1. Verify backup file is not empty"
    echo "2. Keep backup safe until migration is complete"
    echo "3. Test restore on Digital Ocean"
    echo "4. Only destroy AWS after successful migration"

else
    echo "❌ Backup failed! Please check the error messages above."
    exit 1
fi

