#!/bin/bash

# Digital Ocean Setup Script
# Complete setup for Contrezz on Digital Ocean

set -e

echo "🌊 Digital Ocean Setup for Contrezz"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "🔍 Checking prerequisites..."
echo ""

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl not found${NC}"
    echo ""
    echo "Install Digital Ocean CLI:"
    echo "  macOS:   brew install doctl"
    echo "  Linux:   snap install doctl"
    echo "  Windows: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ doctl installed${NC}"
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform not found${NC}"
    echo ""
    echo "Install Terraform:"
    echo "  macOS:   brew install terraform"
    echo "  Linux:   https://www.terraform.io/downloads"
    echo "  Windows: https://www.terraform.io/downloads"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Terraform installed${NC}"
fi

echo ""

# Check if user is authenticated with Digital Ocean
if ! doctl account get &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with Digital Ocean${NC}"
    echo ""
    echo "Please authenticate:"
    echo "1. Go to: https://cloud.digitalocean.com/account/api/tokens"
    echo "2. Generate a new token with read and write access"
    echo "3. Run: doctl auth init"
    echo ""
    read -p "Press Enter after you've authenticated..."

    if ! doctl account get &> /dev/null; then
        echo -e "${RED}❌ Still not authenticated. Please run 'doctl auth init' first.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Authenticated with Digital Ocean${NC}"
    ACCOUNT_EMAIL=$(doctl account get --format Email --no-header)
    echo "   Account: ${ACCOUNT_EMAIL}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Navigate to terraform directory
cd "$(dirname "$0")/../terraform/digitalocean"

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}⚠️  terraform.tfvars not found${NC}"
    echo ""
    echo "Creating terraform.tfvars from example..."
    cp terraform.tfvars.example terraform.tfvars
    echo ""
    echo -e "${YELLOW}📝 Please edit terraform.tfvars with your values:${NC}"
    echo ""
    echo "Required variables:"
    echo "  - do_token (from Digital Ocean API tokens page)"
    echo "  - jwt_secret"
    echo "  - paystack_secret_key"
    echo "  - paystack_public_key"
    echo ""
    echo "Optional:"
    echo "  - domain_name (if you have a custom domain)"
    echo "  - region (default: nyc3)"
    echo ""
    read -p "Press Enter after you've updated terraform.tfvars..."
fi

echo ""
echo "🚀 Starting Terraform deployment..."
echo ""

# Initialize Terraform
echo "1️⃣  Initializing Terraform..."
terraform init

echo ""
echo "2️⃣  Validating configuration..."
terraform validate

echo ""
echo "3️⃣  Planning infrastructure..."
terraform plan -out=tfplan

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📋 Review the plan above${NC}"
echo ""
echo "This will create:"
echo "  • PostgreSQL database (~\$15/month)"
echo "  • App Platform for backend (~\$12/month)"
echo "  • Spaces bucket for frontend (~\$5/month)"
echo "  • Total: ~\$32/month"
echo ""
read -p "Do you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo "❌ Deployment cancelled"
    rm -f tfplan
    exit 0
fi

echo ""
echo "4️⃣  Applying infrastructure..."
terraform apply tfplan

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Infrastructure created successfully!${NC}"
echo ""

# Get outputs
echo "📊 Infrastructure Details:"
echo ""
terraform output -json > outputs.json

BACKEND_URL=$(terraform output -raw backend_url 2>/dev/null || echo "pending")
SPACES_ENDPOINT=$(terraform output -raw spaces_cdn_endpoint 2>/dev/null || echo "pending")
DB_HOST=$(terraform output -raw database_host 2>/dev/null || echo "pending")

echo "  Backend URL:  ${BACKEND_URL}"
echo "  Frontend URL: ${SPACES_ENDPOINT}"
echo "  Database:     ${DB_HOST}"
echo ""

# Save connection details
cat > ../../.env.digitalocean << EOF
# Digital Ocean Infrastructure Details
# Generated: $(date)

# Backend
BACKEND_URL=${BACKEND_URL}

# Frontend
FRONTEND_URL=${SPACES_ENDPOINT}

# Database (use 'terraform output database_connection_string' for full connection string)
DATABASE_HOST=${DB_HOST}

# Get sensitive values with:
# terraform output database_connection_string
# terraform output database_password
EOF

echo -e "${GREEN}✅ Connection details saved to .env.digitalocean${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. MIGRATE DATABASE:"
echo "   Get connection string:"
echo "     terraform output database_connection_string"
echo ""
echo "   Restore backup:"
echo "     psql \"\$(terraform output -raw database_connection_string)\" < backups/contrezz_aws_backup_*.sql"
echo ""
echo "2. DEPLOY BACKEND:"
echo "   The App Platform will auto-deploy from your GitHub repo"
echo "   Monitor: doctl apps list"
echo ""
echo "3. DEPLOY FRONTEND:"
echo "   cd ../../"
echo "   npm run build"
echo "   doctl spaces upload dist \$(terraform output -raw spaces_bucket_name) --recursive"
echo ""
echo "4. TEST:"
echo "   Backend:  ${BACKEND_URL}/health"
echo "   Frontend: ${SPACES_ENDPOINT}"
echo ""
echo "5. UPDATE DNS (if using custom domain):"
echo "   Point your domain to the URLs above"
echo ""
echo "6. DESTROY AWS (after 7 days of testing):"
echo "   cd ../aws"
echo "   terraform destroy"
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""

