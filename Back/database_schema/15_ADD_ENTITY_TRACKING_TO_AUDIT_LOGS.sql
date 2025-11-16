-- Add entity tracking columns to audit_logs table
-- This allows tracking which specific entity was affected by the action

-- Add entity_type column (e.g., 'program_section', 'user', 'course', etc.)
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);

-- Add entity_id column (the ID of the entity that was affected)
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS entity_id INTEGER;

-- Add timestamp column (some code uses 'timestamp' instead of 'created_at')
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Add comment
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected (program_section, user, course, etc.)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of the specific entity that was affected';
