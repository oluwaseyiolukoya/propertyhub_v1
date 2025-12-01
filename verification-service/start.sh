#!/bin/sh
set -e

echo "[Verification Service] Using NODE_ENV=${NODE_ENV:-production}"

if [ -n "$DATABASE_URL" ]; then
  echo "[Verification Service] Running Prisma migrations..."
  if npx prisma migrate deploy; then
    echo "[Verification Service] Migrations applied"
  else
    echo "[Verification Service] migrate deploy failed; attempting db push"
    npx prisma db push --accept-data-loss || true
  fi

  # Run seed if SEED_ON_START is set (useful for first deployment)
  if [ "$SEED_ON_START" = "true" ]; then
    echo "[Verification Service] Running database seed..."
    npm run prisma:seed || echo "[Verification Service] Seed failed (may already exist)"
  fi
else
  echo "[Verification Service] DATABASE_URL not set; skipping migrations"
fi

echo "[Verification Service] Launching verification service..."
# Check which path the build output is in
if [ -f "dist/index.js" ]; then
  exec node dist/index.js
elif [ -f "dist/src/index.js" ]; then
  exec node dist/src/index.js
else
  echo "[Verification Service] ERROR: Could not find index.js in dist/ or dist/src/"
  echo "[Verification Service] Listing dist/ contents:"
  ls -la dist/ || echo "[Verification Service] dist/ directory does not exist"
  echo "[Verification Service] Listing current directory:"
  ls -la
  exit 1
fi



