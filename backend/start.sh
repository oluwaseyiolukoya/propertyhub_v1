#!/bin/sh
set -e

echo "[start] Using NODE_ENV=${NODE_ENV:-production}"

if [ -n "$DATABASE_URL" ]; then
  echo "[start] Running Prisma migrations..."

  # Check for failed migrations and resolve them
  # Temporarily disable exit on error for migration check
  set +e
  echo "[start] Checking for failed migrations..."
  MIGRATE_OUTPUT=$(npx prisma migrate status 2>&1)
  MIGRATE_EXIT=$?
  set -e

  # Check if there are failed migrations (P3009 error or "failed" in output)
  # Also check if migrate status failed (which indicates failed migrations)
  if [ $MIGRATE_EXIT -ne 0 ] || echo "$MIGRATE_OUTPUT" | grep -qi "P3009\|failed migration"; then
    echo "[start] Found failed migrations, attempting to resolve..."

    # Extract migration names from error output
    # Pattern: "The `20251228225021_sync_schema_drift` migration"
    FAILED_MIGRATIONS=$(echo "$MIGRATE_OUTPUT" | grep -oE '[0-9]+_[a-z_]+' | head -1 || true)

    if [ -n "$FAILED_MIGRATIONS" ]; then
      for migration in $FAILED_MIGRATIONS; do
        echo "[start] Resolving failed migration: $migration"
        # Try to mark as rolled back first (since db push may have already synced)
        npx prisma migrate resolve --rolled-back "$migration" 2>/dev/null || \
        npx prisma migrate resolve --applied "$migration" 2>/dev/null || \
        echo "[start] Could not resolve $migration automatically"
      done
    else
      # Fallback: try to resolve known failed migrations
      echo "[start] Attempting to resolve known failed migrations..."
      npx prisma migrate resolve --rolled-back "20251228225021_sync_schema_drift" 2>/dev/null || \
      npx prisma migrate resolve --applied "20251228225021_sync_schema_drift" 2>/dev/null || true

      # Also handle the tax calculator migration if it failed
      npx prisma migrate resolve --rolled-back "20251229000000_add_tax_calculator_to_plans" 2>/dev/null || \
      npx prisma migrate resolve --applied "20251229000000_add_tax_calculator_to_plans" 2>/dev/null || true
    fi
  fi

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


