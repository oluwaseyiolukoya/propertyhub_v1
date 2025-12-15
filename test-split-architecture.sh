#!/bin/bash

# Test Script for Split Architecture
# Tests both public and app APIs, DNS, and SSL

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Split Architecture Test Suite        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Test mode (local or production)
MODE=${1:-production}

if [ "$MODE" = "local" ]; then
  PUBLIC_API="http://localhost:5001/api"
  APP_API="http://localhost:5000/api"
  echo -e "${YELLOW}🔧 Testing in LOCAL mode${NC}"
else
  PUBLIC_API="https://api.contrezz.com/api"
  APP_API="https://api.app.contrezz.com/api"
  echo -e "${YELLOW}🌐 Testing in PRODUCTION mode${NC}"
fi

echo ""

# Test 1: Public API
echo -e "${BLUE}1. Testing Public API...${NC}"
PUBLIC_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_API/careers" 2>/dev/null || echo "000")

if [ "$PUBLIC_RESPONSE" = "200" ]; then
  echo -e "   ${GREEN}✅ Public API is working (HTTP $PUBLIC_RESPONSE)${NC}"

  # Test careers endpoint response
  CAREERS_DATA=$(curl -s "$PUBLIC_API/careers" 2>/dev/null || echo "")
  if echo "$CAREERS_DATA" | grep -q "postings"; then
    echo -e "   ${GREEN}✅ Careers endpoint returns valid data${NC}"
  else
    echo -e "   ${YELLOW}⚠️  Careers endpoint response format may be incorrect${NC}"
  fi
else
  echo -e "   ${RED}❌ Public API failed (HTTP $PUBLIC_RESPONSE)${NC}"
  if [ "$PUBLIC_RESPONSE" = "000" ]; then
    echo -e "   ${YELLOW}   → Check if public backend is running${NC}"
  fi
fi

# Test 2: App API
echo -e "${BLUE}2. Testing App API...${NC}"
APP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_API/health" 2>/dev/null || echo "000")

if [ "$APP_RESPONSE" = "200" ]; then
  echo -e "   ${GREEN}✅ App API is working (HTTP $APP_RESPONSE)${NC}"
else
  echo -e "   ${RED}❌ App API failed (HTTP $APP_RESPONSE)${NC}"
  if [ "$APP_RESPONSE" = "000" ]; then
    echo -e "   ${YELLOW}   → Check if app backend is running${NC}"
  fi
fi

# Test 3: DNS (only in production)
if [ "$MODE" != "local" ]; then
  echo -e "${BLUE}3. Testing DNS Configuration...${NC}"

  PUBLIC_DNS=$(dig +short api.contrezz.com 2>/dev/null | head -1 || echo "")
  APP_DNS=$(dig +short api.app.contrezz.com 2>/dev/null | head -1 || echo "")

  if [[ "$PUBLIC_DNS" == *"ondigitalocean.app"* ]] || [[ "$PUBLIC_DNS" == *"contrezz-public"* ]]; then
    echo -e "   ${GREEN}✅ Public API DNS is correct: $PUBLIC_DNS${NC}"
  else
    echo -e "   ${RED}❌ Public API DNS is incorrect: $PUBLIC_DNS${NC}"
    echo -e "   ${YELLOW}   → Should point to contrezz-public-api-xxxxx.ondigitalocean.app${NC}"
  fi

  if [[ "$APP_DNS" == *"ondigitalocean.app"* ]] || [[ "$APP_DNS" == *"contrezz-backend"* ]]; then
    echo -e "   ${GREEN}✅ App API DNS is correct: $APP_DNS${NC}"
  else
    echo -e "   ${RED}❌ App API DNS is incorrect: $APP_DNS${NC}"
    echo -e "   ${YELLOW}   → Should point to contrezz-backend-prod-xxxxx.ondigitalocean.app${NC}"
  fi
fi

# Test 4: SSL (only in production)
if [ "$MODE" != "local" ]; then
  echo -e "${BLUE}4. Testing SSL Certificates...${NC}"

  PUBLIC_SSL=$(echo | openssl s_client -connect api.contrezz.com:443 -servername api.contrezz.com 2>/dev/null | grep -c "Verify return code: 0" || echo "0")
  APP_SSL=$(echo | openssl s_client -connect api.app.contrezz.com:443 -servername api.app.contrezz.com 2>/dev/null | grep -c "Verify return code: 0" || echo "0")

  if [ "$PUBLIC_SSL" = "1" ]; then
    echo -e "   ${GREEN}✅ Public API SSL certificate is valid${NC}"
  else
    echo -e "   ${RED}❌ Public API SSL certificate is invalid${NC}"
    echo -e "   ${YELLOW}   → Check domain configuration in DigitalOcean${NC}"
  fi

  if [ "$APP_SSL" = "1" ]; then
    echo -e "   ${GREEN}✅ App API SSL certificate is valid${NC}"
  else
    echo -e "   ${RED}❌ App API SSL certificate is invalid${NC}"
    echo -e "   ${YELLOW}   → Check domain configuration in DigitalOcean${NC}"
  fi
fi

# Test 5: CORS (check headers)
if [ "$MODE" != "local" ]; then
  echo -e "${BLUE}5. Testing CORS Configuration...${NC}"

  CORS_HEADER=$(curl -s -I "$PUBLIC_API/careers" 2>/dev/null | grep -i "access-control-allow-origin" || echo "")

  if [ -n "$CORS_HEADER" ]; then
    echo -e "   ${GREEN}✅ CORS headers are present${NC}"
    echo -e "   ${BLUE}   → $CORS_HEADER${NC}"
  else
    echo -e "   ${YELLOW}⚠️  CORS headers not found (may be configured elsewhere)${NC}"
  fi
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Summary
if [ "$PUBLIC_RESPONSE" = "200" ] && [ "$APP_RESPONSE" = "200" ]; then
  echo -e "${GREEN}✅ All API tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Test frontend in browser"
  echo "  2. Verify careers page loads from public API"
  echo "  3. Verify app dashboard loads from app API"
  echo "  4. Check browser console for any errors"
else
  echo -e "${RED}❌ Some tests failed. Check the output above.${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "  - Check if backends are running"
  echo "  - Verify DNS configuration"
  echo "  - Check environment variables"
  echo "  - Review deployment logs"
fi

echo ""
