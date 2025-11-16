-- Migration 18: Make instructor_id nullable in class_sections
-- This allows creating sections without assigning an instructor
-- Since we're evaluating courses, not instructors

-- Remove NOT NULL constraint from instructor_id
ALTER TABLE class_sections 
ALTER COLUMN instructor_id DROP NOT NULL;

-- Update any existing NULL values (shouldn't be any due to constraint)
-- This is just a safety measure
UPDATE class_sections 
SET instructor_id = NULL 
WHERE instructor_id IS NULL;
