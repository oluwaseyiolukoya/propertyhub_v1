-- Create customer_users membership table
CREATE TABLE IF NOT EXISTS "customer_users" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "permissions" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "customer_users_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "customer_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Unique membership per (customerId, userId)
CREATE UNIQUE INDEX IF NOT EXISTS "customer_users_customerId_userId_key"
ON "customer_users" ("customerId", "userId");

-- Backfill from existing users.customerId (legacy)
INSERT INTO "customer_users" ("id", "customerId", "userId", "role", "permissions", "isActive", "createdAt", "updatedAt")
SELECT
  -- pseudo-uuid string id
  substr(md5(random()::text || clock_timestamp()::text), 1, 32) as id,
  u."customerId",
  u."id",
  u."role",
  u."permissions"::jsonb,
  COALESCE(u."isActive", true),
  NOW(),
  NOW()
FROM "users" u
WHERE u."customerId" IS NOT NULL
ON CONFLICT ("customerId", "userId") DO NOTHING;






