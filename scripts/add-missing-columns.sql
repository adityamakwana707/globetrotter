-- Add missing columns to existing tables
-- This script adds the missing columns that the enhanced schema expects

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_id SERIAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS display_id SERIAL;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS share_token VARCHAR(64);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS allow_copy BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to cities table
ALTER TABLE cities ADD COLUMN IF NOT EXISTS display_id SERIAL;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS cost_index INTEGER DEFAULT 50;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add missing columns to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS display_id SERIAL;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS duration_hours INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add missing columns to trip_cities table
ALTER TABLE trip_cities ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Add missing columns to trip_activities table
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS order_index INTEGER;
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 2);

-- Add missing columns to budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add missing columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_date DATE;

-- Add missing columns to shared_trips table
ALTER TABLE shared_trips ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE;
ALTER TABLE shared_trips ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to user_sessions table
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS session_token VARCHAR(255) UNIQUE;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create unique constraints for display_id columns
DO $$
BEGIN
    -- Add unique constraint to users.display_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' AND constraint_name LIKE '%display_id%'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_users_display_id UNIQUE (display_id);
    END IF;
    
    -- Add unique constraint to trips.display_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'trips' AND constraint_name LIKE '%display_id%'
    ) THEN
        ALTER TABLE trips ADD CONSTRAINT unique_trips_display_id UNIQUE (display_id);
    END IF;
    
    -- Add unique constraint to cities.display_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'cities' AND constraint_name LIKE '%display_id%'
    ) THEN
        ALTER TABLE cities ADD CONSTRAINT unique_cities_display_id UNIQUE (display_id);
    END IF;
    
    -- Add unique constraint to activities.display_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'activities' AND constraint_name LIKE '%display_id%'
    ) THEN
        ALTER TABLE activities ADD CONSTRAINT unique_activities_display_id UNIQUE (display_id);
    END IF;
END $$;

-- Show the updated table structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'trips', 'cities', 'activities')
ORDER BY table_name, ordinal_position;
