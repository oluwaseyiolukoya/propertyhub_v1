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
else
  echo "[start] DATABASE_URL not set; skipping migrations"
fi

echo "[start] Launching API..."
exec node dist/src/index.js


