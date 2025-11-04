-- ===============================================
-- ADMIN TABLES
-- Purpose: Tables for system administration features
-- Tables: evaluation_periods, system_settings, audit_logs, export_history
-- ===============================================

-- ================================================
-- 1. EVALUATION PERIODS TABLE
-- Purpose: Manage evaluation windows and schedules
-- Use Case: Control when evaluations can be submitted, track progress
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

-- ================================================
-- 2. SYSTEM SETTINGS TABLE
-- Purpose: Store configurable system settings (General, Email, Security, Backup, Notifications)
-- Use Case: Application configuration without code changes
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

-- ================================================
-- 3. AUDIT LOGS TABLE
-- Purpose: Track all admin actions and system events for security and compliance
-- Use Case: Security auditing, troubleshooting, compliance reporting
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

-- ================================================
-- 4. EXPORT HISTORY TABLE
-- Purpose: Track data export operations
-- Use Case: Monitor exports, cleanup old files, audit data access
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

-- ================================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- Purpose: Pre-populate with common settings
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
-- VERIFICATION QUERY
-- ================================================

-- Check if all admin tables were created
SELECT table_name,
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
