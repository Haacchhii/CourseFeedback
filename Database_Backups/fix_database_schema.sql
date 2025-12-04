-- ============================================================================
-- CRITICAL DATABASE SCHEMA FIXES
-- ============================================================================
-- This script fixes the missing instructors table and instructor_id column
-- Run this in your Supabase SQL editor
-- ============================================================================

-- 1. Create instructors table (MISSING)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instructors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_instructors_user_id ON instructors(user_id);

-- Add comment
COMMENT ON TABLE instructors IS 'Stores instructor information linked to user accounts';

-- ----------------------------------------------------------------------------
-- 2. Add instructor_id column to class_sections (MISSING)
-- ----------------------------------------------------------------------------
-- Check if column exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='class_sections' AND column_name='instructor_id'
    ) THEN
        ALTER TABLE class_sections 
        ADD COLUMN instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        
        -- Create index for performance
        CREATE INDEX idx_class_sections_instructor ON class_sections(instructor_id);
        
        RAISE NOTICE 'Added instructor_id column to class_sections';
    ELSE
        RAISE NOTICE 'instructor_id column already exists in class_sections';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Verify the changes
-- ----------------------------------------------------------------------------
-- Check instructors table
SELECT 
    'instructors table' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='instructors'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check class_sections.instructor_id column
SELECT 
    'instructor_id column' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='class_sections' AND column_name='instructor_id'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Show class_sections structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'class_sections'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 4. Populate instructors table with existing instructor users
-- ----------------------------------------------------------------------------
-- Find users with role='instructor' and create instructor records
INSERT INTO instructors (user_id, name, department, specialization)
SELECT 
    u.id as user_id,
    CONCAT(u.first_name, ' ', u.last_name) as name,
    'General' as department,
    NULL as specialization
FROM users u
WHERE u.role = 'instructor'
  AND NOT EXISTS (
      SELECT 1 FROM instructors i WHERE i.user_id = u.id
  );

-- Show results
SELECT 
    'Instructor records created' as info,
    COUNT(*) as count
FROM instructors;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables structure
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_name IN ('instructors', 'class_sections', 'users')
GROUP BY t.table_name
ORDER BY t.table_name;

-- Show sample data from instructors
SELECT 
    i.id,
    i.name,
    i.department,
    u.email,
    u.role
FROM instructors i
JOIN users u ON i.user_id = u.id
LIMIT 5;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- Uncomment to rollback changes
-- 
-- DROP TABLE IF EXISTS instructors CASCADE;
-- ALTER TABLE class_sections DROP COLUMN IF EXISTS instructor_id;
-- 
-- ============================================================================
