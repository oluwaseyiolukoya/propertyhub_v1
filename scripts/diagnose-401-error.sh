#!/bin/bash

# Diagnostic script for 401 errors on /api/auth/validate-session
# Run this on the production server or locally with production credentials

echo "🔍 Diagnosing 401 Error on /api/auth/validate-session"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if JWT_SECRET is set
echo "1. Checking JWT_SECRET..."
if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ JWT_SECRET is not set${NC}"
else
    echo -e "${GREEN}✅ JWT_SECRET is set (length: ${#JWT_SECRET})${NC}"
fi
echo ""

# Check DATABASE_URL
echo "2. Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL is not set${NC}"
else
    echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
    # Test database connection
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            echo -e "${GREEN}✅ Database connection successful${NC}"
        else
            echo -e "${RED}❌ Database connection failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  psql not available, skipping database test${NC}"
    fi
fi
echo ""

# Check FRONTEND_URL
echo "3. Checking FRONTEND_URL..."
if [ -z "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}⚠️  FRONTEND_URL is not set (CORS might be an issue)${NC}"
else
    echo -e "${GREEN}✅ FRONTEND_URL is set: $FRONTEND_URL${NC}"
fi
echo ""

# Check if backend is running
echo "4. Checking backend health..."
if [ -z "$API_URL" ]; then
    API_URL="https://api.app.contrezz.com"
fi

HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" 2>/dev/null)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend is responding (HTTP $HEALTH_RESPONSE)${NC}"
else
    echo -e "${RED}❌ Backend health check failed (HTTP $HEALTH_RESPONSE)${NC}"
fi
echo ""

# Test CORS
echo "5. Testing CORS configuration..."
CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS "$API_URL/api/auth/validate-session" \
    -H "Origin: https://app.contrezz.com" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: authorization" \
    2>/dev/null)

if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
    echo -e "${GREEN}✅ CORS preflight successful (HTTP $CORS_RESPONSE)${NC}"
else
    echo -e "${RED}❌ CORS preflight failed (HTTP $CORS_RESPONSE)${NC}"
fi
echo ""

# Check recent backend logs for auth errors
echo "6. Checking for recent auth errors in logs..."
if [ -f "/var/log/backend.log" ]; then
    AUTH_ERRORS=$(grep -i "auth.*failed\|401\|invalid.*token" /var/log/backend.log | tail -5)
    if [ -z "$AUTH_ERRORS" ]; then
        echo -e "${GREEN}✅ No recent auth errors found in logs${NC}"
    else
        echo -e "${YELLOW}⚠️  Recent auth errors found:${NC}"
        echo "$AUTH_ERRORS"
    fi
else
    echo -e "${YELLOW}⚠️  Log file not found at /var/log/backend.log${NC}"
    echo "   Check your log location and update this script"
fi
echo ""

# Database session check (if DATABASE_URL and psql available)
if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
    echo "7. Checking session table..."
    SESSION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM sessions WHERE isActive = true;" 2>/dev/null | xargs)
    if [ -n "$SESSION_COUNT" ]; then
        echo -e "${GREEN}✅ Active sessions: $SESSION_COUNT${NC}"

        # Check for expired sessions
        EXPIRED_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM sessions WHERE expiresAt < NOW() AND isActive = true;" 2>/dev/null | xargs)
        if [ "$EXPIRED_COUNT" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  Expired but active sessions: $EXPIRED_COUNT${NC}"
        fi
    else
        echo -e "${RED}❌ Could not query sessions table${NC}"
    fi
    echo ""
fi

# Summary
echo "=================================================="
echo "📋 Summary:"
echo ""
echo "Most common causes of 401 errors:"
echo "1. JWT_SECRET mismatch between token issuer and verifier"
echo "2. Token expired (check JWT exp claim)"
echo "3. Session revoked or expired in database"
echo "4. Token not sent in request (check frontend)"
echo "5. Database connection issues"
echo ""
echo "Next steps:"
echo "1. Check backend logs: tail -f /var/log/backend.log | grep -i auth"
echo "2. Test token manually with curl (see diagnosis guide)"
echo "3. Verify JWT_SECRET matches across environments"
echo "4. Check database sessions table"
echo ""
echo "See docs/PRODUCTION_401_ERROR_DIAGNOSIS.md for detailed solutions"


