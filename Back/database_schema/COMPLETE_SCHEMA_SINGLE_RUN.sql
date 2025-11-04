-- ===============================================
-- COMPLETE DATABASE SCHEMA - SINGLE RUN FILE
-- Course Evaluation System - Fresh Database Setup
-- Run this entire file in Supabase SQL Editor
-- ===============================================

-- ================================================
-- PART 1: BASE TABLES (Create from scratch)
-- ================================================

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    department VARCHAR(100),
    department_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    firebase_uid VARCHAR(255) UNIQUE,
    can_access_department_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('student', 'instructor', 'department_head', 'admin', 'secretary'))
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    student_number VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    year_level VARCHAR(20),
    program VARCHAR(100),
    department_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    units INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class sections table
CREATE TABLE IF NOT EXISTS class_sections (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    class_code VARCHAR(50) NOT NULL UNIQUE,
    instructor_id INTEGER REFERENCES users(id),
    semester VARCHAR(20),
    academic_year VARCHAR(20),
    max_students INTEGER,
    firebase_sync_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_section_id INTEGER REFERENCES class_sections(id),
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    UNIQUE(student_id, class_section_id)
);

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_section_id INTEGER REFERENCES class_sections(id),
    rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5),
    rating_teaching INTEGER CHECK (rating_teaching BETWEEN 1 AND 5),
    rating_content INTEGER CHECK (rating_content BETWEEN 1 AND 5),
    rating_engagement INTEGER CHECK (rating_engagement BETWEEN 1 AND 5),
    text_feedback TEXT,
    suggestions TEXT,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score FLOAT CHECK (sentiment_score BETWEEN 0 AND 1),
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_score FLOAT,
    submission_ip VARCHAR(45),
    firebase_doc_id VARCHAR(255),
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'flagged')),
    processed_at TIMESTAMP,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_section_id)
);

-- ================================================
-- PART 2: ML & ANALYTICS TABLES
-- ================================================

-- Analysis results table
CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    class_section_id INTEGER REFERENCES class_sections(id),
    analysis_type VARCHAR(50) NOT NULL,
    total_evaluations INTEGER DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    anomaly_count INTEGER DEFAULT 0,
    avg_overall_rating FLOAT,
    avg_sentiment_score FLOAT,
    confidence_interval FLOAT,
    detailed_results JSONB,
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(20),
    processing_time_ms INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_analysis_per_class_type 
ON analysis_results(class_section_id, analysis_type, (analysis_date::date));

-- Firebase sync log table
CREATE TABLE IF NOT EXISTS firebase_sync_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    firebase_doc_id VARCHAR(255),
    sync_type VARCHAR(20) NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'pending',
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    firebase_token VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PART 3: ADMIN TABLES
-- ================================================

-- Evaluation periods table
CREATE TABLE IF NOT EXISTS evaluation_periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('1st', '2nd', 'summer', 'midyear')),
    academic_year VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    is_active BOOLEAN DEFAULT FALSE,
    reminder_days_before INTEGER DEFAULT 3,
    send_reminders BOOLEAN DEFAULT TRUE,
    total_evaluations INTEGER DEFAULT 0,
    completed_evaluations INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index for active periods (only one active period per semester/year)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_period 
ON evaluation_periods(academic_year, semester) 
WHERE is_active = TRUE;

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_encrypted BOOLEAN DEFAULT FALSE,
    description TEXT,
    validation_rules JSONB,
    default_value TEXT,
    last_modified_by INTEGER REFERENCES users(id),
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_setting_key UNIQUE(category, setting_key)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    entity_name VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    changes_summary TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
    details JSONB,
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    correlation_id VARCHAR(255)
);

-- Export history table
CREATE TABLE IF NOT EXISTS export_history (
    id SERIAL PRIMARY KEY,
    export_type VARCHAR(50) NOT NULL,
    export_format VARCHAR(20) NOT NULL,
    exported_by INTEGER REFERENCES users(id),
    user_email VARCHAR(255),
    filters JSONB,
    date_range_start DATE,
    date_range_end DATE,
    total_records INTEGER,
    file_size_bytes BIGINT,
    file_name VARCHAR(255),
    file_path TEXT,
    download_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    ip_address VARCHAR(45),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- ================================================
-- PART 4: SECRETARY SYSTEM
-- ================================================

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(10) NOT NULL UNIQUE,
    college VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Secretary users table
CREATE TABLE IF NOT EXISTS secretary_users (
    secretary_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER NOT NULL REFERENCES departments(department_id),
    access_level VARCHAR(20) DEFAULT 'department' CHECK (access_level IN ('department', 'college', 'university')),
    can_view_evaluations BOOLEAN DEFAULT TRUE,
    can_view_analytics BOOLEAN DEFAULT TRUE,
    can_export_data BOOLEAN DEFAULT TRUE,
    assigned_by INTEGER REFERENCES users(id),
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_secretary_per_user UNIQUE(user_id),
    CONSTRAINT unique_secretary_per_department UNIQUE(department_id)
);

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_department') THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_department 
        FOREIGN KEY (department_id) REFERENCES departments(department_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_students_department') THEN
        ALTER TABLE students 
        ADD CONSTRAINT fk_students_department 
        FOREIGN KEY (department_id) REFERENCES departments(department_id);
    END IF;
END $$;

-- ================================================
-- PART 5: INSERT DEFAULT DATA
-- ================================================

-- Insert sample departments
INSERT INTO departments (department_name, department_code, college) VALUES
('Computer Science', 'CS', 'College of Engineering'),
('Information Technology', 'IT', 'College of Engineering'),
('Business Administration', 'BA', 'College of Business'),
('Education', 'EDUC', 'College of Education'),
('Engineering', 'ENG', 'College of Engineering')
ON CONFLICT (department_code) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (category, setting_key, setting_value, data_type, description, default_value) VALUES
('general', 'site_name', 'Course Evaluation System', 'string', 'Name of the application', 'Course Evaluation System'),
('general', 'site_description', 'AI-powered course feedback and analytics', 'string', 'Site description', 'Course Evaluation System'),
('general', 'maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', 'false'),
('general', 'allow_registration', 'false', 'boolean', 'Allow new user registration', 'false'),
('general', 'default_language', 'en', 'string', 'Default system language', 'en'),
('general', 'timezone', 'Asia/Manila', 'string', 'System timezone', 'Asia/Manila'),
('general', 'items_per_page', '20', 'number', 'Default pagination size', '20'),
('email', 'smtp_host', '', 'string', 'SMTP server hostname', ''),
('email', 'smtp_port', '587', 'number', 'SMTP server port', '587'),
('email', 'smtp_username', '', 'string', 'SMTP username', ''),
('email', 'smtp_password', '', 'string', 'SMTP password (encrypted)', ''),
('email', 'smtp_use_tls', 'true', 'boolean', 'Use TLS for SMTP', 'true'),
('email', 'from_email', 'noreply@university.edu', 'string', 'Default sender email', 'noreply@university.edu'),
('email', 'from_name', 'Course Evaluation System', 'string', 'Default sender name', 'Course Evaluation System'),
('email', 'enable_notifications', 'true', 'boolean', 'Enable email notifications', 'true'),
('security', 'session_timeout', '30', 'number', 'Session timeout in minutes', '30'),
('security', 'password_min_length', '8', 'number', 'Minimum password length', '8'),
('security', 'password_require_uppercase', 'true', 'boolean', 'Require uppercase in password', 'true'),
('security', 'password_require_lowercase', 'true', 'boolean', 'Require lowercase in password', 'true'),
('security', 'password_require_numbers', 'true', 'boolean', 'Require numbers in password', 'true'),
('security', 'password_require_special', 'false', 'boolean', 'Require special characters in password', 'false'),
('security', 'max_login_attempts', '5', 'number', 'Maximum failed login attempts', '5'),
('security', 'lockout_duration', '15', 'number', 'Account lockout duration in minutes', '15'),
('security', 'enable_2fa', 'false', 'boolean', 'Enable two-factor authentication', 'false'),
('security', 'enable_audit_logs', 'true', 'boolean', 'Enable audit logging', 'true'),
('backup', 'auto_backup_enabled', 'true', 'boolean', 'Enable automatic backups', 'true'),
('backup', 'backup_frequency', 'daily', 'string', 'Backup frequency (daily, weekly, monthly)', 'daily'),
('backup', 'backup_retention_days', '30', 'number', 'Number of days to retain backups', '30'),
('backup', 'backup_time', '02:00', 'string', 'Time to run backups (HH:MM)', '02:00'),
('backup', 'backup_location', '/backups', 'string', 'Backup storage location', '/backups'),
('notifications', 'enable_push_notifications', 'true', 'boolean', 'Enable push notifications', 'true'),
('notifications', 'enable_email_notifications', 'true', 'boolean', 'Enable email notifications', 'true'),
('notifications', 'notify_on_evaluation_submit', 'true', 'boolean', 'Notify when evaluation submitted', 'true'),
('notifications', 'notify_on_period_start', 'true', 'boolean', 'Notify when evaluation period starts', 'true'),
('notifications', 'notify_on_period_end', 'true', 'boolean', 'Notify when evaluation period ends', 'true'),
('notifications', 'notify_on_anomaly_detected', 'true', 'boolean', 'Notify when anomaly detected', 'true')
ON CONFLICT (category, setting_key) DO NOTHING;

-- ================================================
-- PART 6: VIEWS
-- ================================================

-- Evaluation analytics view
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
    COUNT(e.id) as total_evaluations,
    ROUND(AVG(e.rating_overall)::numeric, 2) as avg_overall_rating,
    ROUND(AVG(e.rating_teaching)::numeric, 2) as avg_teaching_rating,
    ROUND(AVG(e.rating_content)::numeric, 2) as avg_content_rating,
    ROUND(AVG(e.rating_engagement)::numeric, 2) as avg_engagement_rating,
    COUNT(CASE WHEN e.sentiment = 'positive' THEN 1 END) as positive_count,
    COUNT(CASE WHEN e.sentiment = 'neutral' THEN 1 END) as neutral_count,
    COUNT(CASE WHEN e.sentiment = 'negative' THEN 1 END) as negative_count,
    ROUND(AVG(e.sentiment_score)::numeric, 3) as avg_sentiment_score,
    COUNT(CASE WHEN e.is_anomaly = true THEN 1 END) as anomaly_count,
    ROUND((COUNT(CASE WHEN e.is_anomaly = true THEN 1 END)::float / NULLIF(COUNT(e.id), 0) * 100)::numeric, 2) as anomaly_percentage,
    cs.max_students,
    ROUND((COUNT(e.id)::float / NULLIF(cs.max_students, 0) * 100)::numeric, 2) as response_rate_percentage
FROM class_sections cs
JOIN courses c ON cs.course_id = c.id
JOIN programs p ON c.program_id = p.id
LEFT JOIN users u ON cs.instructor_id = u.id
LEFT JOIN evaluations e ON cs.id = e.class_section_id
GROUP BY cs.id, cs.class_code, c.course_name, c.course_code, p.name, u.first_name, u.last_name, cs.semester, cs.academic_year, cs.max_students;

-- Department overview view
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

-- Audit log summary view
CREATE OR REPLACE VIEW audit_log_summary AS
SELECT 
    DATE(timestamp) as log_date,
    action,
    entity_type,
    user_role,
    COUNT(*) as action_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_actions,
    COUNT(CASE WHEN severity IN ('error', 'critical') THEN 1 END) as error_count
FROM audit_logs
GROUP BY DATE(timestamp), action, entity_type, user_role
ORDER BY log_date DESC, action_count DESC;

-- Settings by category view
CREATE OR REPLACE VIEW settings_by_category AS
SELECT 
    category,
    COUNT(*) as setting_count,
    COUNT(CASE WHEN setting_value IS NOT NULL AND setting_value != '' THEN 1 END) as configured_count,
    MAX(last_modified_at) as last_updated
FROM system_settings
GROUP BY category;

-- Export statistics view
CREATE OR REPLACE VIEW export_statistics AS
SELECT 
    export_type,
    export_format,
    COUNT(*) as total_exports,
    SUM(total_records) as total_records_exported,
    SUM(file_size_bytes) as total_size_bytes,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_exports,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_exports,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
FROM export_history
WHERE is_deleted = FALSE
GROUP BY export_type, export_format;

-- Secretary department overview view
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

-- Secretary dashboard stats view
CREATE OR REPLACE VIEW secretary_dashboard_stats AS
SELECT 
    su.secretary_id,
    d.department_name,
    d.department_code,
    (SELECT COUNT(*) FROM users u2 WHERE u2.department_id = su.department_id AND u2.role = 'instructor' AND u2.is_active = TRUE) as active_instructors,
    (SELECT COUNT(*) FROM students st WHERE st.department_id = su.department_id AND st.is_active = TRUE) as active_students,
    (SELECT COUNT(DISTINCT c.id) 
     FROM courses c 
     JOIN class_sections cs ON c.id = cs.course_id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id AND c.is_active = TRUE) as active_courses,
    (SELECT COUNT(*) 
     FROM evaluations e 
     JOIN class_sections cs ON e.class_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id) as total_evaluations,
    (SELECT COUNT(*) 
     FROM evaluations e 
     JOIN class_sections cs ON e.class_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id 
     AND e.submission_date >= CURRENT_DATE - INTERVAL '30 days') as recent_evaluations,
    (SELECT ROUND(AVG(e.rating_overall), 2) 
     FROM evaluations e 
     JOIN class_sections cs ON e.class_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     JOIN users i ON cs.instructor_id = i.id 
     WHERE i.department_id = su.department_id) as avg_department_rating
FROM secretary_users su
JOIN departments d ON su.department_id = d.department_id
WHERE su.is_active = TRUE;

-- ================================================
-- PART 7: FUNCTIONS
-- ================================================

-- Get setting function
CREATE OR REPLACE FUNCTION get_setting(p_category VARCHAR, p_key VARCHAR)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_value TEXT;
BEGIN
    SELECT setting_value INTO v_value
    FROM system_settings
    WHERE category = p_category AND setting_key = p_key;
    RETURN v_value;
END;
$$;

-- Update setting function
CREATE OR REPLACE FUNCTION update_setting(
    p_category VARCHAR,
    p_key VARCHAR,
    p_value TEXT,
    p_user_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE system_settings
    SET setting_value = p_value,
        last_modified_by = p_user_id,
        last_modified_at = CURRENT_TIMESTAMP
    WHERE category = p_category AND setting_key = p_key;
    RETURN FOUND;
END;
$$;

-- Log audit event function
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id INTEGER,
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id INTEGER DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address VARCHAR DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_audit_id INTEGER;
    v_username VARCHAR;
    v_role VARCHAR;
BEGIN
    SELECT email, role INTO v_username, v_role
    FROM users WHERE id = p_user_id;
    
    INSERT INTO audit_logs (
        user_id, username, user_role, action, entity_type, 
        entity_id, details, ip_address, timestamp
    ) VALUES (
        p_user_id, v_username, v_role, p_action, p_entity_type,
        p_entity_id, p_details, p_ip_address, CURRENT_TIMESTAMP
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

-- Get active evaluation period function
CREATE OR REPLACE FUNCTION get_active_evaluation_period()
RETURNS TABLE (
    period_id INTEGER,
    period_name VARCHAR,
    start_date DATE,
    end_date DATE,
    semester VARCHAR,
    academic_year VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id, name, ep.start_date, ep.end_date, ep.semester, ep.academic_year
    FROM evaluation_periods ep
    WHERE is_active = TRUE
    AND CURRENT_DATE BETWEEN ep.start_date AND ep.end_date
    LIMIT 1;
END;
$$;

-- Create secretary user function
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
    INSERT INTO users (
        email, password_hash, first_name, last_name, 
        role, department_id, can_access_department_data, is_active
    ) VALUES (
        p_email, p_password, p_first_name, p_last_name,
        'secretary', p_department_id, TRUE, TRUE
    ) RETURNING id INTO new_user_id;
    
    INSERT INTO secretary_users (
        user_id, department_id, access_level, assigned_by
    ) VALUES (
        new_user_id, p_department_id, p_access_level, p_assigned_by
    ) RETURNING secretary_id INTO new_secretary_id;
    
    RETURN new_secretary_id;
END;
$$;

-- Get secretary department data function
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
    SELECT department_id INTO secretary_dept_id
    FROM secretary_users su
    JOIN users u ON su.user_id = u.id
    WHERE u.id = secretary_user_id AND su.is_active = TRUE;
    
    IF secretary_dept_id IS NULL THEN
        RAISE EXCEPTION 'User is not an active secretary or does not exist';
    END IF;
    
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

-- Check secretary access function
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
    SELECT su.department_id, su.access_level
    INTO secretary_dept_id, access_level
    FROM secretary_users su
    JOIN users u ON su.user_id = u.id
    WHERE u.id = p_user_id AND su.is_active = TRUE;
    
    IF secretary_dept_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF access_level = 'university' THEN
        has_access := TRUE;
    ELSIF access_level = 'college' THEN
        has_access := TRUE;
    ELSIF access_level = 'department' THEN
        IF p_target_department_id IS NULL OR p_target_department_id = secretary_dept_id THEN
            has_access := TRUE;
        END IF;
    END IF;
    
    RETURN has_access;
END;
$$;

-- ================================================
-- PART 8: TRIGGERS
-- ================================================

-- Firebase sync trigger function
CREATE OR REPLACE FUNCTION trigger_firebase_sync()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO firebase_sync_log (table_name, record_id, sync_type, firebase_doc_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NEW.firebase_doc_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evaluation_firebase_sync ON evaluations;
CREATE TRIGGER evaluation_firebase_sync
    AFTER INSERT OR UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_firebase_sync();

-- Evaluation period timestamp update trigger
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

-- Department timestamp update trigger
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
-- PART 9: INDEXES
-- ================================================

-- Evaluations indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_sentiment ON evaluations(sentiment, sentiment_score);
CREATE INDEX IF NOT EXISTS idx_evaluations_anomaly ON evaluations(is_anomaly, anomaly_score);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(submission_date);
CREATE INDEX IF NOT EXISTS idx_evaluations_processing ON evaluations(processing_status, processed_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_class_section ON evaluations(class_section_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_department_role ON users(department_id, role);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Class sections indexes
CREATE INDEX IF NOT EXISTS idx_class_sections_course ON class_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_instructor ON class_sections(instructor_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_semester ON class_sections(semester, academic_year);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_number ON students(student_number);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_program ON courses(program_id);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);

-- Analysis results indexes
CREATE INDEX IF NOT EXISTS idx_analysis_results_date ON analysis_results(analysis_date);
CREATE INDEX IF NOT EXISTS idx_analysis_results_type ON analysis_results(analysis_type, class_section_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_class_section ON analysis_results(class_section_id);

-- Firebase sync log indexes
CREATE INDEX IF NOT EXISTS idx_firebase_sync ON firebase_sync_log(table_name, record_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_firebase_sync_status ON firebase_sync_log(sync_status, sync_timestamp);

-- Notification queue indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notification_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notification_queue(notification_type);

-- Evaluation periods indexes
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_active ON evaluation_periods(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_dates ON evaluation_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_status ON evaluation_periods(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_semester ON evaluation_periods(semester, academic_year);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(category, setting_key);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Export history indexes
CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history(exported_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_type ON export_history(export_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);
CREATE INDEX IF NOT EXISTS idx_export_history_expires ON export_history(expires_at) WHERE is_deleted = FALSE;

-- Secretary users indexes
CREATE INDEX IF NOT EXISTS idx_secretary_users_user ON secretary_users(user_id);
CREATE INDEX IF NOT EXISTS idx_secretary_users_department ON secretary_users(department_id);
CREATE INDEX IF NOT EXISTS idx_secretary_users_active ON secretary_users(is_active);

-- Departments indexes
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_section ON enrollments(class_section_id);

-- ================================================
-- SETUP COMPLETE!
-- ================================================

-- Verification: Count created objects
SELECT 
    'Tables' as object_type,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Views' as object_type,
    COUNT(*) as count
FROM information_schema.views 
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'Functions' as object_type,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'

UNION ALL

SELECT 
    'Indexes' as object_type,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Triggers' as object_type,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Show system settings by category
SELECT category, COUNT(*) as settings_count 
FROM system_settings 
GROUP BY category 
ORDER BY category;

-- Show departments
SELECT * FROM departments ORDER BY department_code;
