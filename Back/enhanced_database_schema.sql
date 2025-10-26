-- Enhanced Course Evaluation Database Schema
-- Hybrid PostgreSQL + Firebase Architecture
-- Run this script in pgAdmin 4 Query Tool

-- ===============================================
-- ENHANCEMENTS TO YOUR EXISTING SCHEMA
-- ===============================================

-- Add missing columns to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE;

-- Update users table to match hybrid requirements
ALTER TABLE users 
ALTER COLUMN role TYPE VARCHAR(50),
DROP CONSTRAINT IF EXISTS users_role_check,
ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'instructor', 'department_head', 'admin'));

-- Add instructor support to users (since you need instructors in class_sections)
-- This replaces the instructor_name string with a proper foreign key

-- First, add instructor_id to class_sections
ALTER TABLE class_sections 
ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS firebase_sync_id VARCHAR(255); -- For real-time sync

-- ===============================================
-- ENHANCED EVALUATIONS TABLE FOR ML PROCESSING
-- ===============================================

-- Add ML and sentiment analysis columns to your existing evaluations table
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS text_feedback TEXT, -- For sentiment analysis
ADD COLUMN IF NOT EXISTS suggestions TEXT,
ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT CHECK (sentiment_score BETWEEN 0 AND 1),
ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS anomaly_score FLOAT,
ADD COLUMN IF NOT EXISTS submission_ip VARCHAR(45), -- For audit trail
ADD COLUMN IF NOT EXISTS firebase_doc_id VARCHAR(255), -- Firebase real-time sync
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'flagged')),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- ===============================================
-- NEW TABLES FOR ML AND ANALYTICS
-- ===============================================

-- Analysis results table for aggregated ML processing
CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    class_section_id INTEGER REFERENCES class_sections(id),
    analysis_type VARCHAR(50) NOT NULL, -- 'sentiment', 'anomaly', 'trend'
    
    -- Aggregated Results
    total_evaluations INTEGER DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    anomaly_count INTEGER DEFAULT 0,
    
    -- Statistical Measures
    avg_overall_rating FLOAT,
    avg_sentiment_score FLOAT,
    confidence_interval FLOAT,
    
    -- Detailed Results (JSON format for flexibility)
    detailed_results JSONB,
    
    -- Metadata
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(20),
    processing_time_ms INTEGER
);

-- Create unique index separately (PostgreSQL doesn't support function calls in table constraints)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_analysis_per_class_type 
ON analysis_results(class_section_id, analysis_type, (analysis_date::date));

-- Firebase sync tracking table
CREATE TABLE IF NOT EXISTS firebase_sync_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    firebase_doc_id VARCHAR(255),
    sync_type VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Notification queue for push notifications
CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL, -- 'anomaly_alert', 'evaluation_complete', 'dashboard_update'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional notification data
    firebase_token VARCHAR(500), -- FCM token
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- PERFORMANCE INDEXES FOR ANALYTICS
-- ===============================================

-- Additional indexes for ML and analytics performance
CREATE INDEX IF NOT EXISTS idx_evaluations_sentiment ON evaluations(sentiment, sentiment_score);
CREATE INDEX IF NOT EXISTS idx_evaluations_anomaly ON evaluations(is_anomaly, anomaly_score);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(submission_date);
CREATE INDEX IF NOT EXISTS idx_evaluations_processing ON evaluations(processing_status, processed_at);
CREATE INDEX IF NOT EXISTS idx_analysis_results_date ON analysis_results(analysis_date);
CREATE INDEX IF NOT EXISTS idx_analysis_results_type ON analysis_results(analysis_type, class_section_id);
CREATE INDEX IF NOT EXISTS idx_firebase_sync ON firebase_sync_log(table_name, record_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notification_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_class_sections_instructor ON class_sections(instructor_id);

-- ===============================================
-- ENHANCED VIEWS FOR ANALYTICS
-- ===============================================

-- Comprehensive evaluation analytics view
CREATE OR REPLACE VIEW evaluation_analytics AS
SELECT 
    cs.id as class_section_id,
    cs.class_code,
    c.course_name,
    c.course_code,
    p.name as program_name,
    CONCAT(u.first_name, ' ', u.last_name) as instructor_name,
    cs.semester,
    cs.academic_year,
    
    -- Basic statistics
    COUNT(e.id) as total_evaluations,
    ROUND(AVG(e.rating_overall)::numeric, 2) as avg_overall_rating,
    ROUND(AVG(e.rating_teaching)::numeric, 2) as avg_teaching_rating,
    ROUND(AVG(e.rating_content)::numeric, 2) as avg_content_rating,
    ROUND(AVG(e.rating_engagement)::numeric, 2) as avg_engagement_rating,
    
    -- Sentiment analysis
    COUNT(CASE WHEN e.sentiment = 'positive' THEN 1 END) as positive_count,
    COUNT(CASE WHEN e.sentiment = 'neutral' THEN 1 END) as neutral_count,
    COUNT(CASE WHEN e.sentiment = 'negative' THEN 1 END) as negative_count,
    ROUND(AVG(e.sentiment_score)::numeric, 3) as avg_sentiment_score,
    
    -- Anomaly detection
    COUNT(CASE WHEN e.is_anomaly = true THEN 1 END) as anomaly_count,
    ROUND((COUNT(CASE WHEN e.is_anomaly = true THEN 1 END)::float / COUNT(e.id) * 100)::numeric, 2) as anomaly_percentage,
    
    -- Response rate
    cs.max_students,
    ROUND((COUNT(e.id)::float / cs.max_students * 100)::numeric, 2) as response_rate_percentage
    
FROM class_sections cs
JOIN courses c ON cs.course_id = c.id
JOIN programs p ON c.program_id = p.id
LEFT JOIN users u ON cs.instructor_id = u.id
LEFT JOIN evaluations e ON cs.id = e.class_section_id
GROUP BY cs.id, cs.class_code, c.course_name, c.course_code, p.name, u.first_name, u.last_name, cs.semester, cs.academic_year, cs.max_students;

-- Department overview for department heads
CREATE OR REPLACE VIEW department_overview AS
SELECT 
    p.name as program_name,
    p.code as program_code,
    COUNT(DISTINCT cs.id) as total_classes,
    COUNT(DISTINCT c.id) as total_courses,
    COUNT(DISTINCT e.id) as total_evaluations,
    ROUND(AVG(e.rating_overall)::numeric, 2) as avg_program_rating,
    COUNT(CASE WHEN e.sentiment = 'positive' THEN 1 END) as positive_feedback,
    COUNT(CASE WHEN e.sentiment = 'negative' THEN 1 END) as negative_feedback,
    COUNT(CASE WHEN e.is_anomaly = true THEN 1 END) as total_anomalies
FROM programs p
LEFT JOIN courses c ON p.id = c.program_id
LEFT JOIN class_sections cs ON c.id = cs.course_id
LEFT JOIN evaluations e ON cs.id = e.class_section_id
GROUP BY p.id, p.name, p.code;

-- ===============================================
-- TRIGGER FUNCTIONS FOR REAL-TIME SYNC
-- ===============================================

-- Function to handle Firebase sync after evaluation insert/update
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

-- Apply triggers
DROP TRIGGER IF EXISTS evaluation_firebase_sync ON evaluations;
CREATE TRIGGER evaluation_firebase_sync
    AFTER INSERT OR UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_firebase_sync();

-- ===============================================
-- SAMPLE DATA FOR TESTING
-- ===============================================

-- Add sample instructor user (only if firebase_uid column exists)
DO $$
BEGIN
    INSERT INTO users (email, password_hash, role, first_name, last_name, firebase_uid) 
    VALUES ('instructor@lpu.edu.ph', '$2b$12$sample_hash', 'instructor', 'John', 'Doe', 'firebase_uid_123')
    ON CONFLICT (email) DO NOTHING;
EXCEPTION
    WHEN undefined_column THEN
        INSERT INTO users (email, password_hash, role, first_name, last_name) 
        VALUES ('instructor@lpu.edu.ph', '$2b$12$sample_hash', 'instructor', 'John', 'Doe')
        ON CONFLICT (email) DO NOTHING;
END $$;

-- Add sample admin user (only if firebase_uid column exists)
DO $$
BEGIN
    INSERT INTO users (email, password_hash, role, first_name, last_name, firebase_uid)
    VALUES ('admin@lpu.edu.ph', '$2b$12$sample_hash', 'admin', 'Admin', 'User', 'firebase_uid_admin')
    ON CONFLICT (email) DO NOTHING;
EXCEPTION
    WHEN undefined_column THEN
        INSERT INTO users (email, password_hash, role, first_name, last_name)
        VALUES ('admin@lpu.edu.ph', '$2b$12$sample_hash', 'admin', 'Admin', 'User')
        ON CONFLICT (email) DO NOTHING;
END $$;

-- Update a sample class section with instructor
UPDATE class_sections 
SET instructor_id = (SELECT id FROM users WHERE email = 'instructor@lpu.edu.ph' LIMIT 1)
WHERE instructor_id IS NULL AND id = 1;

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Check your enhanced schema
SELECT 
    'users' as table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify the evaluation_analytics view
SELECT * FROM evaluation_analytics LIMIT 5;

-- Check if all indexes are created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('evaluations', 'class_sections', 'analysis_results')
ORDER BY tablename, indexname;

-- ================================================
-- SECRETARY USER MANAGEMENT SYSTEM
-- For Department-Wide Data Access
-- ================================================

-- 1. Add secretary role to user role constraint
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check,
ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'instructor', 'department_head', 'admin', 'secretary'));

-- 2. Add department_id and access control to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department_id INTEGER,
ADD COLUMN IF NOT EXISTS can_access_department_data BOOLEAN DEFAULT FALSE;

-- Add missing columns to students table for secretary functionality
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS department_id INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS year_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS program VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS student_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add missing columns to courses table for secretary functionality
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Create departments table if not exists
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(10) NOT NULL UNIQUE,
    college VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Add foreign key constraints
ALTER TABLE users 
ADD CONSTRAINT fk_users_department 
FOREIGN KEY (department_id) REFERENCES departments(department_id);

ALTER TABLE students 
ADD CONSTRAINT fk_students_department 
FOREIGN KEY (department_id) REFERENCES departments(department_id);

-- 5. Insert sample departments (adjust based on your institution)
INSERT INTO departments (department_name, department_code, college) VALUES
('Computer Science', 'CS', 'College of Engineering'),
('Information Technology', 'IT', 'College of Engineering'),
('Business Administration', 'BA', 'College of Business'),
('Education', 'EDUC', 'College of Education'),
('Engineering', 'ENG', 'College of Engineering')
ON CONFLICT (department_code) DO NOTHING;

-- 6. Create secretary users table for extended secretary information
CREATE TABLE IF NOT EXISTS secretary_users (
    secretary_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER NOT NULL REFERENCES departments(department_id),
    access_level VARCHAR(20) DEFAULT 'department' CHECK (access_level IN ('department', 'college', 'university')),
    can_view_evaluations BOOLEAN DEFAULT TRUE,
    can_view_analytics BOOLEAN DEFAULT TRUE,
    can_export_data BOOLEAN DEFAULT TRUE,
    assigned_by INTEGER REFERENCES users(id), -- Admin who assigned secretary access
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT unique_secretary_per_user UNIQUE(user_id),
    CONSTRAINT unique_secretary_per_department UNIQUE(department_id) -- One secretary per department
);

-- 7. Create view for secretary department data access
CREATE OR REPLACE VIEW secretary_department_overview AS
SELECT 
    s.secretary_id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as secretary_name,
    d.department_name,
    d.department_code,
    s.access_level,
    s.can_view_evaluations,
    s.can_view_analytics,
    s.can_export_data,
    s.is_active,
    -- Count statistics
    (SELECT COUNT(*) FROM users u2 WHERE u2.department_id = s.department_id AND u2.role = 'instructor') as total_instructors,
    (SELECT COUNT(*) FROM students st WHERE st.department_id = s.department_id AND st.is_active = TRUE) as total_students,
    (SELECT COUNT(DISTINCT c.id) 
     FROM courses c 
     JOIN class_sections cs ON c.id = cs.course_id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = s.department_id) as total_courses
FROM secretary_users s
JOIN users u ON s.user_id = u.id
JOIN departments d ON s.department_id = d.department_id
WHERE s.is_active = TRUE;

-- 8. Function to get all department data for secretary
CREATE OR REPLACE FUNCTION get_secretary_department_data(secretary_user_id INTEGER)
RETURNS TABLE (
    data_type VARCHAR,
    total_count BIGINT,
    details JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    secretary_dept_id INTEGER;
BEGIN
    -- Get secretary's department
    SELECT department_id INTO secretary_dept_id
    FROM secretary_users su
    JOIN users u ON su.user_id = u.id
    WHERE u.id = secretary_user_id AND su.is_active = TRUE;
    
    IF secretary_dept_id IS NULL THEN
        RAISE EXCEPTION 'User is not an active secretary or does not exist';
    END IF;
    
    -- Return instructors data
    RETURN QUERY
    SELECT 
        'instructors'::VARCHAR as data_type,
        COUNT(*)::BIGINT as total_count,
        jsonb_agg(
            jsonb_build_object(
                'user_id', u.id,
                'email', u.email,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'created_at', u.created_at
            )
        ) as details
    FROM users u
    WHERE u.department_id = secretary_dept_id 
    AND u.role = 'instructor' 
    AND u.is_active = TRUE;
    
    -- Return students data
    RETURN QUERY
    SELECT 
        'students'::VARCHAR as data_type,
        COUNT(*)::BIGINT as total_count,
        jsonb_agg(
            jsonb_build_object(
                'student_id', s.id,
                'student_number', s.student_number,
                'first_name', s.first_name,
                'last_name', s.last_name,
                'year_level', s.year_level,
                'program', s.program,
                'email', s.email
            )
        ) as details
    FROM students s
    WHERE s.department_id = secretary_dept_id AND s.is_active = TRUE;
    
    -- Return courses data
    RETURN QUERY
    SELECT 
        'courses'::VARCHAR as data_type,
        COUNT(*)::BIGINT as total_count,
        jsonb_agg(
            jsonb_build_object(
                'course_id', c.id,
                'course_code', c.course_code,
                'course_name', c.course_name,
                'instructor_name', u.first_name || ' ' || u.last_name,
                'semester', cs.semester,
                'academic_year', cs.academic_year,
                'created_at', c.created_at
            )
        ) as details
    FROM courses c
    JOIN class_sections cs ON c.id = cs.course_id
    JOIN users u ON cs.instructor_id = u.id
    WHERE u.department_id = secretary_dept_id AND c.is_active = TRUE;
    
    -- Return evaluations data
    RETURN QUERY
    SELECT 
        'evaluations'::VARCHAR as data_type,
        COUNT(*)::BIGINT as total_count,
        jsonb_agg(
            jsonb_build_object(
                'evaluation_id', e.id,
                'course_code', c.course_code,
                'course_name', c.course_name,
                'instructor_name', u.first_name || ' ' || u.last_name,
                'student_name', s.first_name || ' ' || s.last_name,
                'overall_rating', e.rating_overall,
                'sentiment', e.sentiment,
                'created_at', e.submission_date
            )
        ) as details
    FROM evaluations e
    JOIN class_sections cs ON e.class_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    JOIN users u ON cs.instructor_id = u.id
    JOIN students s ON e.student_id = s.id
    WHERE u.department_id = secretary_dept_id;
    
END;
$$;

-- 9. Function to create secretary user
CREATE OR REPLACE FUNCTION create_secretary_user(
    p_email VARCHAR,
    p_password VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_department_id INTEGER,
    p_assigned_by INTEGER,
    p_access_level VARCHAR DEFAULT 'department'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_user_id INTEGER;
    new_secretary_id INTEGER;
BEGIN
    -- Create user
    INSERT INTO users (
        email, password_hash, first_name, last_name, 
        role, department_id, can_access_department_data, is_active
    ) VALUES (
        p_email, p_password, p_first_name, p_last_name,
        'secretary', p_department_id, TRUE, TRUE
    ) RETURNING id INTO new_user_id;
    
    -- Create secretary record
    INSERT INTO secretary_users (
        user_id, department_id, access_level, assigned_by
    ) VALUES (
        new_user_id, p_department_id, p_access_level, p_assigned_by
    ) RETURNING secretary_id INTO new_secretary_id;
    
    RETURN new_secretary_id;
END;
$$;

-- 10. Views for secretary dashboard
CREATE OR REPLACE VIEW secretary_dashboard_stats AS
SELECT 
    su.secretary_id,
    d.department_name,
    d.department_code,
    
    -- Instructor statistics
    (SELECT COUNT(*) FROM users u2 WHERE u2.department_id = su.department_id AND u2.role = 'instructor' AND u2.is_active = TRUE) as active_instructors,
    
    -- Student statistics  
    (SELECT COUNT(*) FROM students st WHERE st.department_id = su.department_id AND st.is_active = TRUE) as active_students,
    
    -- Course statistics
    (SELECT COUNT(DISTINCT c.id) 
     FROM courses c 
     JOIN class_sections cs ON c.id = cs.course_id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id AND c.is_active = TRUE) as active_courses,
     
    -- Evaluation statistics
    (SELECT COUNT(*) 
     FROM evaluations e 
     JOIN class_sections cs ON e.class_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id) as total_evaluations,
     
    -- Recent evaluations (last 30 days)
    (SELECT COUNT(*) 
     FROM evaluations e 
     JOIN class_sections cs ON e.class_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id 
     AND e.submission_date >= CURRENT_DATE - INTERVAL '30 days') as recent_evaluations,
     
    -- Average rating
    (SELECT ROUND(AVG(e.rating_overall), 2) 
     FROM evaluations e 
     JOIN class_sections cs ON e.class_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id) as avg_department_rating
     
FROM secretary_users su
JOIN departments d ON su.department_id = d.department_id
WHERE su.is_active = TRUE;

-- 11. Security function to check secretary access
CREATE OR REPLACE FUNCTION check_secretary_access(
    p_user_id INTEGER,
    p_requested_data_type VARCHAR,
    p_target_department_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    secretary_dept_id INTEGER;
    access_level VARCHAR;
    has_access BOOLEAN := FALSE;
BEGIN
    -- Get secretary information
    SELECT su.department_id, su.access_level
    INTO secretary_dept_id, access_level
    FROM secretary_users su
    JOIN users u ON su.user_id = u.id
    WHERE u.id = p_user_id AND su.is_active = TRUE;
    
    -- If not a secretary, deny access
    IF secretary_dept_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check access based on level
    IF access_level = 'university' THEN
        has_access := TRUE;
    ELSIF access_level = 'college' THEN
        -- Can access same college departments (implement college logic if needed)
        has_access := TRUE;
    ELSIF access_level = 'department' THEN
        -- Can only access own department
        IF p_target_department_id IS NULL OR p_target_department_id = secretary_dept_id THEN
            has_access := TRUE;
        END IF;
    END IF;
    
    RETURN has_access;
END;
$$;

-- 12. Indexes for secretary performance
CREATE INDEX IF NOT EXISTS idx_users_department_role ON users(department_id, role);
CREATE INDEX IF NOT EXISTS idx_secretary_users_department ON secretary_users(department_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department_id);

-- 13. Sample secretary user creation (uncomment and adjust as needed)
-- SELECT create_secretary_user(
--     'secretary@cs.university.edu', 
--     '$2b$12$hashed_password_here', 
--     'Jane', 
--     'Smith', 
--     1, -- CS department ID
--     (SELECT id FROM users WHERE role = 'admin' LIMIT 1), -- Admin user ID who assigns
--     'department'
-- );

-- ================================================
-- USAGE EXAMPLES FOR SECRETARY SYSTEM
-- ================================================

-- Example 1: Get all department data for secretary
-- SELECT * FROM get_secretary_department_data(secretary_user_id);

-- Example 2: Get dashboard stats for a secretary
-- SELECT * FROM secretary_dashboard_stats WHERE secretary_id = 1;

-- Example 3: Check if secretary can access specific data
-- SELECT check_secretary_access(secretary_user_id, 'evaluations', target_dept_id);

-- Example 4: View all secretaries and their departments
-- SELECT * FROM secretary_department_overview;

show port
select current_user