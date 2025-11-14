-- Export History Table for Course Feedback System
-- Tracks all data exports for audit and monitoring purposes

CREATE TABLE IF NOT EXISTS export_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    export_type VARCHAR(50) NOT NULL,  -- 'users', 'evaluations', 'courses', 'analytics', 'custom'
    format VARCHAR(20) NOT NULL,  -- 'csv', 'excel', 'json', 'pdf'
    filters JSONB,  -- Export filters applied
    file_size INTEGER,  -- File size in bytes
    record_count INTEGER,  -- Number of records exported
    status VARCHAR(20) DEFAULT 'Completed',  -- 'Completed', 'Failed', 'In Progress'
    error_message TEXT,  -- Error message if failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_export_type ON export_history(export_type);
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON export_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);

-- Add comment
COMMENT ON TABLE export_history IS 'Tracks all data exports for auditing purposes';

-- Insert sample export history
INSERT INTO export_history (user_id, export_type, format, filters, file_size, record_count, status, created_at) VALUES
(1, 'users', 'csv', '{"role": "student"}', 15360, 250, 'Completed', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, 'evaluations', 'excel', '{"semester": "First Semester"}', 51200, 450, 'Completed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(1, 'courses', 'json', '{}', 8192, 100, 'Completed', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(1, 'analytics', 'pdf', '{"department": "CCS"}', 102400, 1, 'Completed', CURRENT_TIMESTAMP - INTERVAL '6 hours');
