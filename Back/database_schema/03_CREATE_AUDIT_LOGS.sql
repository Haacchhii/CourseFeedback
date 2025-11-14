-- Audit Logs Table for Course Feedback System
-- Tracks all important system activities for security and compliance

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,  -- Action performed (USER_CREATED, LOGIN, SETTINGS_CHANGED, etc.)
    category VARCHAR(50) NOT NULL,  -- Category (Authentication, User Management, System Settings, etc.)
    severity VARCHAR(20) DEFAULT 'Info',  -- Info, Warning, Error, Critical
    status VARCHAR(20) DEFAULT 'Success',  -- Success, Failed, Blocked
    ip_address VARCHAR(50),
    user_agent TEXT,
    details JSONB,  -- Additional details in JSON format
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Add comment
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all system activities';

-- Insert some sample audit logs for testing
INSERT INTO audit_logs (user_id, action, category, severity, status, ip_address, details) VALUES
(1, 'LOGIN', 'Authentication', 'Info', 'Success', '127.0.0.1', '{"browser": "Chrome", "device": "Desktop"}'),
(1, 'USER_CREATED', 'User Management', 'Info', 'Success', '127.0.0.1', '{"created_user_id": 2, "role": "student"}'),
(1, 'SETTINGS_UPDATED', 'System Settings', 'Warning', 'Success', '127.0.0.1', '{"category": "email", "changed_keys": ["smtp_host", "smtp_port"]}'),
(NULL, 'LOGIN', 'Authentication', 'Warning', 'Failed', '192.168.1.100', '{"email": "hacker@evil.com", "reason": "Invalid credentials"}'),
(1, 'EVALUATION_PERIOD_CREATED', 'Evaluation Management', 'Info', 'Success', '127.0.0.1', '{"period_name": "Midterm 2024-2025", "semester": "First Semester"}');
