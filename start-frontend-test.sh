#!/bin/bash

# Script to start both public backend and frontend for testing

echo "🚀 Starting Public Backend and Frontend for Testing..."
echo ""

# Check if public backend is running
if ! lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "📦 Starting Public Backend on port 5001..."
  cd public-backend
  npm run dev &
  PUBLIC_BACKEND_PID=$!
  echo "✅ Public Backend started (PID: $PUBLIC_BACKEND_PID)"
  sleep 3
else
  echo "✅ Public Backend already running on port 5001"
fi

# Check if frontend is running
if ! lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "🎨 Starting Frontend on port 5173..."
  cd ..
  npm run dev &
  FRONTEND_PID=$!
  echo "✅ Frontend started (PID: $FRONTEND_PID)"
  echo ""
  echo "🌐 Frontend: http://localhost:5173"
  echo "🔌 Public API: http://localhost:5001"
  echo ""
  echo "Press Ctrl+C to stop both servers"

  # Wait for user interrupt
  trap "kill $PUBLIC_BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
  wait
else
  echo "✅ Frontend already running on port 5173"
  echo ""
  echo "🌐 Frontend: http://localhost:5173"
  echo "🔌 Public API: http://localhost:5001"
fi
