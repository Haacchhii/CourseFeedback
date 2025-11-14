-- ============================================================
-- DATABASE SCHEMA UPGRADE - Add ML and Enhanced Evaluation Features
-- Run this on your PostgreSQL database to add missing columns
-- Date: November 14, 2025
-- ============================================================

\echo '============================================================'
\echo 'STARTING DATABASE SCHEMA UPGRADE'
\echo '============================================================'

-- ==================================================
-- PART 1: FIX COURSES TABLE
-- ==================================================
\echo ''
\echo 'PART 1: Upgrading courses table...'

-- Add units column if missing
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS units DECIMAL(3,1);

-- Check and convert semester column type
DO $$
BEGIN
    -- Check if semester is VARCHAR, if so convert to INTEGER
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'semester' 
        AND data_type IN ('character varying', 'varchar', 'text')
    ) THEN
        RAISE NOTICE 'Converting courses.semester from VARCHAR to INTEGER...';
        
        -- First, convert existing data
        -- '1st Semester' or 'First Semester' → 1
        -- '2nd Semester' or 'Second Semester' → 2
        UPDATE courses 
        SET semester = CASE
            WHEN semester ILIKE '%first%' OR semester = '1' OR semester ILIKE '%1st%' THEN '1'
            WHEN semester ILIKE '%second%' OR semester = '2' OR semester ILIKE '%2nd%' THEN '2'
            WHEN semester ILIKE '%summer%' THEN '3'
            ELSE semester
        END
        WHERE semester IS NOT NULL;
        
        -- Then change column type
        ALTER TABLE courses 
        ALTER COLUMN semester TYPE INTEGER USING semester::INTEGER;
        
        -- Add check constraint
        ALTER TABLE courses
        DROP CONSTRAINT IF EXISTS courses_semester_check;
        
        ALTER TABLE courses
        ADD CONSTRAINT courses_semester_check CHECK (semester IN (1, 2, 3));
        
        RAISE NOTICE '✅ Converted courses.semester from VARCHAR to INTEGER';
    ELSE
        RAISE NOTICE '✅ courses.semester is already INTEGER type';
    END IF;
END $$;

-- ==================================================
-- PART 2: FIX EVALUATIONS TABLE
-- ==================================================
\echo ''
\echo 'PART 2: Upgrading evaluations table...'

-- Add missing columns to evaluations table for 21-question system and ML features
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS ratings JSONB,                    -- Store all 21 question responses as JSON
ADD COLUMN IF NOT EXISTS text_feedback TEXT,                -- Main feedback text (coexists with comments)
ADD COLUMN IF NOT EXISTS suggestions TEXT,                  -- Improvement suggestions
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT,             -- ML sentiment confidence score (0-1)
ADD COLUMN IF NOT EXISTS sentiment_confidence FLOAT,        -- Duplicate for backward compatibility
ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN DEFAULT FALSE,  -- Anomaly detection flag
ADD COLUMN IF NOT EXISTS anomaly_score FLOAT,               -- Anomaly confidence score
ADD COLUMN IF NOT EXISTS anomaly_reason TEXT,               -- Explanation for anomaly
ADD COLUMN IF NOT EXISTS metadata JSONB,                    -- Additional tracking data
ADD COLUMN IF NOT EXISTS submission_ip VARCHAR(45),         -- IP address for audit trail
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending',  -- pending, processed, flagged
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP,            -- When ML processing completed
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP;         -- Alias for submitted_at

-- Copy submitted_at to submission_date if it's NULL
UPDATE evaluations SET submission_date = submitted_at WHERE submission_date IS NULL;

\echo '✅ Added missing columns to evaluations table'

-- ==================================================
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- ==================================================
\echo ''
\echo 'PART 3: Creating performance indexes...'

-- Create indexes for performance on new columns
CREATE INDEX IF NOT EXISTS idx_evaluations_ratings 
ON evaluations USING GIN (ratings) WHERE ratings IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evaluations_sentiment_ml 
ON evaluations(sentiment, sentiment_score) WHERE sentiment_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evaluations_anomaly_ml 
ON evaluations(is_anomaly, anomaly_score) WHERE is_anomaly = TRUE;

CREATE INDEX IF NOT EXISTS idx_evaluations_processing 
ON evaluations(processing_status, processed_at) WHERE processing_status != 'pending';

CREATE INDEX IF NOT EXISTS idx_evaluations_submission_date
ON evaluations(submission_date) WHERE submission_date IS NOT NULL;

\echo '✅ Created performance indexes'

-- ==================================================
-- PART 4: ADD COMMENTS FOR DOCUMENTATION
-- ==================================================
\echo ''
\echo 'PART 4: Adding documentation comments...'

-- Add comments for documentation
COMMENT ON COLUMN evaluations.ratings IS 'JSONB storing all 21 question responses with keys "1" through "21" and values 1-4';
COMMENT ON COLUMN evaluations.sentiment_score IS 'ML-generated sentiment confidence score from 0.0 to 1.0';
COMMENT ON COLUMN evaluations.is_anomaly IS 'True if DBSCAN detected this evaluation as an outlier/suspicious';
COMMENT ON COLUMN evaluations.anomaly_score IS 'Anomaly detection confidence score';
COMMENT ON COLUMN evaluations.metadata IS 'Additional tracking: submission timestamp, question count, ML flags, etc.';
COMMENT ON COLUMN evaluations.text_feedback IS 'Main text feedback from student (coexists with comments column)';
COMMENT ON COLUMN evaluations.submission_date IS 'Timestamp when evaluation was submitted (alias for submitted_at)';

COMMENT ON COLUMN courses.units IS 'Credit units/hours for the course (typically 1.0 to 5.0)';
COMMENT ON COLUMN courses.semester IS 'Semester when course is offered: 1 (First), 2 (Second), or 3 (Summer)';

\echo '✅ Added documentation comments'

-- ==================================================
-- PART 5: VERIFICATION
-- ==================================================
\echo ''
\echo 'PART 5: Verifying changes...'
\echo ''

-- Verify courses table columns
\echo 'COURSES TABLE COLUMNS:'
SELECT 
    column_name, 
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;

\echo ''
\echo 'EVALUATIONS TABLE NEW COLUMNS:'
-- Verify evaluations table new columns
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'evaluations'
AND column_name IN ('ratings', 'text_feedback', 'sentiment_score', 'is_anomaly', 
                    'anomaly_score', 'metadata', 'submission_date', 'processing_status')
ORDER BY column_name;

-- ==================================================
-- SUCCESS MESSAGE
-- ==================================================
\echo ''
\echo '============================================================'
\echo '✅ DATABASE SCHEMA UPGRADE COMPLETE!'
\echo '============================================================'
\echo ''
\echo 'CHANGES APPLIED:'
\echo '  ✓ courses.semester converted to INTEGER (1, 2, or 3)'
\echo '  ✓ courses.units column ensured exists'
\echo '  ✓ evaluations.ratings (JSONB) for 21-question responses'
\echo '  ✓ evaluations.sentiment_score, is_anomaly, anomaly_score for ML'
\echo '  ✓ evaluations.text_feedback for additional comments'
\echo '  ✓ evaluations.metadata (JSONB) for tracking'
\echo '  ✓ evaluations.processing_status for workflow'
\echo '  ✓ Performance indexes created'
\echo ''
\echo 'NEXT STEPS:'
\echo '  1. Restart your FastAPI backend server'
\echo '  2. Test student evaluation submission'
\echo '  3. Verify ML features work'
\echo ''
\echo '============================================================'

