-- Quick fix for email_verification_otps table
-- Add missing user_id column and fix structure

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_verification_otps' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE email_verification_otps ADD COLUMN user_id UUID;
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_verification_otps' AND column_name = 'email'
    ) THEN
        ALTER TABLE email_verification_otps ADD COLUMN email VARCHAR(255);
    END IF;
    
    -- Add otp_code column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_verification_otps' AND column_name = 'otp_code'
    ) THEN
        ALTER TABLE email_verification_otps ADD COLUMN otp_code VARCHAR(6);
    END IF;
    
    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_verification_otps' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE email_verification_otps ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_verification_otps' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE email_verification_otps ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add used_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_verification_otps' AND column_name = 'used_at'
    ) THEN
        ALTER TABLE email_verification_otps ADD COLUMN used_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'email_verification_otps' 
        AND constraint_name LIKE '%user_id%'
    ) THEN
        ALTER TABLE email_verification_otps 
        ADD CONSTRAINT fk_email_verification_otps_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'email_verification_otps' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%user_email%'
    ) THEN
        ALTER TABLE email_verification_otps 
        ADD CONSTRAINT unique_email_verification_otps_user_email 
        UNIQUE (user_id, email);
    END IF;
END $$;

-- Ensure users table has email_verified column
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Update existing users to have email_verified = false
UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;

-- Show the final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'email_verification_otps' 
ORDER BY ordinal_position;
