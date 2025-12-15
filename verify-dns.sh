#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║  DNS Verification Script              ║"
echo "╚════════════════════════════════════════╝"
echo ""

echo "Checking api.contrezz.com (should point to PUBLIC API):"
PUBLIC_DNS=$(dig api.contrezz.com +short | head -1)
echo "  Current: $PUBLIC_DNS"
if [[ "$PUBLIC_DNS" == *"contrezz-public-api-hetj8"* ]]; then
  echo "  ✅ CORRECT - Points to public API"
else
  echo "  ❌ WRONG - Still pointing to backend"
  echo "  Expected: contrezz-public-api-hetj8.ondigitalocean.app"
fi

echo ""
echo "Checking api.app.contrezz.com (should point to APP BACKEND):"
APP_DNS=$(dig api.app.contrezz.com +short | head -1)
echo "  Current: $APP_DNS"
if [[ "$APP_DNS" == *"contrezz-backend-prod-nnju5"* ]]; then
  echo "  ✅ CORRECT - Points to app backend"
else
  echo "  ❌ WRONG"
  echo "  Expected: contrezz-backend-prod-nnju5.ondigitalocean.app"
fi

echo ""
echo "Testing API endpoints:"
echo ""
echo "Public API:"
curl -s https://api.contrezz.com/health 2>&1 | head -3 || echo "  Not accessible yet"
echo ""
echo "App API:"
curl -s https://api.app.contrezz.com/health 2>&1 | head -3 || echo "  Not accessible yet"
