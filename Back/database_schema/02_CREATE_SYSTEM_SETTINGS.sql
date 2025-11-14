-- System Settings Table for Course Feedback System
-- This table stores all system configuration settings by category

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,  -- 'general', 'email', 'security', 'backup', 'evaluation'
    key VARCHAR(100) NOT NULL,
    value TEXT,
    data_type VARCHAR(20) DEFAULT 'string',  -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,  -- Whether setting is visible to non-admins
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

-- Create index for faster lookups by category
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Insert default settings
INSERT INTO system_settings (category, key, value, data_type, description) VALUES
-- General Settings
('general', 'institution_name', 'Lyceum of the Philippines University - Batangas', 'string', 'Full institution name'),
('general', 'institution_short_name', 'LPU Batangas', 'string', 'Short institution name'),
('general', 'academic_year', '2024-2025', 'string', 'Current academic year'),
('general', 'current_semester', 'First Semester', 'string', 'Current semester'),
('general', 'rating_scale', '4', 'number', 'Maximum rating scale (1-4 or 1-5)'),
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
('backup', 'backup_frequency', 'daily', 'string', 'Backup frequency (daily/weekly/monthly)'),
('backup', 'backup_time', '02:00', 'string', 'Backup time (HH:MM)'),
('backup', 'retention_days', '30', 'number', 'Backup retention in days'),
('backup', 'include_evaluations', 'true', 'boolean', 'Include evaluations in backup'),
('backup', 'include_users', 'true', 'boolean', 'Include users in backup'),
('backup', 'include_courses', 'true', 'boolean', 'Include courses in backup'),
('backup', 'backup_location', 'cloud', 'string', 'Backup storage location'),

-- Evaluation Settings
('evaluation', 'allow_anonymous', 'false', 'boolean', 'Allow anonymous evaluations'),
('evaluation', 'require_comment', 'true', 'boolean', 'Require text comments'),
('evaluation', 'min_comment_length', '50', 'number', 'Minimum comment length in characters'),
('evaluation', 'allow_edit', 'false', 'boolean', 'Allow students to edit submitted evaluations'),
('evaluation', 'edit_deadline_hours', '24', 'number', 'Hours after submission to allow edits')
ON CONFLICT (category, key) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE system_settings IS 'Stores all system configuration settings organized by category';
