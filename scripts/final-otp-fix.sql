-- Final fix for email_verification_otps table
-- This script handles existing constraints and adds missing columns

-- Add missing used_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_verification_otps' AND column_name = 'used_at'
    ) THEN
        ALTER TABLE email_verification_otps ADD COLUMN used_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added used_at column';
    ELSE
        RAISE NOTICE 'used_at column already exists';
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

-- Show constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'email_verification_otps';
