-- Add school_id and first_login fields to support first-time login flow
-- Migration: 08_ADD_SCHOOL_ID_FIRST_LOGIN.sql

-- Add school_id column to users table (for all user types)
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id VARCHAR(50);

-- Add first_login flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT TRUE;

-- Create index on school_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);

-- Update existing students to copy student_number to users.school_id
UPDATE users u
SET school_id = s.student_number
FROM students s
WHERE u.id = s.user_id
  AND u.school_id IS NULL
  AND s.student_number IS NOT NULL;

-- Set first_login to FALSE for existing users (they've already logged in)
UPDATE users
SET first_login = FALSE
WHERE first_login IS NULL OR first_login = TRUE;

-- Make school_id NOT NULL for students (enforce data integrity)
-- Note: This will be enforced at application level for new users

-- Add comment to columns
COMMENT ON COLUMN users.school_id IS 'School ID number - used for generating temporary passwords (lpub@[school_id])';
COMMENT ON COLUMN users.first_login IS 'Flag to track if user needs to change temporary password on first login';

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 08_ADD_SCHOOL_ID_FIRST_LOGIN completed successfully!';
    RAISE NOTICE '   - Added school_id column to users table';
    RAISE NOTICE '   - Added first_login flag to users table';
    RAISE NOTICE '   - Created index on school_id';
    RAISE NOTICE '   - Migrated existing student numbers to school_id';
END $$;
