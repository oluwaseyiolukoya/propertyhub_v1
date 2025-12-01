#!/bin/bash

# Start Identity Verification Service Locally
# This script helps you start all required services for local testing

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     🚀 Starting Identity Verification Service (Local)         ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check PostgreSQL
if ! pg_isready > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running!"
    echo "   Start it with: brew services start postgresql"
    exit 1
fi
echo "✅ PostgreSQL is running"

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running!"
    echo "   Start it with: redis-server"
    echo ""
    echo "   Opening new terminal for Redis..."
    osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && redis-server"'
    sleep 2
fi
echo "✅ Redis is running"

# Check database
if ! psql -U oluwaseyio -d verification_db -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ verification_db database not found!"
    echo "   Run: createdb -U oluwaseyio verification_db"
    exit 1
fi
echo "✅ Database 'verification_db' exists"

# Check environment variables
if [ ! -f "verification-service/.env" ]; then
    echo "❌ verification-service/.env not found!"
    echo "   Run: cp verification-service/.env.example verification-service/.env"
    exit 1
fi
echo "✅ Environment file exists"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🎯 STARTING SERVICES:"
echo ""

# Start verification service
echo "1️⃣  Starting Verification API (Port 5001)..."
osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'/verification-service\" && npm run dev"'
sleep 2

# Start verification worker
echo "2️⃣  Starting Verification Worker..."
osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'/verification-service\" && npm run worker:dev"'
sleep 2

# Start main backend
echo "3️⃣  Starting Main Backend (Port 5000)..."
osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'/backend\" && npm run dev"'
sleep 2

# Start frontend
echo "4️⃣  Starting Frontend (Port 5173)..."
osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && npm run dev"'
sleep 2

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ ALL SERVICES STARTED!"
echo ""
echo "📊 Service URLs:"
echo "   Frontend:         http://localhost:5173"
echo "   Main Backend:     http://localhost:5000"
echo "   Verification API: http://localhost:5001"
echo "   Health Check:     http://localhost:5001/health"
echo ""
echo "📚 Next Steps:"
echo "   1. Wait 10-15 seconds for all services to start"
echo "   2. Test health endpoint: curl http://localhost:5001/health"
echo "   3. Follow VERIFICATION_SERVICE_TESTING_GUIDE.md for full testing"
echo ""
echo "🛑 To stop all services:"
echo "   Close all terminal windows or press Ctrl+C in each"
echo ""
echo "═══════════════════════════════════════════════════════════════"

