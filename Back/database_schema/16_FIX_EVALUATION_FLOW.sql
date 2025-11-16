-- Migration 16: Fix Evaluation Flow
-- This migration adds the missing links between evaluation periods and student evaluations

-- 1. Add evaluation_period_id to evaluations table (if not exists from migration 13)
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS evaluation_period_id INTEGER REFERENCES evaluation_periods(id) ON DELETE SET NULL;

-- 2. Add status tracking to evaluations
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped'));

-- 3. Add submitted_at timestamp
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_evaluations_period ON evaluations(evaluation_period_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_period ON evaluations(student_id, evaluation_period_id);

-- 5. Add comment for documentation
COMMENT ON COLUMN evaluations.evaluation_period_id IS 'Links evaluation to specific evaluation period';
COMMENT ON COLUMN evaluations.status IS 'Tracks whether evaluation is pending, completed, or skipped';
COMMENT ON COLUMN evaluations.submitted_at IS 'Timestamp when student submitted the evaluation';

-- 6. Update existing evaluations to set status
-- Set status to 'completed' for evaluations that have ratings
UPDATE evaluations 
SET status = 'completed' 
WHERE rating_overall IS NOT NULL AND status IS NULL;

-- Set status to 'pending' for evaluations without ratings
UPDATE evaluations 
SET status = 'pending' 
WHERE rating_overall IS NULL AND status IS NULL;

-- 7. Add created_at column to evaluations if not exists
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
