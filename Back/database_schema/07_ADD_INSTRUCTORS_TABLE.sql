-- ============================================================
-- Migration: Add Instructors Table
-- Purpose: Create instructors table to support instructor role functionality
-- Date: November 13, 2025
-- ============================================================

-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_instructors_user_id ON instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_department ON instructors(department);

-- Migrate existing instructor users to instructors table
INSERT INTO instructors (user_id, name, department, created_at)
SELECT 
    u.id,
    CONCAT(u.first_name, ' ', u.last_name) as name,
    u.department,
    u.created_at
FROM users u
WHERE u.role = 'instructor'
  AND NOT EXISTS (
    SELECT 1 FROM instructors i WHERE i.user_id = u.id
  );

-- Show results
DO $$
DECLARE
    instructor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO instructor_count FROM instructors;
    RAISE NOTICE '✅ Instructors table created successfully';
    RAISE NOTICE '📊 Total instructors: %', instructor_count;
END $$;
