#!/bin/bash

# Backend Startup Script
# This script ensures only one backend instance runs at a time

echo "🔍 Checking for existing backend processes..."

# Kill any processes using port 5000
if lsof -ti:5000 > /dev/null 2>&1; then
  echo "⚠️  Found processes on port 5000, killing them..."
  lsof -ti:5000 | xargs kill -9 2>/dev/null
  sleep 1
fi

# Kill any tsx watch processes
if pgrep -f "tsx watch src/index.ts" > /dev/null 2>&1; then
  echo "⚠️  Found tsx watch processes, killing them..."
  pkill -f "tsx watch src/index.ts" 2>/dev/null
  sleep 1
fi

# Verify port is free
if lsof -ti:5000 > /dev/null 2>&1; then
  echo "❌ Port 5000 is still in use. Please manually kill the process:"
  echo "   lsof -ti:5000 | xargs kill -9"
  exit 1
fi

echo "✅ Port 5000 is free"
echo "🚀 Starting backend server..."
echo ""

# Start the backend
npm run dev
