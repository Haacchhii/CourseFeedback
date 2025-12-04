-- Migration 14: Remove Instructor Concept from Course Evaluation System
-- This is a COURSE evaluation system, not instructor evaluation
-- Date: 2025-11-22

BEGIN;

-- 1. Drop instructor-related tables
DROP TABLE IF EXISTS instructors CASCADE;

-- 2. Remove instructor_id column from class_sections
ALTER TABLE class_sections DROP COLUMN IF EXISTS instructor_id CASCADE;

-- 3. Update any users with 'instructor' role to 'staff' (optional - keeps user accounts)
UPDATE users SET role = 'staff' WHERE role = 'instructor';

-- 4. Drop any instructor-related indexes that might remain
-- (CASCADE should have handled this, but being explicit)

COMMIT;

-- Verification queries:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'class_sections' AND column_name = 'instructor_id';
-- Should return 0 rows

-- SELECT COUNT(*) FROM users WHERE role = 'instructor';
-- Should return 0
