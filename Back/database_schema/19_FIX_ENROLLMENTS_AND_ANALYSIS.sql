-- Migration 19: Fix enrollments and analysis_results schema issues

-- 1. Fix analysis_results table - remove confidence_interval column if it exists in queries
-- The column doesn't exist in the actual table, so we don't need it

-- 2. Add status column to enrollments if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'status'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN status VARCHAR(20) DEFAULT 'enrolled';
    END IF;
END $$;

-- 3. Rename enrollment_date to enrolled_at if needed for consistency
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'enrollment_date'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'enrolled_at'
    ) THEN
        ALTER TABLE enrollments RENAME COLUMN enrollment_date TO enrolled_at;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'enrolled_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'enrollment_date'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN enrolled_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- 4. Drop existing constraint if it exists and recreate with correct values
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'enrollments_status_check'
    ) THEN
        ALTER TABLE enrollments DROP CONSTRAINT enrollments_status_check;
    END IF;
    
    ALTER TABLE enrollments 
    ADD CONSTRAINT enrollments_status_check 
    CHECK (status IN ('enrolled', 'active', 'dropped', 'completed'));
END $$;

-- 5. Update any NULL status values to 'enrolled'
UPDATE enrollments SET status = 'enrolled' WHERE status IS NULL;
