#!/bin/bash

echo "🚀 PropertyHub Backend Setup Script"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm --version) found"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 14+ first."
    exit 1
fi

echo "✅ PostgreSQL found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found"
    echo "📝 Creating .env from env.example..."
    cp env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please update the .env file with your database credentials"
    echo "   Edit: backend/.env"
    echo "   Update DATABASE_URL with your PostgreSQL connection string"
    echo ""
    read -p "Press Enter after you've updated .env to continue..."
fi

# Generate Prisma Client
echo ""
echo "🔨 Generating Prisma Client..."
npm run prisma:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

echo "✅ Prisma Client generated"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
npm run prisma:migrate

if [ $? -ne 0 ]; then
    echo "❌ Failed to run migrations"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure PostgreSQL is running"
    echo "2. Check your DATABASE_URL in .env"
    echo "3. Ensure the database exists: createdb propertyhub"
    exit 1
fi

echo "✅ Migrations completed"

# Seed database
echo ""
echo "🌱 Seeding database with initial data..."
npm run prisma:seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo "✅ Database seeded"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📝 Default Login Credentials:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Super Admin:"
echo "  Email: admin@propertyhub.com"
echo "  Password: admin123"
echo ""
echo "Property Owner:"
echo "  Email: john@metro-properties.com"
echo "  Password: owner123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Start the server with:"
echo "   npm run dev"
echo ""
echo "📊 View database with Prisma Studio:"
echo "   npm run prisma:studio"
echo ""


