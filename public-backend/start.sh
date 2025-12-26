#!/bin/sh
set -e

echo "[start] Using NODE_ENV=${NODE_ENV:-production}"

if [ -n "$PUBLIC_DATABASE_URL" ]; then
  echo "[start] Running Prisma migrations..."
  if npx prisma migrate deploy; then
    echo "[start] ✅ Migrations applied successfully"
  else
    echo "[start] ⚠️  migrate deploy failed; checking status..."
    npx prisma migrate status || true
    echo "[start] ⚠️  Continuing anyway - check migration status manually"
  fi
else
  echo "[start] ⚠️  PUBLIC_DATABASE_URL not set; skipping migrations"
fi

echo "[start] Launching API..."
# Check which path the build output is in
if [ -f "dist/index.js" ]; then
  exec node dist/index.js
elif [ -f "dist/src/index.js" ]; then
  exec node dist/src/index.js
else
  echo "[start] ❌ ERROR: Could not find index.js in dist/ or dist/src/"
  ls -la dist/ || true
  exit 1
fi
