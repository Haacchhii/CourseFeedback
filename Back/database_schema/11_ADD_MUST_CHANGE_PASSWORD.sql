-- Add must_change_password column to users table
-- This flag forces users with pre-generated passwords to change on first login

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN users.must_change_password IS 'Flag to force password change on first login for users with pre-generated passwords';

-- Update existing users to false (no forced password change for existing accounts)
UPDATE users 
SET must_change_password = false 
WHERE must_change_password IS NULL;

-- Create index for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_users_must_change_password ON users(must_change_password) WHERE must_change_password = true;
