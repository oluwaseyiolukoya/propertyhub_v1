#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 DNS PROPAGATION TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test contrezz.com
echo "1️⃣  Testing contrezz.com (Frontend):"
FRONTEND_IP=$(dig +short contrezz.com @8.8.8.8 | head -1)
if [ -n "$FRONTEND_IP" ]; then
  echo "   ✅ DNS resolved to: $FRONTEND_IP"
  if [[ "$FRONTEND_IP" == "162.159.140.98" ]] || [[ "$FRONTEND_IP" == "172.66.0.96" ]]; then
    echo "   ✅ Correct IP!"
  else
    echo "   ⚠️  Unexpected IP (should be 162.159.140.98 or 172.66.0.96)"
  fi
else
  echo "   ❌ DNS not resolved yet"
fi
echo ""

# Test api.contrezz.com
echo "2️⃣  Testing api.contrezz.com (Backend):"
API_CNAME=$(dig +short api.contrezz.com @8.8.8.8 | head -1)
if [ -n "$API_CNAME" ]; then
  echo "   ✅ DNS resolved to: $API_CNAME"
  if [[ "$API_CNAME" == *"ondigitalocean.app"* ]]; then
    echo "   ✅ Correct CNAME!"
  else
    echo "   ⚠️  Unexpected value"
  fi
else
  echo "   ❌ DNS not resolved yet"
fi
echo ""

# Test frontend HTTP
echo "3️⃣  Testing frontend HTTPS access:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 5 https://contrezz.com 2>/dev/null)
if [ "$FRONTEND_STATUS" == "200" ]; then
  echo "   ✅ Frontend is accessible! (HTTP 200)"
elif [ -n "$FRONTEND_STATUS" ]; then
  echo "   ⚠️  Frontend returned HTTP $FRONTEND_STATUS"
else
  echo "   ❌ Frontend not accessible yet"
fi
echo ""

# Test backend API
echo "4️⃣  Testing backend API health:"
API_RESPONSE=$(curl -s -m 5 https://api.contrezz.com/api/health 2>/dev/null)
if [[ "$API_RESPONSE" == *"status"* ]]; then
  echo "   ✅ Backend API is working!"
  echo "   Response: $API_RESPONSE"
elif [ -n "$API_RESPONSE" ]; then
  echo "   ⚠️  Backend returned: $API_RESPONSE"
else
  echo "   ❌ Backend API not accessible yet"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Final status
if [ "$FRONTEND_STATUS" == "200" ] && [[ "$API_RESPONSE" == *"status"* ]]; then
  echo "🎉 ALL SYSTEMS GO!"
  echo ""
  echo "✅ Frontend: https://contrezz.com"
  echo "✅ Backend API: https://api.contrezz.com"
  echo ""
  echo "📝 Login Credentials:"
  echo "   Email: admin@contrezz.com"
  echo "   Password: admin123"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo "⏱️  DNS is still propagating. Wait a few minutes and run this script again:"
  echo "   ./test_dns.sh"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi















