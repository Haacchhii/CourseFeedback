-- ===============================================
-- ADMIN FEATURES SUPPLEMENT
-- Additional tables needed for System Admin functionality
-- Run this AFTER enhanced_database_schema.sql
-- ===============================================

-- ================================================
-- 1. EVALUATION PERIODS TABLE
-- For managing evaluation windows and schedules
-- ================================================

CREATE TABLE IF NOT EXISTS evaluation_periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('1st', '2nd', 'summer', 'midyear')),
    academic_year VARCHAR(20) NOT NULL, -- e.g., '2024-2025'
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Notification settings
    reminder_days_before INTEGER DEFAULT 3,
    send_reminders BOOLEAN DEFAULT TRUE,
    
    -- Progress tracking
    total_evaluations INTEGER DEFAULT 0,
    completed_evaluations INTEGER DEFAULT 0,
    
    -- Metadata
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one active period at a time per semester/year
    CONSTRAINT unique_active_period UNIQUE NULLS NOT DISTINCT (academic_year, semester, CASE WHEN is_active THEN TRUE ELSE NULL END)
);

-- Index for quick lookups of active periods
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_active ON evaluation_periods(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_dates ON evaluation_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_evaluation_periods_status ON evaluation_periods(status);

-- ================================================
-- 2. SYSTEM SETTINGS TABLE
-- For storing configurable system settings
-- ================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'general', 'email', 'security', 'backup', 'notifications'
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_encrypted BOOLEAN DEFAULT FALSE,
    description TEXT,
    
    -- Validation
    validation_rules JSONB, -- e.g., {"min": 0, "max": 100, "pattern": "regex"}
    default_value TEXT,
    
    -- Metadata
    last_modified_by INTEGER REFERENCES users(id),
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique keys per category
    CONSTRAINT unique_setting_key UNIQUE(category, setting_key)
);

-- Index for quick category lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- ================================================
-- 3. AUDIT LOGS TABLE
-- For tracking all admin actions and system events
-- ================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    
    -- User information
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', 'export', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'course', 'evaluation', 'settings', 'period', etc.
    entity_id INTEGER, -- ID of the affected entity
    entity_name VARCHAR(255), -- Human-readable name
    
    -- Change tracking
    old_values JSONB, -- Previous state before change
    new_values JSONB, -- New state after change
    changes_summary TEXT, -- Human-readable summary
    
    -- Request details
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_method VARCHAR(10), -- GET, POST, PUT, DELETE
    request_path TEXT,
    
    -- Additional context
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
    details JSONB, -- Additional metadata
    error_message TEXT,
    
    -- Timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- For grouping related actions
    session_id VARCHAR(255),
    correlation_id VARCHAR(255) -- For tracking multi-step operations
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);

-- ================================================
-- 4. EXPORT HISTORY TABLE
-- For tracking data export operations
-- ================================================

CREATE TABLE IF NOT EXISTS export_history (
    id SERIAL PRIMARY KEY,
    
    -- Export details
    export_type VARCHAR(50) NOT NULL, -- 'users', 'evaluations', 'courses', 'analytics', 'audit_logs'
    export_format VARCHAR(20) NOT NULL, -- 'csv', 'excel', 'json', 'pdf'
    
    -- User information
    exported_by INTEGER REFERENCES users(id),
    user_email VARCHAR(255),
    
    -- Filters applied
    filters JSONB, -- Store the filters used for the export
    date_range_start DATE,
    date_range_end DATE,
    
    -- Results
    total_records INTEGER,
    file_size_bytes BIGINT,
    file_name VARCHAR(255),
    file_path TEXT, -- If storing files
    download_url TEXT, -- If using cloud storage
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP, -- For automatic cleanup of old exports
    
    -- Security
    ip_address VARCHAR(45),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for export history
CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history(exported_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_type ON export_history(export_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);
CREATE INDEX IF NOT EXISTS idx_export_history_expires ON export_history(expires_at) WHERE is_deleted = FALSE;

-- ================================================
-- 5. INSERT DEFAULT SYSTEM SETTINGS
-- Pre-populate with common settings
-- ================================================

-- General Settings
INSERT INTO system_settings (category, setting_key, setting_value, data_type, description, default_value) VALUES
('general', 'site_name', 'Course Evaluation System', 'string', 'Name of the application', 'Course Evaluation System'),
('general', 'site_description', 'AI-powered course feedback and analytics', 'string', 'Site description', 'Course Evaluation System'),
('general', 'maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', 'false'),
('general', 'allow_registration', 'false', 'boolean', 'Allow new user registration', 'false'),
('general', 'default_language', 'en', 'string', 'Default system language', 'en'),
('general', 'timezone', 'Asia/Manila', 'string', 'System timezone', 'Asia/Manila'),
('general', 'items_per_page', '20', 'number', 'Default pagination size', '20')
ON CONFLICT (category, setting_key) DO NOTHING;

-- Email Settings
INSERT INTO system_settings (category, setting_key, setting_value, data_type, description, default_value) VALUES
('email', 'smtp_host', '', 'string', 'SMTP server hostname', ''),
('email', 'smtp_port', '587', 'number', 'SMTP server port', '587'),
('email', 'smtp_username', '', 'string', 'SMTP username', ''),
('email', 'smtp_password', '', 'string', 'SMTP password (encrypted)', ''),
('email', 'smtp_use_tls', 'true', 'boolean', 'Use TLS for SMTP', 'true'),
('email', 'from_email', 'noreply@university.edu', 'string', 'Default sender email', 'noreply@university.edu'),
('email', 'from_name', 'Course Evaluation System', 'string', 'Default sender name', 'Course Evaluation System'),
('email', 'enable_notifications', 'true', 'boolean', 'Enable email notifications', 'true')
ON CONFLICT (category, setting_key) DO NOTHING;

-- Security Settings
INSERT INTO system_settings (category, setting_key, setting_value, data_type, description, default_value) VALUES
('security', 'session_timeout', '30', 'number', 'Session timeout in minutes', '30'),
('security', 'password_min_length', '8', 'number', 'Minimum password length', '8'),
('security', 'password_require_uppercase', 'true', 'boolean', 'Require uppercase in password', 'true'),
('security', 'password_require_lowercase', 'true', 'boolean', 'Require lowercase in password', 'true'),
('security', 'password_require_numbers', 'true', 'boolean', 'Require numbers in password', 'true'),
('security', 'password_require_special', 'false', 'boolean', 'Require special characters in password', 'false'),
('security', 'max_login_attempts', '5', 'number', 'Maximum failed login attempts', '5'),
('security', 'lockout_duration', '15', 'number', 'Account lockout duration in minutes', '15'),
('security', 'enable_2fa', 'false', 'boolean', 'Enable two-factor authentication', 'false'),
('security', 'enable_audit_logs', 'true', 'boolean', 'Enable audit logging', 'true')
ON CONFLICT (category, setting_key) DO NOTHING;

-- Backup Settings
INSERT INTO system_settings (category, setting_key, setting_value, data_type, description, default_value) VALUES
('backup', 'auto_backup_enabled', 'true', 'boolean', 'Enable automatic backups', 'true'),
('backup', 'backup_frequency', 'daily', 'string', 'Backup frequency (daily, weekly, monthly)', 'daily'),
('backup', 'backup_retention_days', '30', 'number', 'Number of days to retain backups', '30'),
('backup', 'backup_time', '02:00', 'string', 'Time to run backups (HH:MM)', '02:00'),
('backup', 'backup_location', '/backups', 'string', 'Backup storage location', '/backups')
ON CONFLICT (category, setting_key) DO NOTHING;

-- Notification Settings
INSERT INTO system_settings (category, setting_key, setting_value, data_type, description, default_value) VALUES
('notifications', 'enable_push_notifications', 'true', 'boolean', 'Enable push notifications', 'true'),
('notifications', 'enable_email_notifications', 'true', 'boolean', 'Enable email notifications', 'true'),
('notifications', 'notify_on_evaluation_submit', 'true', 'boolean', 'Notify when evaluation submitted', 'true'),
('notifications', 'notify_on_period_start', 'true', 'boolean', 'Notify when evaluation period starts', 'true'),
('notifications', 'notify_on_period_end', 'true', 'boolean', 'Notify when evaluation period ends', 'true'),
('notifications', 'notify_on_anomaly_detected', 'true', 'boolean', 'Notify when anomaly detected', 'true')
ON CONFLICT (category, setting_key) DO NOTHING;

-- ================================================
-- 6. HELPER FUNCTIONS
-- ================================================

-- Function to get setting value with type conversion
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

-- Function to update setting value
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

-- Function to log audit event (simplified version)
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
    -- Get user details
    SELECT email, role INTO v_username, v_role
    FROM users WHERE id = p_user_id;
    
    -- Insert audit log
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

-- Function to get active evaluation period
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

-- Trigger to update updated_at timestamp for evaluation_periods
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
-- 7. VIEWS FOR ADMIN DASHBOARD
-- ================================================

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

-- System settings grouped by category
CREATE OR REPLACE VIEW settings_by_category AS
SELECT 
    category,
    COUNT(*) as setting_count,
    COUNT(CASE WHEN setting_value IS NOT NULL AND setting_value != '' THEN 1 END) as configured_count,
    MAX(last_modified_at) as last_updated
FROM system_settings
GROUP BY category;

-- Export statistics
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

-- ================================================
-- 8. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ================================================

-- Sample evaluation period
INSERT INTO evaluation_periods (
    name, description, start_date, end_date, semester, academic_year, status, is_active, created_by
) VALUES (
    'Midterm Evaluation - Fall 2024',
    'Midterm course evaluation period for Fall semester 2024',
    '2024-10-15',
    '2024-10-30',
    '1st',
    '2024-2025',
    'active',
    TRUE,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Sample audit log entry
INSERT INTO audit_logs (
    user_id, username, user_role, action, entity_type, 
    entity_name, ip_address, timestamp, status, severity
) VALUES (
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'admin@lpu.edu.ph',
    'admin',
    'system_setup',
    'database',
    'Admin Tables Supplement',
    '127.0.0.1',
    CURRENT_TIMESTAMP,
    'success',
    'info'
) ON CONFLICT DO NOTHING;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check all new tables created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('evaluation_periods', 'system_settings', 'audit_logs', 'export_history')
ORDER BY table_name;

-- Check system settings
SELECT category, COUNT(*) as settings_count 
FROM system_settings 
GROUP BY category 
ORDER BY category;

-- Check if functions were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_setting', 'update_setting', 'log_audit_event', 'get_active_evaluation_period')
ORDER BY routine_name;

-- ================================================
-- USAGE EXAMPLES
-- ================================================

-- Example 1: Get a setting
-- SELECT get_setting('general', 'site_name');

-- Example 2: Update a setting
-- SELECT update_setting('general', 'site_name', 'My Custom Name', 1);

-- Example 3: Log an audit event
-- SELECT log_audit_event(1, 'update', 'settings', NULL, '{"setting": "site_name"}'::jsonb, '192.168.1.1');

-- Example 4: Get active evaluation period
-- SELECT * FROM get_active_evaluation_period();

-- Example 5: View audit log summary
-- SELECT * FROM audit_log_summary WHERE log_date >= CURRENT_DATE - INTERVAL '7 days';
