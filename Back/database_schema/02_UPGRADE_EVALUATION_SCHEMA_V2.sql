-- ============================================================
-- DATABASE SCHEMA UPGRADE - Add ML and Enhanced Evaluation Features
-- Run this on your PostgreSQL database to add missing columns
-- Compatible with: pgAdmin, Supabase, psql, DBeaver, all SQL clients
-- Date: November 14, 2025
-- ============================================================

DO $$ 
BEGIN 
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'STARTING DATABASE SCHEMA UPGRADE';
    RAISE NOTICE '============================================================';
END $$;

-- ==================================================
-- PART 1: FIX COURSES TABLE
-- ==================================================
DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE 'PART 1: Upgrading courses table...';
END $$;

-- Add units column if missing
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS units DECIMAL(3,1);

-- Convert semester from VARCHAR to INTEGER
-- First, create a temporary column
DO $$
BEGIN
    -- Check if semester is already INTEGER type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'semester' 
        AND data_type = 'character varying'
    ) THEN
        RAISE NOTICE 'Converting semester from VARCHAR to INTEGER...';
        
        -- Add temporary column
        ALTER TABLE courses ADD COLUMN IF NOT EXISTS semester_temp INTEGER;
        
        -- Convert text values to integers (handle all common formats)
        UPDATE courses SET semester_temp = CASE
            -- First semester variations
            WHEN LOWER(semester) LIKE '%first%' THEN 1
            WHEN LOWER(semester) LIKE '%1st%' THEN 1
            WHEN semester = '1' THEN 1
            -- Second semester variations
            WHEN LOWER(semester) LIKE '%second%' THEN 2
            WHEN LOWER(semester) LIKE '%2nd%' THEN 2
            WHEN semester = '2' THEN 2
            -- Summer/Third semester variations
            WHEN LOWER(semester) LIKE '%summer%' THEN 3
            WHEN LOWER(semester) LIKE '%third%' THEN 3
            WHEN LOWER(semester) LIKE '%3rd%' THEN 3
            WHEN semester = '3' THEN 3
            -- Already numeric (but as string)
            WHEN semester ~ '^\d+$' THEN CAST(semester AS INTEGER)
            -- Default to 1 if unknown format
            ELSE 1
        END;
        
        -- Drop old column and rename new one
        ALTER TABLE courses DROP COLUMN semester;
        ALTER TABLE courses RENAME COLUMN semester_temp TO semester;
        
        -- Add check constraint
        ALTER TABLE courses ADD CONSTRAINT semester_check CHECK (semester IN (1, 2, 3));
        
        RAISE NOTICE '✅ Converted courses.semester from VARCHAR to INTEGER';
    ELSE
        RAISE NOTICE '✅ courses.semester is already INTEGER type';
    END IF;
END $$;

-- ==================================================
-- PART 2: ADD MISSING EVALUATION COLUMNS
-- ==================================================
DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE 'PART 2: Adding missing columns to evaluations table...';
END $$;

-- Add the ratings JSONB column for storing all 21 questions
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS ratings JSONB;

-- Add ML-related columns
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT;

ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN DEFAULT FALSE;

ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS anomaly_score FLOAT;

ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS anomaly_reason TEXT;

-- Add metadata column for tracking
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add text_feedback column (in addition to comments)
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS text_feedback TEXT;

-- Add submission_date column (in addition to submitted_at)
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add processing status columns
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Copy data from submitted_at to submission_date if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluations' 
        AND column_name = 'submitted_at'
    ) THEN
        UPDATE evaluations 
        SET submission_date = submitted_at 
        WHERE submission_date IS NULL AND submitted_at IS NOT NULL;
        
        RAISE NOTICE '✅ Copied submitted_at to submission_date';
    END IF;
END $$;

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Added missing columns to evaluations table';
END $$;

-- ==================================================
-- PART 3: CREATE PERFORMANCE INDEXES
-- ==================================================
DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE 'PART 3: Creating performance indexes...';
END $$;

-- Index for JSONB ratings column (GIN index for fast JSON queries)
CREATE INDEX IF NOT EXISTS idx_evaluations_ratings 
ON evaluations USING GIN (ratings);

-- Index for sentiment analysis queries
CREATE INDEX IF NOT EXISTS idx_evaluations_sentiment 
ON evaluations (sentiment, sentiment_score);

-- Index for anomaly detection queries
CREATE INDEX IF NOT EXISTS idx_evaluations_anomaly 
ON evaluations (is_anomaly, anomaly_score);

-- Index for processing status queries
CREATE INDEX IF NOT EXISTS idx_evaluations_processing 
ON evaluations (processing_status, processed_at);

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Created performance indexes';
END $$;

-- ==================================================
-- PART 4: ADD COLUMN DOCUMENTATION
-- ==================================================
DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE 'PART 4: Adding column documentation...';
END $$;

COMMENT ON COLUMN evaluations.ratings IS 'JSONB object storing all 21 question responses. Format: {"1": 4, "2": 3, ...}';
COMMENT ON COLUMN evaluations.sentiment_score IS 'ML confidence score for sentiment analysis (0.0 to 1.0)';
COMMENT ON COLUMN evaluations.is_anomaly IS 'Flag indicating if evaluation was detected as anomalous';
COMMENT ON COLUMN evaluations.anomaly_score IS 'ML confidence score for anomaly detection (0.0 to 1.0)';
COMMENT ON COLUMN evaluations.anomaly_reason IS 'Explanation of why evaluation was flagged as anomalous';
COMMENT ON COLUMN evaluations.metadata IS 'JSONB object for tracking submission metadata (IP, device, etc.)';
COMMENT ON COLUMN evaluations.text_feedback IS 'Additional text feedback from student (same as comments)';
COMMENT ON COLUMN evaluations.processing_status IS 'Status of ML processing: pending, processing, completed, failed';
COMMENT ON COLUMN courses.units IS 'Number of credit units for the course (e.g., 3.0)';

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Added column documentation';
END $$;

-- ==================================================
-- PART 5: VERIFICATION QUERIES
-- ==================================================
DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'DATABASE SCHEMA UPGRADE COMPLETE!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Running verification queries...';
END $$;

-- Show new columns in evaluations table
SELECT 
    'evaluations' AS table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'evaluations'
AND column_name IN ('ratings', 'sentiment_score', 'is_anomaly', 'anomaly_score', 
                     'anomaly_reason', 'metadata', 'text_feedback', 
                     'submission_date', 'processing_status', 'processed_at')
ORDER BY ordinal_position;

-- Show courses table structure
SELECT 
    'courses' AS table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'courses'
AND column_name IN ('semester', 'units')
ORDER BY ordinal_position;

-- Show indexes created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'evaluations'
AND indexname LIKE 'idx_evaluations_%'
ORDER BY indexname;

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '✅ Verification complete! Check the query results above.';
    RAISE NOTICE '✅ Now restart your backend server to use the new schema.';
END $$;
