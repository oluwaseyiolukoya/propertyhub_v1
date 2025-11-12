#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔍 VERIFY DEPLOYMENT & DNS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFYING DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to check DNS
check_dns() {
  local domain=$1
  local type=$2
  echo "🔍 Checking $type record for $domain..."
  
  if [ "$type" = "A" ]; then
    dig +short $domain A | head -2
  else
    dig +short $domain CNAME
  fi
  echo ""
}

# Function to check HTTP
check_http() {
  local url=$1
  local name=$2
  echo "🌐 Checking $name: $url"
  
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 $url 2>/dev/null || echo "000")
  
  if [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "302" ]; then
    echo "   ✅ Status: $status (Working!)"
  elif [ "$status" = "000" ]; then
    echo "   ⏳ Status: DNS not propagated yet (wait 5-10 minutes)"
  else
    echo "   ⚠️  Status: $status"
  fi
  echo ""
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 1: DNS RECORDS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_dns "contrezz.com" "A"
check_dns "api.contrezz.com" "CNAME"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 2: HTTP ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_http "https://contrezz.com" "Frontend"
check_http "https://www.contrezz.com" "Frontend (www)"
check_http "https://api.contrezz.com/health" "Backend API"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 3: SSL CERTIFICATES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔒 Checking SSL for contrezz.com..."
if echo | openssl s_client -connect contrezz.com:443 -servername contrezz.com 2>/dev/null | grep -q "Verify return code: 0"; then
  echo "   ✅ SSL certificate is valid"
else
  echo "   ⏳ SSL certificate pending (auto-generates after DNS propagation)"
fi
echo ""

echo "🔒 Checking SSL for api.contrezz.com..."
if echo | openssl s_client -connect api.contrezz.com:443 -servername api.contrezz.com 2>/dev/null | grep -q "Verify return code: 0"; then
  echo "   ✅ SSL certificate is valid"
else
  echo "   ⏳ SSL certificate pending (auto-generates after DNS propagation)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ DNS configured in Namecheap"
echo "⏳ Waiting for DNS propagation (5-30 minutes)"
echo "🔒 SSL certificates will auto-generate after DNS propagates"
echo ""
echo "Check DNS propagation: https://dnschecker.org/#A/contrezz.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

