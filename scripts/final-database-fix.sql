-- Final comprehensive database fix script
-- This script addresses all remaining issues with the database schema

-- 1. Ensure all required tables exist with correct structure
-- 2. Fix data type mismatches
-- 3. Add missing columns and constraints

-- ============================================================================
-- CREATE MISSING TABLES
-- ============================================================================

-- Create password_resets table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for password_resets
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_id SERIAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS share_token VARCHAR(64);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS allow_copy BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to cities table
ALTER TABLE cities ADD COLUMN IF NOT EXISTS cost_index INTEGER DEFAULT 50;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 50;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS duration_hours INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to trip_cities table
ALTER TABLE trip_cities ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE trip_cities ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE trip_cities ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE trip_cities ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE trip_cities ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);

-- Add missing columns to trip_activities table
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);

-- Add missing columns to budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS expense_date DATE;

-- Add missing columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_date DATE;

-- Add missing columns to shared_trips table
ALTER TABLE shared_trips ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);
ALTER TABLE shared_trips ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- FIX DATA TYPE MISMATCHES
-- ============================================================================

-- Convert trip_id columns from integer to UUID where needed
-- First, check if the columns are already UUID type
DO $$
BEGIN
    -- Check if trip_cities.trip_id is UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trip_cities' 
        AND column_name = 'trip_id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'trip_cities.trip_id is already UUID type';
    ELSE
        -- Convert to UUID if it's integer
        ALTER TABLE trip_cities ALTER COLUMN trip_id TYPE UUID USING trip_id::text::uuid;
        RAISE NOTICE 'Converted trip_cities.trip_id to UUID type';
    END IF;
    
    -- Check if trip_activities.trip_id is UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trip_activities' 
        AND column_name = 'trip_id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'trip_activities.trip_id is already UUID type';
    ELSE
        -- Convert to UUID if it's integer
        ALTER TABLE trip_activities ALTER COLUMN trip_id TYPE UUID USING trip_id::text::uuid;
        RAISE NOTICE 'Converted trip_activities.trip_id to UUID type';
    END IF;
    
    -- Check if budgets.trip_id is UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'budgets' 
        AND column_name = 'trip_id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'budgets.trip_id is already UUID type';
    ELSE
        -- Convert to UUID if it's integer
        ALTER TABLE budgets ALTER COLUMN trip_id TYPE UUID USING trip_id::text::uuid;
        RAISE NOTICE 'Converted budgets.trip_id to UUID type';
    END IF;
    
    -- Check if expenses.trip_id is UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'trip_id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'expenses.trip_id is already UUID type';
    ELSE
        -- Convert to UUID if it's integer
        ALTER TABLE expenses ALTER COLUMN trip_id TYPE UUID USING trip_id::text::uuid;
        RAISE NOTICE 'Converted expenses.trip_id to UUID type';
    END IF;
    
    -- Check if shared_trips.trip_id is UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shared_trips' 
        AND column_name = 'trip_id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'shared_trips.trip_id is already UUID type';
    ELSE
        -- Convert to UUID if it's integer
        ALTER TABLE shared_trips ALTER COLUMN trip_id TYPE UUID USING trip_id::text::uuid;
        RAISE NOTICE 'Converted shared_trips.trip_id to UUID type';
    END IF;
END $$;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- trip_cities foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_trip_cities_trip_id' 
        AND table_name = 'trip_cities'
    ) THEN
        ALTER TABLE trip_cities ADD CONSTRAINT fk_trip_cities_trip_id 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added fk_trip_cities_trip_id constraint';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_trip_cities_city_id' 
        AND table_name = 'trip_cities'
    ) THEN
        ALTER TABLE trip_cities ADD CONSTRAINT fk_trip_cities_city_id 
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added fk_trip_cities_city_id constraint';
    END IF;
    
    -- trip_activities foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_trip_activities_trip_id' 
        AND table_name = 'trip_activities'
    ) THEN
        ALTER TABLE trip_activities ADD CONSTRAINT fk_trip_activities_trip_id 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added fk_trip_activities_trip_id constraint';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_trip_activities_activity_id' 
        AND table_name = 'trip_activities'
    ) THEN
        ALTER TABLE trip_activities ADD CONSTRAINT fk_trip_activities_activity_id 
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added fk_trip_activities_activity_id constraint';
    END IF;
    
    -- budgets foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_budgets_trip_id' 
        AND table_name = 'budgets'
    ) THEN
        ALTER TABLE budgets ADD CONSTRAINT fk_budgets_trip_id 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added fk_budgets_trip_id constraint';
    END IF;
    
    -- expenses foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_expenses_trip_id' 
        AND table_name = 'expenses'
    ) THEN
        ALTER TABLE expenses ADD CONSTRAINT fk_expenses_trip_id 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added fk_expenses_trip_id constraint';
    END IF;
    
    -- shared_trips foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_shared_trips_trip_id' 
        AND table_name = 'shared_trips'
    ) THEN
        ALTER TABLE shared_trips ADD CONSTRAINT fk_shared_trips_trip_id 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added fk_shared_trips_trip_id constraint';
    END IF;
END $$;

-- ============================================================================
-- ADD UNIQUE CONSTRAINTS
-- ============================================================================

-- Add unique constraints for display_id columns
DO $$
BEGIN
    -- users.display_id unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_users_display_id' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_users_display_id UNIQUE (display_id);
        RAISE NOTICE 'Added unique_users_display_id constraint';
    END IF;
    
    -- trips.display_id unique constraint (should already exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_trips_display_id' 
        AND table_name = 'trips'
    ) THEN
        ALTER TABLE trips ADD CONSTRAINT unique_trips_display_id UNIQUE (display_id);
        RAISE NOTICE 'Added unique_trips_display_id constraint';
    END IF;
    
    -- cities.display_id unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_cities_display_id' 
        AND table_name = 'cities'
    ) THEN
        ALTER TABLE cities ADD CONSTRAINT unique_cities_display_id UNIQUE (display_id);
        RAISE NOTICE 'Added unique_cities_display_id constraint';
    END IF;
    
    -- activities.display_id unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_activities_display_id' 
        AND table_name = 'activities'
    ) THEN
        ALTER TABLE activities ADD CONSTRAINT unique_activities_display_id UNIQUE (display_id);
        RAISE NOTICE 'Added unique_activities_display_id constraint';
    END IF;
END $$;

-- ============================================================================
-- CREATE TRIGGERS FOR UPDATED_AT COLUMNS
-- ============================================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DO $$
BEGIN
    -- users table trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_users_updated_at' 
        AND event_object_table = 'users'
    ) THEN
        CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added update_users_updated_at trigger';
    END IF;
    
    -- trips table trigger (should already exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_trips_updated_at' 
        AND event_object_table = 'trips'
    ) THEN
        CREATE TRIGGER update_trips_updated_at 
        BEFORE UPDATE ON trips 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added update_trips_updated_at trigger';
    END IF;
    
    -- cities table trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_cities_updated_at' 
        AND event_object_table = 'cities'
    ) THEN
        CREATE TRIGGER update_cities_updated_at 
        BEFORE UPDATE ON cities 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added update_cities_updated_at trigger';
    END IF;
    
    -- activities table trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_activities_updated_at' 
        AND event_object_table = 'activities'
    ) THEN
        CREATE TRIGGER update_activities_updated_at 
        BEFORE UPDATE ON activities 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added update_activities_updated_at trigger';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check the final state of key tables
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'trips' as table_name, COUNT(*) as row_count FROM trips
UNION ALL
SELECT 'cities' as table_name, COUNT(*) as row_count FROM cities
UNION ALL
SELECT 'activities' as table_name, COUNT(*) as row_count FROM activities
UNION ALL
SELECT 'unverified_users' as table_name, COUNT(*) as row_count FROM unverified_users
UNION ALL
SELECT 'password_resets' as table_name, COUNT(*) as row_count FROM password_resets
UNION ALL
SELECT 'email_verification_otps' as table_name, COUNT(*) as row_count FROM email_verification_otps;

-- Check column types for key columns
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'trips', 'cities', 'activities')
AND column_name IN ('id', 'display_id', 'user_id', 'trip_id', 'city_id')
ORDER BY table_name, column_name;

-- Check constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('users', 'trips', 'cities', 'activities', 'trip_cities', 'trip_activities', 'budgets', 'expenses', 'shared_trips')
ORDER BY tc.table_name, tc.constraint_name;
