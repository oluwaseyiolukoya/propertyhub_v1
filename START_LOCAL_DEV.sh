#!/bin/bash

# 🎯 Local Development Setup Script
# Run this after installing Postgres.app

echo "🚀 Setting up local development environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
echo -e "${BLUE}📦 Checking PostgreSQL installation...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL not found in PATH${NC}"
    echo "Please make sure Postgres.app is running and add it to your PATH:"
    echo ""
    echo "sudo mkdir -p /etc/paths.d &&"
    echo "echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp"
    echo ""
    echo "Then close and reopen your terminal, and run this script again."
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is installed${NC}"
echo ""

# Create local database
echo -e "${BLUE}📊 Creating local database...${NC}"
createdb contrezz_local 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database 'contrezz_local' created${NC}"
else
    echo -e "${YELLOW}⚠️  Database 'contrezz_local' may already exist${NC}"
fi
echo ""

# Navigate to backend
cd backend

# Install dependencies (if needed)
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Run migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
npx prisma migrate dev --name initial_setup
echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

# Seed database
echo -e "${BLUE}🌱 Seeding database with initial data...${NC}"
npm run prisma:seed
echo -e "${GREEN}✅ Database seeded${NC}"
echo ""

# Go back to root
cd ..

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${BLUE}📝 Login Credentials:${NC}"
echo "   Email: admin@contrezz.com"
echo "   Password: admin123"
echo ""
echo -e "${BLUE}🚀 To start development servers:${NC}"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   npm run dev"
echo ""
echo "   Then open: http://localhost:5173"
echo ""

