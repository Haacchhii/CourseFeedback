-- Migration 17: Add Program Section Enrollment for Evaluation Periods
-- This allows admins to enroll entire program sections (student groups) into evaluation periods

-- Create table to track which program sections are enrolled in which evaluation periods
CREATE TABLE IF NOT EXISTS period_program_sections (
    id SERIAL PRIMARY KEY,
    evaluation_period_id INTEGER NOT NULL REFERENCES evaluation_periods(id) ON DELETE CASCADE,
    program_section_id INTEGER NOT NULL REFERENCES program_sections(id) ON DELETE CASCADE,
    enrolled_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE(evaluation_period_id, program_section_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_period_program_sections_period ON period_program_sections(evaluation_period_id);
CREATE INDEX IF NOT EXISTS idx_period_program_sections_section ON period_program_sections(program_section_id);

-- Add comment for documentation
COMMENT ON TABLE period_program_sections IS 'Tracks which program sections (student groups like BSCS-DS-3A) are enrolled in each evaluation period. When a program section is enrolled, all students in that section get evaluation records for all their enrolled courses.';
