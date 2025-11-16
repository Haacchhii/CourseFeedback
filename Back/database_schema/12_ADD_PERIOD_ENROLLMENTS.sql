-- Add period_enrollments table to track which program sections are enrolled in each evaluation period
-- This simplifies the enrollment process by allowing bulk enrollment by program section

CREATE TABLE IF NOT EXISTS period_enrollments (
    id SERIAL PRIMARY KEY,
    evaluation_period_id INTEGER NOT NULL REFERENCES evaluation_periods(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    year_level INTEGER NOT NULL CHECK (year_level BETWEEN 1 AND 4),
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 2),
    enrolled_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE(evaluation_period_id, program_id, year_level, semester)
);

-- Add comment for documentation
COMMENT ON TABLE period_enrollments IS 'Tracks which program sections (program + year + semester) are enrolled in each evaluation period';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_period_enrollments_period ON period_enrollments(evaluation_period_id);
CREATE INDEX IF NOT EXISTS idx_period_enrollments_program ON period_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_period_enrollments_lookup ON period_enrollments(evaluation_period_id, program_id, year_level, semester);

-- Add evaluation_period_id to enrollments table to link enrollments to periods
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS evaluation_period_id INTEGER REFERENCES evaluation_periods(id) ON DELETE SET NULL;

-- Add index for faster period-based enrollment queries
CREATE INDEX IF NOT EXISTS idx_enrollments_period ON enrollments(evaluation_period_id);

COMMENT ON COLUMN enrollments.evaluation_period_id IS 'Links enrollment to specific evaluation period for period-based evaluation access';
