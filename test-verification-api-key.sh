#!/bin/bash

# Test Verification Service API Key
# This script helps diagnose API key issues between main backend and verification service

echo "🔍 Testing Verification Service API Key..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VERIFICATION_SERVICE_URL="https://contrezz-verification-service-8ghq7.ondigitalocean.app"
API_KEY="vkey_fd6967cc3dbc5d1650b21b580df6f8f49cb7ddd79f1abd04"

echo "📋 Configuration:"
echo "   Service URL: $VERIFICATION_SERVICE_URL"
echo "   API Key: ${API_KEY:0:20}..."
echo ""

# Test 1: Health Check (No API Key Required)
echo "🧪 Test 1: Health Check (No Auth)"
echo "   Testing: $VERIFICATION_SERVICE_URL/health"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$VERIFICATION_SERVICE_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Health check passed (200 OK)${NC}"
    echo "   Response: $BODY" | head -c 100
    echo ""
else
    echo -e "   ${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    echo ""
fi

# Test 2: Submit Verification with API Key
echo "🧪 Test 2: Submit Verification (With API Key)"
echo "   Testing: $VERIFICATION_SERVICE_URL/api/verification/submit"
SUBMIT_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"customerId":"test-customer-123","customerType":"property_owner","customerEmail":"test@example.com"}' \
    "$VERIFICATION_SERVICE_URL/api/verification/submit")

HTTP_CODE=$(echo "$SUBMIT_RESPONSE" | tail -n1)
BODY=$(echo "$SUBMIT_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "   ${GREEN}✅ API key is valid! (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    echo ""
elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "   ${RED}❌ API key is INVALID! (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    echo ""
    echo -e "   ${YELLOW}⚠️  The API key in this script doesn't match the verification service!${NC}"
    echo ""
else
    echo -e "   ${YELLOW}⚠️  Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    echo ""
fi

# Test 3: Test with Wrong API Key
echo "🧪 Test 3: Test with Wrong API Key (Should Fail)"
echo "   Testing with: wrong_key_123"
WRONG_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "X-API-Key: wrong_key_123" \
    -H "Content-Type: application/json" \
    -d '{"customerId":"test-customer-123","customerType":"property_owner","customerEmail":"test@example.com"}' \
    "$VERIFICATION_SERVICE_URL/api/verification/submit")

HTTP_CODE=$(echo "$WRONG_RESPONSE" | tail -n1)
BODY=$(echo "$WRONG_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "   ${GREEN}✅ Correctly rejected invalid key (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    echo ""
else
    echo -e "   ${RED}❌ Unexpected: Should have rejected invalid key (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
    echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If Test 2 shows '✅ API key is valid', then the key in this script is correct."
echo "If Test 2 shows '❌ API key is INVALID', then:"
echo "  1. The verification service is using a different API key"
echo "  2. Check the API_KEY_MAIN_DASHBOARD in verification service environment"
echo "  3. Update VERIFICATION_API_KEY in main backend to match"
echo ""
echo "Next steps:"
echo "  1. Copy the API_KEY_MAIN_DASHBOARD from verification service"
echo "  2. Set VERIFICATION_API_KEY in main backend to the same value"
echo "  3. Redeploy main backend"
echo ""



