-- =====================================================
-- MISSING FEATURES IMPLEMENTATION - SQL SETUP
-- Run this script in Supabase SQL Editor
-- =====================================================

-- This script creates all missing database tables needed for:
-- 1. System Settings functionality
-- 2. Audit Logging system
-- 3. Export History tracking

-- =====================================================
-- 1. SYSTEM SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    data_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

INSERT INTO system_settings (category, key, value, data_type, description) VALUES
-- General Settings
('general', 'institution_name', 'Lyceum of the Philippines University - Batangas', 'string', 'Full institution name'),
('general', 'institution_short_name', 'LPU Batangas', 'string', 'Short institution name'),
('general', 'academic_year', '2024-2025', 'string', 'Current academic year'),
('general', 'current_semester', 'First Semester', 'string', 'Current semester'),
('general', 'rating_scale', '4', 'number', 'Maximum rating scale'),
('general', 'timezone', 'Asia/Manila', 'string', 'System timezone'),
('general', 'date_format', 'MM/DD/YYYY', 'string', 'Date display format'),
('general', 'language', 'English', 'string', 'System language'),

-- Email Settings
('email', 'smtp_host', 'smtp.gmail.com', 'string', 'SMTP server hostname'),
('email', 'smtp_port', '587', 'number', 'SMTP server port'),
('email', 'smtp_username', 'noreply@lpubatangas.edu.ph', 'string', 'SMTP username'),
('email', 'smtp_password', '', 'string', 'SMTP password (encrypted)'),
('email', 'from_email', 'noreply@lpubatangas.edu.ph', 'string', 'From email address'),
('email', 'from_name', 'LPU Evaluation System', 'string', 'From name'),
('email', 'enable_notifications', 'true', 'boolean', 'Enable email notifications'),
('email', 'reminder_frequency', '3', 'number', 'Days between reminders'),

-- Security Settings
('security', 'password_min_length', '8', 'number', 'Minimum password length'),
('security', 'password_require_uppercase', 'true', 'boolean', 'Require uppercase letters'),
('security', 'password_require_lowercase', 'true', 'boolean', 'Require lowercase letters'),
('security', 'password_require_numbers', 'true', 'boolean', 'Require numbers'),
('security', 'password_require_special_chars', 'true', 'boolean', 'Require special characters'),
('security', 'session_timeout', '60', 'number', 'Session timeout in minutes'),
('security', 'max_login_attempts', '5', 'number', 'Maximum login attempts'),
('security', 'lockout_duration', '30', 'number', 'Account lockout duration in minutes'),
('security', 'two_factor_auth', 'false', 'boolean', 'Enable two-factor authentication'),
('security', 'allowed_domains', '@lpubatangas.edu.ph', 'string', 'Allowed email domains'),

-- Backup Settings
('backup', 'auto_backup', 'true', 'boolean', 'Enable automatic backups'),
('backup', 'backup_frequency', 'daily', 'string', 'Backup frequency'),
('backup', 'backup_time', '02:00', 'string', 'Backup time (HH:MM)'),
('backup', 'retention_days', '30', 'number', 'Backup retention in days'),
('backup', 'include_evaluations', 'true', 'boolean', 'Include evaluations in backup'),
('backup', 'include_users', 'true', 'boolean', 'Include users in backup'),
('backup', 'include_courses', 'true', 'boolean', 'Include courses in backup'),
('backup', 'backup_location', 'cloud', 'string', 'Backup storage location')
ON CONFLICT (category, key) DO NOTHING;

-- =====================================================
-- 2. AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'Info',
    status VARCHAR(20) DEFAULT 'Success',
    ip_address VARCHAR(50),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Insert sample audit logs
INSERT INTO audit_logs (user_id, action, category, severity, status, ip_address, details) VALUES
(1, 'LOGIN', 'Authentication', 'Info', 'Success', '127.0.0.1', '{"browser": "Chrome"}'),
(1, 'USER_CREATED', 'User Management', 'Info', 'Success', '127.0.0.1', '{"role": "student"}'),
(1, 'SETTINGS_UPDATED', 'System Settings', 'Warning', 'Success', '127.0.0.1', '{"category": "email"}'),
(NULL, 'LOGIN', 'Authentication', 'Warning', 'Failed', '192.168.1.100', '{"reason": "Invalid credentials"}'),
(1, 'EVALUATION_PERIOD_CREATED', 'Evaluation Management', 'Info', 'Success', '127.0.0.1', '{"period_name": "Midterm 2024-2025"}');

-- =====================================================
-- 3. EXPORT HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS export_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    export_type VARCHAR(50) NOT NULL,
    format VARCHAR(20) NOT NULL,
    filters JSONB,
    file_size INTEGER,
    record_count INTEGER,
    status VARCHAR(20) DEFAULT 'Completed',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_export_type ON export_history(export_type);
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON export_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);

-- Insert sample export history
INSERT INTO export_history (user_id, export_type, format, filters, file_size, record_count, status, created_at) VALUES
(1, 'users', 'csv', '{"role": "student"}', 15360, 250, 'Completed', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, 'evaluations', 'excel', '{"semester": "First Semester"}', 51200, 450, 'Completed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(1, 'courses', 'json', '{}', 8192, 100, 'Completed', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(1, 'analytics', 'pdf', '{"department": "CCS"}', 102400, 1, 'Completed', CURRENT_TIMESTAMP - INTERVAL '6 hours');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all tables were created
SELECT 'system_settings' as table_name, COUNT(*) as row_count FROM system_settings
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'export_history', COUNT(*) FROM export_history;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'All missing feature tables created successfully! ✅' as status,
       (SELECT COUNT(*) FROM system_settings) as settings_count,
       (SELECT COUNT(*) FROM audit_logs) as audit_logs_count,
       (SELECT COUNT(*) FROM export_history) as export_history_count;
