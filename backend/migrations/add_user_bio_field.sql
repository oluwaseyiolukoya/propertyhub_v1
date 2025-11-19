-- Add bio field to users table
-- This allows users to add a short biography or description to their profile

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.bio IS 'User biography or description for their profile';

-- Create index for faster searches (optional, but useful if we search by bio content)
-- CREATE INDEX IF NOT EXISTS idx_users_bio ON users USING gin(to_tsvector('english', bio));

SELECT 'Bio field added to users table successfully' AS status;

