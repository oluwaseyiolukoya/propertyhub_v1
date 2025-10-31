#!/bin/bash

# Pre-Deployment Validation Script
# Run this before deploying to DigitalOcean to catch common issues

set -e

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                   🔍 PRE-DEPLOYMENT VALIDATION CHECK                         ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking Git Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if git repo
if [ -d .git ]; then
    print_status 0 "Git repository initialized"
else
    print_status 1 "Not a git repository"
fi

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    print_status 0 "No uncommitted changes"
else
    print_warning "You have uncommitted changes. Consider committing before deployment."
fi

# Check if remote exists
if git remote -v | grep -q origin; then
    print_status 0 "Git remote configured"
else
    print_status 1 "No git remote configured (needed for DigitalOcean)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Checking Backend Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check backend package.json
if [ -f backend/package.json ]; then
    print_status 0 "backend/package.json exists"

    # Check for required scripts
    if grep -q '"start"' backend/package.json; then
        print_status 0 "Start script defined"
    else
        print_status 1 "Start script missing in backend/package.json"
    fi

    if grep -q '"build"' backend/package.json; then
        print_status 0 "Build script defined"
    else
        print_status 1 "Build script missing in backend/package.json"
    fi
else
    print_status 1 "backend/package.json not found"
fi

# Check for Prisma schema
if [ -f backend/prisma/schema.prisma ]; then
    print_status 0 "Prisma schema exists"
else
    print_status 1 "backend/prisma/schema.prisma not found"
fi

# Check for backend env example
if [ -f backend/env.example ]; then
    print_status 0 "backend/env.example exists"
else
    print_warning "backend/env.example not found (helpful for documentation)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Checking Frontend Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check root package.json
if [ -f package.json ]; then
    print_status 0 "package.json exists"

    # Check for build script
    if grep -q '"build"' package.json; then
        print_status 0 "Build script defined"
    else
        print_status 1 "Build script missing in package.json"
    fi
else
    print_status 1 "package.json not found"
fi

# Check for vite.config.ts
if [ -f vite.config.ts ]; then
    print_status 0 "vite.config.ts exists"
else
    print_status 1 "vite.config.ts not found"
fi

# Check for index.html
if [ -f index.html ]; then
    print_status 0 "index.html exists"
else
    print_status 1 "index.html not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Checking Security"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check .gitignore
if [ -f .gitignore ]; then
    print_status 0 ".gitignore exists"

    if grep -q ".env" .gitignore; then
        print_status 0 ".env files ignored"
    else
        print_status 1 ".env not in .gitignore (SECURITY RISK!)"
    fi

    if grep -q "node_modules" .gitignore; then
        print_status 0 "node_modules ignored"
    else
        print_warning "node_modules not in .gitignore"
    fi
else
    print_status 1 ".gitignore not found"
fi

# Check for committed .env files
if git ls-files | grep -q "\.env$"; then
    print_status 1 ".env file committed to git (SECURITY RISK!)"
else
    print_status 0 "No .env files committed"
fi

# Check for committed secrets
if git log --all --full-history --source -- "*.env" 2>/dev/null | grep -q "commit"; then
    print_warning ".env files found in git history. Consider using git-filter-repo to remove."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Testing Local Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test backend build
echo "Testing backend build..."
if cd backend && npm install --silent && npm run build > /dev/null 2>&1; then
    print_status 0 "Backend builds successfully"
    cd ..
else
    print_status 1 "Backend build failed"
    cd ..
fi

# Test frontend build
echo "Testing frontend build..."
if npm install --silent && npm run build > /dev/null 2>&1; then
    print_status 0 "Frontend builds successfully"
else
    print_status 1 "Frontend build failed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Checking Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for deployment docs
if [ -f DEPLOYMENT_README.md ]; then
    print_status 0 "DEPLOYMENT_README.md exists"
else
    print_warning "DEPLOYMENT_README.md not found"
fi

if [ -f docs/QUICK_DEPLOY.md ]; then
    print_status 0 "Quick deploy guide exists"
else
    print_warning "docs/QUICK_DEPLOY.md not found"
fi

if [ -f .do/app.yaml ]; then
    print_status 0 "DigitalOcean app.yaml exists"
else
    print_warning ".do/app.yaml not found (optional but helpful)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "You're ready to deploy to DigitalOcean! 🚀"
    echo ""
    echo "Next steps:"
    echo "  1. Read DEPLOYMENT_README.md"
    echo "  2. Follow docs/QUICK_DEPLOY.md for fastest deployment"
    echo "  3. Generate JWT secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    echo ""
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS critical issue(s)${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    echo ""
    exit 1
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $WARNINGS warning(s)${NC}"
    echo "These won't block deployment but should be addressed."
    echo ""
fi

