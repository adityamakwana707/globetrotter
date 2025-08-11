-- Fix existing email_verification_otps table structure
-- This script will add missing columns and fix the table schema

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_verification_otps'
ORDER BY ordinal_position;

-- Drop the existing table if it has wrong structure
DROP TABLE IF EXISTS email_verification_otps;

-- Recreate the table with correct structure
CREATE TABLE email_verification_otps (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, email)
);

-- Add indexes for performance
CREATE INDEX idx_email_verification_otps_user_email ON email_verification_otps(user_id, email);
CREATE INDEX idx_email_verification_otps_expires ON email_verification_otps(expires_at);

-- Ensure users table has email_verified column
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Update existing users to have email_verified = false
UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;

-- Verify the table structure
\d email_verification_otps

-- Show sample data structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'email_verification_otps' 
ORDER BY ordinal_position;
