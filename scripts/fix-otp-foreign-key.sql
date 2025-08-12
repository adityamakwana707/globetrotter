-- Fix the foreign key constraint for email_verification_otps table
-- The table should reference unverified_users(id) instead of users(id)

-- First, drop the existing foreign key constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'email_verification_otps' 
        AND constraint_name = 'fk_email_verification_otps_user_id'
    ) THEN
        ALTER TABLE email_verification_otps 
        DROP CONSTRAINT fk_email_verification_otps_user_id;
    END IF;
END $$;

-- Add the correct foreign key constraint to unverified_users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'email_verification_otps' 
        AND constraint_name = 'fk_email_verification_otps_unverified_user_id'
    ) THEN
        ALTER TABLE email_verification_otps 
        ADD CONSTRAINT fk_email_verification_otps_unverified_user_id 
        FOREIGN KEY (user_id) REFERENCES unverified_users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Verify the constraint was created correctly
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'email_verification_otps' 
    AND tc.constraint_type = 'FOREIGN KEY';
