-- Comprehensive fix for email verification and OTP issues
-- This script addresses multiple problems:
-- 1. Foreign key constraint pointing to wrong table
-- 2. Case sensitivity in email comparisons
-- 3. Proper cleanup of failed registrations

-- Step 1: Drop the incorrect foreign key constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'email_verification_otps' 
        AND constraint_name = 'fk_email_verification_otps_user_id'
    ) THEN
        ALTER TABLE email_verification_otps 
        DROP CONSTRAINT fk_email_verification_otps_user_id;
        RAISE NOTICE 'Dropped incorrect foreign key constraint fk_email_verification_otps_user_id';
    END IF;
END $$;

-- Step 2: Add the correct foreign key constraint to unverified_users table
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
        RAISE NOTICE 'Added correct foreign key constraint to unverified_users table';
    END IF;
END $$;

-- Step 3: Create case-insensitive unique indexes for email fields
-- This ensures that Test@example.com and test@example.com are treated as the same email

-- For users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname = 'idx_users_email_lower'
    ) THEN
        CREATE UNIQUE INDEX idx_users_email_lower ON users (LOWER(email));
        RAISE NOTICE 'Created case-insensitive unique index on users.email';
    END IF;
END $$;

-- For unverified_users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'unverified_users' 
        AND indexname = 'idx_unverified_users_email_lower'
    ) THEN
        CREATE UNIQUE INDEX idx_unverified_users_email_lower ON unverified_users (LOWER(email));
        RAISE NOTICE 'Created case-insensitive unique index on unverified_users.email';
    END IF;
END $$;

-- Step 4: Clean up any orphaned OTP records that reference non-existent users
DELETE FROM email_verification_otps 
WHERE user_id NOT IN (SELECT id FROM unverified_users);

-- Step 5: Clean up any expired OTPs older than 24 hours
DELETE FROM email_verification_otps 
WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- Step 6: Clean up any unverified users older than 24 hours
DELETE FROM unverified_users 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- Step 7: Verify the final structure
SELECT 
    'email_verification_otps' as table_name,
    COUNT(*) as total_otps,
    COUNT(CASE WHEN expires_at < CURRENT_TIMESTAMP THEN 1 END) as expired_otps,
    COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as used_otps
FROM email_verification_otps
UNION ALL
SELECT 
    'email_verification_otps' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 1 END) as old_users,
    0 as unused_field
FROM unverified_users;

-- Step 8: Show the final foreign key constraints
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
