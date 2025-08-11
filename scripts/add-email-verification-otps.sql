-- Add Email Verification OTP Table
-- Run this script to add OTP functionality to existing GlobeTrotter databases

-- Create the email verification OTPs table
CREATE TABLE IF NOT EXISTS email_verification_otps (
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
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_user_email ON email_verification_otps(user_id, email);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_expires ON email_verification_otps(expires_at);

-- Ensure users table has email_verified column (add if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update existing users to have email_verified = false (they can verify later if needed)
UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;

-- Add comment to table
COMMENT ON TABLE email_verification_otps IS 'Stores OTP codes for email verification with 10-minute expiration';
COMMENT ON COLUMN email_verification_otps.otp_code IS '6-digit OTP code for email verification';
COMMENT ON COLUMN email_verification_otps.expires_at IS 'OTP expiration timestamp (10 minutes from creation)';
COMMENT ON COLUMN email_verification_otps.used_at IS 'Timestamp when OTP was successfully used (NULL if unused)';

-- Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'email_verification_otps' 
ORDER BY ordinal_position;
