-- ===============================================
-- DATABASE TRIGGERS
-- Purpose: Automated actions and data synchronization
-- Triggers: Firebase sync, timestamp updates
-- ===============================================

-- ================================================
-- 1. FIREBASE SYNC TRIGGER FUNCTION
-- Purpose: Log changes for Firebase real-time synchronization
-- Use Case: Track evaluation changes for mobile app sync
-- ================================================

CREATE OR REPLACE FUNCTION trigger_firebase_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert sync record for Firebase real-time updates
    INSERT INTO firebase_sync_log (table_name, record_id, sync_type, firebase_doc_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NEW.firebase_doc_id);
    
    -- Update analysis results asynchronously (would be handled by your Python service)
    -- This trigger just logs the need for re-processing
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Firebase sync trigger to evaluations table
DROP TRIGGER IF EXISTS evaluation_firebase_sync ON evaluations;
CREATE TRIGGER evaluation_firebase_sync
    AFTER INSERT OR UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_firebase_sync();

-- ================================================
-- 2. EVALUATION PERIOD TIMESTAMP UPDATE TRIGGER
-- Purpose: Automatically update updated_at timestamp on evaluation periods
-- Use Case: Track when evaluation periods are modified
-- ================================================

CREATE OR REPLACE FUNCTION update_evaluation_period_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evaluation_period_update_timestamp ON evaluation_periods;
CREATE TRIGGER evaluation_period_update_timestamp
    BEFORE UPDATE ON evaluation_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluation_period_timestamp();

-- ================================================
-- 3. DEPARTMENT TIMESTAMP UPDATE TRIGGER
-- Purpose: Automatically update updated_at timestamp on departments
-- Use Case: Track when departments are modified
-- ================================================

CREATE OR REPLACE FUNCTION update_department_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS department_update_timestamp ON departments;
CREATE TRIGGER department_update_timestamp
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_department_timestamp();

-- ================================================
-- VERIFICATION QUERY
-- ================================================

-- List all triggers
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation as trigger_event,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN (
    'evaluation_firebase_sync',
    'evaluation_period_update_timestamp',
    'department_update_timestamp'
)
ORDER BY event_object_table, trigger_name;
