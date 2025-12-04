-- Add evaluation_period_id column to evaluations table
-- This column is referenced throughout the codebase but is missing from the actual database

-- Step 1: Add the column (nullable first to avoid errors with existing data)
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS evaluation_period_id INTEGER;

-- Step 2: Add foreign key constraint
ALTER TABLE evaluations
ADD CONSTRAINT fk_evaluations_evaluation_period
FOREIGN KEY (evaluation_period_id) 
REFERENCES evaluation_periods(id) 
ON DELETE SET NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_period 
ON evaluations(evaluation_period_id);

-- Step 4: Backfill existing evaluations with their period from enrollments
-- This ensures existing data has the correct period linkage
UPDATE evaluations ev
SET evaluation_period_id = enr.evaluation_period_id
FROM enrollments enr
WHERE ev.student_id = enr.student_id
AND ev.class_section_id = enr.class_section_id
AND ev.evaluation_period_id IS NULL
AND enr.evaluation_period_id IS NOT NULL;

-- Step 5: Add status column if it doesn't exist
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';

-- Step 6: Add created_at column if it doesn't exist
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Verification query (uncomment to check results)
-- SELECT 
--     COUNT(*) as total_evaluations,
--     COUNT(evaluation_period_id) as with_period,
--     COUNT(*) - COUNT(evaluation_period_id) as without_period
-- FROM evaluations;
