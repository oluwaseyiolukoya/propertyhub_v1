#!/bin/bash

# Contrezz Development Server Startup Script
# This script starts both backend and frontend servers

set -e

echo "🚀 Starting Contrezz Development Servers..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is accessible
echo "📊 Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    if psql -U postgres -c '\q' 2>/dev/null || psql -U $(whoami) -c '\q' 2>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL is installed but may not be running${NC}"
        echo -e "${BLUE}ℹ️  Try: pg_ctl -D /usr/local/var/postgres start${NC}"
    fi
else
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo ""
    echo -e "${YELLOW}Please install PostgreSQL first:${NC}"
    echo ""
    echo "Option 1 - Using Homebrew (recommended):"
    echo "  brew install postgresql@14"
    echo "  brew services start postgresql@14"
    echo ""
    echo "Option 2 - Using Postgres.app:"
    echo "  Download from: https://postgresapp.com/"
    echo ""
    echo "Option 3 - Official installer:"
    echo "  Download from: https://www.postgresql.org/download/macosx/"
    echo ""
    echo "After installing, run this script again."
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd backend
    npm install
    cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    npm install
fi

# Generate Prisma Client if needed
echo "🔧 Checking Prisma Client..."
cd backend
if [ ! -d "node_modules/.prisma" ]; then
    echo -e "${YELLOW}⚠️  Prisma Client not generated. Generating...${NC}"
    npx prisma generate
fi
cd ..

echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Starting servers..."
echo ""
echo -e "${YELLOW}📝 Backend will run on: http://localhost:5000${NC}"
echo -e "${YELLOW}📝 Frontend will run on: http://localhost:5173${NC}"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend started successfully
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend started successfully on port 5000${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check the logs above.${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Database connection failed - check PostgreSQL is running"
    echo "  2. Port 5000 already in use - kill the process: lsof -ti:5000 | xargs kill -9"
    echo "  3. Missing .env file - check backend/.env.local exists"
    echo ""
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo ""
echo "Starting frontend..."
npm run dev

# Wait for background jobs
wait
