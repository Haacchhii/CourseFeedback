-- Update period_enrollments table to track class sections instead of program sections
-- Drop old table and recreate with new structure

DROP TABLE IF EXISTS period_enrollments CASCADE;

CREATE TABLE period_enrollments (
    id SERIAL PRIMARY KEY,
    evaluation_period_id INTEGER NOT NULL REFERENCES evaluation_periods(id) ON DELETE CASCADE,
    class_section_id INTEGER NOT NULL REFERENCES class_sections(id) ON DELETE CASCADE,
    enrolled_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE(evaluation_period_id, class_section_id)
);

-- Add comment for documentation
COMMENT ON TABLE period_enrollments IS 'Tracks which class sections (block sections) are enrolled in each evaluation period';

-- Create indexes for better query performance
CREATE INDEX idx_period_enrollments_period ON period_enrollments(evaluation_period_id);
CREATE INDEX idx_period_enrollments_section ON period_enrollments(class_section_id);

-- evaluation_period_id column should already exist in enrollments table from migration 12
-- If not, add it:
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS evaluation_period_id INTEGER REFERENCES evaluation_periods(id) ON DELETE SET NULL;

-- Add index for faster period-based enrollment queries
CREATE INDEX IF NOT EXISTS idx_enrollments_period ON enrollments(evaluation_period_id);
