-- Backup History Table
-- Stores metadata about database backups

CREATE TABLE IF NOT EXISTS backup_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL, -- Size in bytes
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'in_progress')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_history_user ON backup_history(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_created ON backup_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);

COMMENT ON TABLE backup_history IS 'Stores metadata about database backups for tracking and recovery';
COMMENT ON COLUMN backup_history.filename IS 'Name of the backup file';
COMMENT ON COLUMN backup_history.file_path IS 'Full path to the backup file on the server';
COMMENT ON COLUMN backup_history.file_size IS 'Size of the backup file in bytes';
COMMENT ON COLUMN backup_history.status IS 'Status of the backup: success, failed, or in_progress';
