-- Create export_history table for tracking data exports
-- Run this in your PostgreSQL database

CREATE TABLE IF NOT EXISTS export_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    export_type VARCHAR(50) NOT NULL,
    format VARCHAR(10) NOT NULL,
    filters JSONB,
    file_size INTEGER,
    record_count INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_type ON export_history(export_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_created ON export_history(created_at DESC);

-- Add comment
COMMENT ON TABLE export_history IS 'Tracks all data export operations for audit and history';
