#!/bin/sh
set -e

echo "[start] Using NODE_ENV=${NODE_ENV:-production}"

if [ -n "$DATABASE_URL" ]; then
  echo "[start] Running Prisma migrations..."
  if npx prisma migrate deploy; then
    echo "[start] Migrations applied"
  else
    echo "[start] migrate deploy failed; attempting db push"
    npx prisma db push --accept-data-loss || true
  fi

  # Run seed if SEED_ON_START is set (useful for first deployment)
  if [ "$SEED_ON_START" = "true" ]; then
    echo "[start] Running database seed..."
    npm run prisma:seed || echo "[start] Seed failed (may already exist)"
  fi
else
  echo "[start] DATABASE_URL not set; skipping migrations"
fi

echo "[start] Launching API..."
# Check which path the build output is in
if [ -f "dist/index.js" ]; then
  exec node dist/index.js
elif [ -f "dist/src/index.js" ]; then
  exec node dist/src/index.js
else
  echo "[start] ERROR: Could not find index.js in dist/ or dist/src/"
  ls -la dist/ || true
  exit 1
fi


