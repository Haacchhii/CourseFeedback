-- Password Reset Tokens Table
-- Stores tokens for password reset functionality

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create unique index on user_id to allow only one active token per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens with expiration';
COMMENT ON COLUMN password_reset_tokens.token IS 'Unique secure token for password reset';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration timestamp (typically 1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used IS 'Whether the token has been used to reset password';
