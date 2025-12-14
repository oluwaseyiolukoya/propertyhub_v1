#!/bin/bash

# ========================================
# DigitalOcean Split Architecture Setup
# ========================================
# This script helps you set up the complete
# separated architecture on DigitalOcean

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Contrezz DigitalOcean Setup          ║"
echo "║  Split Architecture Configuration     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl CLI not found${NC}"
    echo "Please install doctl: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if authenticated
if ! doctl auth list &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with DigitalOcean${NC}"
    echo "Please run: doctl auth init"
    exit 1
fi

echo -e "${GREEN}✅ doctl CLI found and authenticated${NC}"
echo ""

# ========================================
# Phase 1: Create Databases
# ========================================

echo -e "${BLUE}📦 Phase 1: Creating Databases${NC}"
echo ""

read -p "Create PUBLIC database? (y/n): " create_public_db
if [ "$create_public_db" == "y" ]; then
    echo "Creating public database..."

    # Get available regions
    echo "Available regions:"
    doctl databases options regions
    echo ""

    read -p "Select region (default: nyc3): " region
    region=${region:-nyc3}

    read -p "Select size (db-s-1vcpu-1gb, db-s-2vcpu-4gb): " db_size
    db_size=${db_size:-db-s-1vcpu-1gb}

    # Create database
    echo "Creating contrezz-public-db..."
    doctl databases create contrezz-public-db \
        --engine pg \
        --version 15 \
        --region $region \
        --size $db_size \
        --num-nodes 1

    echo -e "${GREEN}✅ Public database created${NC}"
    echo ""

    # Get database ID
    PUBLIC_DB_ID=$(doctl databases list --format ID,Name --no-header | grep contrezz-public-db | awk '{print $1}')
    echo "Public Database ID: $PUBLIC_DB_ID"

    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    sleep 30

    # Get connection string
    echo ""
    echo -e "${YELLOW}📋 Public Database Connection Info:${NC}"
    doctl databases connection $PUBLIC_DB_ID --format DSN
    echo ""
    echo "Save this connection string as PUBLIC_DATABASE_URL in your .env file"
    echo ""
fi

read -p "Create APP database? (y/n): " create_app_db
if [ "$create_app_db" == "y" ]; then
    echo "Creating app database..."

    read -p "Select region (default: nyc3): " region
    region=${region:-nyc3}

    read -p "Select size (db-s-1vcpu-2gb, db-s-2vcpu-4gb): " db_size
    db_size=${db_size:-db-s-1vcpu-2gb}

    # Create database
    echo "Creating contrezz-app-db..."
    doctl databases create contrezz-app-db \
        --engine pg \
        --version 15 \
        --region $region \
        --size $db_size \
        --num-nodes 1

    echo -e "${GREEN}✅ App database created${NC}"
    echo ""

    # Get database ID
    APP_DB_ID=$(doctl databases list --format ID,Name --no-header | grep contrezz-app-db | awk '{print $1}')
    echo "App Database ID: $APP_DB_ID"

    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    sleep 30

    # Get connection string
    echo ""
    echo -e "${YELLOW}📋 App Database Connection Info:${NC}"
    doctl databases connection $APP_DB_ID --format DSN
    echo ""
    echo "Save this connection string as DATABASE_URL in your .env file"
    echo ""
fi

# ========================================
# Phase 2: Configure Database Access
# ========================================

echo -e "${BLUE}🔐 Phase 2: Configure Database Access${NC}"
echo ""

read -p "Add your IP to database firewall? (y/n): " add_firewall
if [ "$add_firewall" == "y" ]; then
    # Get current IP
    CURRENT_IP=$(curl -s ifconfig.me)
    echo "Your current IP: $CURRENT_IP"

    if [ ! -z "$PUBLIC_DB_ID" ]; then
        echo "Adding IP to public database firewall..."
        doctl databases firewalls append $PUBLIC_DB_ID --rule ip_addr:$CURRENT_IP
        echo -e "${GREEN}✅ IP added to public database${NC}"
    fi

    if [ ! -z "$APP_DB_ID" ]; then
        echo "Adding IP to app database firewall..."
        doctl databases firewalls append $APP_DB_ID --rule ip_addr:$CURRENT_IP
        echo -e "${GREEN}✅ IP added to app database${NC}"
    fi
fi

# ========================================
# Phase 3: Deploy Apps
# ========================================

echo ""
echo -e "${BLUE}🚀 Phase 3: Deploy Applications${NC}"
echo ""

read -p "Deploy PUBLIC backend? (y/n): " deploy_public
if [ "$deploy_public" == "y" ]; then
    echo "Deploying public backend..."

    # Check if app spec exists
    if [ ! -f "public-backend/.do/app.yaml" ]; then
        echo -e "${RED}❌ public-backend/.do/app.yaml not found${NC}"
        exit 1
    fi

    # Deploy app
    cd public-backend
    doctl apps create --spec .do/app.yaml
    cd ..

    echo -e "${GREEN}✅ Public backend deployment initiated${NC}"
    echo ""
    echo "Check status with: doctl apps list"
    echo ""
fi

read -p "Deploy APP backend? (y/n): " deploy_app
if [ "$deploy_app" == "y" ]; then
    echo "Deploying app backend..."

    # Check if app spec exists
    if [ ! -f "backend/.do/app.yaml" ]; then
        echo -e "${YELLOW}⚠️  backend/.do/app.yaml not found${NC}"
        echo "You'll need to create this or use the DigitalOcean web console"
    else
        cd backend
        doctl apps create --spec .do/app.yaml
        cd ..

        echo -e "${GREEN}✅ App backend deployment initiated${NC}"
    fi
fi

# ========================================
# Phase 4: Configure DNS
# ========================================

echo ""
echo -e "${BLUE}🌐 Phase 4: DNS Configuration${NC}"
echo ""

echo "To complete the setup, configure these DNS records:"
echo ""
echo -e "${YELLOW}Public Site (contrezz.com):${NC}"
echo "  Type: A"
echo "  Host: @"
echo "  Value: <your-public-frontend-ip>"
echo ""
echo "  Type: CNAME"
echo "  Host: api"
echo "  Value: <public-app>.ondigitalocean.app"
echo ""
echo -e "${YELLOW}Application (app.contrezz.com):${NC}"
echo "  Type: A"
echo "  Host: app"
echo "  Value: <your-app-frontend-ip>"
echo ""
echo "  Type: CNAME"
echo "  Host: api.app"
echo "  Value: <app-backend>.ondigitalocean.app"
echo ""

# ========================================
# Summary
# ========================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete!                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "1. Save database connection strings to .env files"
echo "2. Run migrations on both databases"
echo "3. Configure DNS records"
echo "4. Add custom domains in DigitalOcean"
echo "5. Test APIs"
echo ""
echo "Useful commands:"
echo "  doctl databases list                    # List databases"
echo "  doctl apps list                         # List apps"
echo "  doctl apps logs <app-id> --follow      # View logs"
echo "  doctl databases connection <db-id>      # Get connection info"
echo ""
echo "Documentation: see DIGITALOCEAN_FULL_SEPARATION_GUIDE.md"
echo ""
