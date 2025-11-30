-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_temp_password" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "temp_password_expires_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_change_password" BOOLEAN DEFAULT false;
