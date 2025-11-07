#!/bin/bash
# Start Local Development Environment

echo "🏠 Starting Local Development Environment"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo "⚠️  PostgreSQL is not running. Starting it..."
  brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null
  sleep 2
fi

# Check if database exists
if ! psql -lqt | cut -d \| -f 1 | grep -qw contrezz_dev; then
  echo "📊 Creating local database: contrezz_dev"
  createdb contrezz_dev
fi

# Check if .env.local exists
if [ ! -f backend/.env.local ]; then
  echo "⚙️  Creating backend/.env.local"
  cat > backend/.env.local <<EOF
DATABASE_URL="postgresql://localhost:5432/contrezz_dev"
JWT_SECRET="local-dev-secret-key-change-in-production"
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
EOF
fi

# Check if schema is applied
cd backend
if ! npx prisma db execute --stdin <<< "SELECT 1 FROM admins LIMIT 1;" &>/dev/null; then
  echo "🗄️  Applying database schema..."
  npx prisma db push --accept-data-loss

  echo "🌱 Seeding database..."
  npm run prisma:seed || echo "⚠️  Seed failed (may already exist)"
fi
cd ..

echo ""
echo "✅ Local environment ready!"
echo ""
echo "📝 Next steps:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend"
echo "   npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd /Users/oluwaseyio/test_ui_figma_and_cursor"
echo "   npm run dev"
echo ""
echo "   Terminal 3 (Prisma Studio - optional):"
echo "   cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend"
echo "   npx prisma studio"
echo ""
echo "🌐 URLs:"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo "   Prisma:   http://localhost:5555"
echo ""

