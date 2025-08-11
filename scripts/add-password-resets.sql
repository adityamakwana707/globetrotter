-- Add password reset functionality to existing database
-- Run this script to add the password_resets table

-- Password reset tokens table (UUID for security)
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

-- Add comment for documentation
COMMENT ON TABLE password_resets IS 'Password reset tokens with expiration and single-use validation';
