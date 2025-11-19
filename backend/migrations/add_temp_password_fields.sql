-- Add fields for temporary password management
-- Run: psql "postgresql://postgres:Contrezz2025@localhost:5432/contrezz?schema=public" -f backend/migrations/add_temp_password_fields.sql

-- Add temporary password flag and expiry
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_temp_password BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_temp_password ON users(is_temp_password, temp_password_expires_at);

-- Update existing users to have must_change_password = false
UPDATE users SET must_change_password = false WHERE must_change_password IS NULL;

COMMENT ON COLUMN users.is_temp_password IS 'Whether the current password is temporary';
COMMENT ON COLUMN users.temp_password_expires_at IS 'When the temporary password expires';
COMMENT ON COLUMN users.must_change_password IS 'Whether user must change password on next login';

