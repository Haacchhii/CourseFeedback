-- Scheduled Exports Table
-- Stores automatic export schedules configured by administrators

CREATE TABLE IF NOT EXISTS scheduled_exports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    time VARCHAR(5) NOT NULL, -- HH:MM format
    format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'json', 'excel')),
    recipients TEXT NOT NULL, -- Comma-separated email addresses
    day_of_week VARCHAR(10), -- For weekly schedules (Monday, Tuesday, etc.)
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31), -- For monthly schedules
    is_active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_user ON scheduled_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_active ON scheduled_exports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_next_run ON scheduled_exports(next_run);

COMMENT ON TABLE scheduled_exports IS 'Stores scheduled export configurations for automatic data exports';
COMMENT ON COLUMN scheduled_exports.frequency IS 'Export frequency: daily, weekly, or monthly';
COMMENT ON COLUMN scheduled_exports.time IS 'Time of day to run export in HH:MM format';
COMMENT ON COLUMN scheduled_exports.recipients IS 'Comma-separated list of email addresses to receive exports';
COMMENT ON COLUMN scheduled_exports.day_of_week IS 'Day of week for weekly exports (e.g., Monday)';
COMMENT ON COLUMN scheduled_exports.day_of_month IS 'Day of month for monthly exports (1-31)';
COMMENT ON COLUMN scheduled_exports.next_run IS 'Calculated next run timestamp for the scheduled export';
