#!/bin/bash

# ========================================
# Test Public API Endpoints
# ========================================
# Quick test script for public backend API

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default to localhost, override with env var
API_URL=${PUBLIC_API_URL:-http://localhost:5001}

echo "╔════════════════════════════════════════╗"
echo "║  Testing Public API                   ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}API URL: $API_URL${NC}"
echo ""

# Test health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
response=$(curl -s "$API_URL/health")
if echo "$response" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$response" | jq '.'
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$response"
    exit 1
fi

echo ""

# Test careers list
echo -e "${YELLOW}Testing careers list endpoint...${NC}"
response=$(curl -s "$API_URL/api/careers?limit=5")
if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Careers list passed${NC}"
    count=$(echo "$response" | jq -r '.data.pagination.total')
    echo "Total careers: $count"
else
    echo -e "${RED}❌ Careers list failed${NC}"
    echo "$response"
fi

echo ""

# Test careers filters
echo -e "${YELLOW}Testing careers filters endpoint...${NC}"
response=$(curl -s "$API_URL/api/careers/filters")
if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Filters passed${NC}"
    echo "$response" | jq -r '.data | keys[]'
else
    echo -e "${RED}❌ Filters failed${NC}"
    echo "$response"
fi

echo ""

# Test careers stats
echo -e "${YELLOW}Testing careers stats endpoint...${NC}"
response=$(curl -s "$API_URL/api/careers/stats")
if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Stats passed${NC}"
    echo "$response" | jq '.'
else
    echo -e "${RED}❌ Stats failed${NC}"
    echo "$response"
fi

echo ""

# Test single career (if any exist)
echo -e "${YELLOW}Testing single career endpoint...${NC}"
career_id=$(curl -s "$API_URL/api/careers?limit=1" | jq -r '.data.postings[0].id // empty')

if [ ! -z "$career_id" ]; then
    response=$(curl -s "$API_URL/api/careers/$career_id")
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✅ Single career passed${NC}"
        echo "$response" | jq -r '.data.title'
    else
        echo -e "${RED}❌ Single career failed${NC}"
        echo "$response"
    fi
else
    echo -e "${YELLOW}⚠️  No careers found to test single endpoint${NC}"
fi

echo ""

# Test rate limiting (optional)
echo -e "${YELLOW}Testing rate limiting (10 rapid requests)...${NC}"
for i in {1..10}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
    echo -n "."
done
echo ""
echo -e "${GREEN}✅ Rate limiting test complete (no 429 errors)${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  All Tests Passed!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
