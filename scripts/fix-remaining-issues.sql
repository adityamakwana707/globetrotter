-- Fix remaining database issues
-- This script creates missing tables and fixes data type mismatches

-- Create password_resets table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for password_resets
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

-- Fix data type mismatches - ensure city_id in activities is UUID
DO $$
BEGIN
    -- Check if city_id column exists and fix its type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'city_id'
    ) THEN
        -- If city_id is integer, convert it to UUID
        IF (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'activities' AND column_name = 'city_id'
        ) = 'integer' THEN
            -- Create a temporary column
            ALTER TABLE activities ADD COLUMN city_id_new UUID;
            
            -- Update the new column with converted values (you may need to adjust this)
            UPDATE activities SET city_id_new = gen_random_uuid() WHERE city_id_new IS NULL;
            
            -- Drop the old column and rename the new one
            ALTER TABLE activities DROP COLUMN city_id;
            ALTER TABLE activities RENAME COLUMN city_id_new TO city_id;
        END IF;
    END IF;
END $$;

-- Fix data type mismatches - ensure trip_id in trip_cities is UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trip_cities' AND column_name = 'trip_id'
    ) THEN
        IF (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'trip_cities' AND column_name = 'trip_id'
        ) = 'integer' THEN
            ALTER TABLE trip_cities ADD COLUMN trip_id_new UUID;
            UPDATE trip_cities SET trip_id_new = gen_random_uuid() WHERE trip_id_new IS NULL;
            ALTER TABLE trip_cities DROP COLUMN trip_id;
            ALTER TABLE trip_cities RENAME COLUMN trip_id_new TO trip_id;
        END IF;
    END IF;
END $$;

-- Fix data type mismatches - ensure trip_id in trip_activities is UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trip_activities' AND column_name = 'trip_id'
    ) THEN
        IF (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'trip_activities' AND column_name = 'trip_id'
        ) = 'integer' THEN
            ALTER TABLE trip_activities ADD COLUMN trip_id_new UUID;
            UPDATE trip_activities SET trip_id_new = gen_random_uuid() WHERE trip_id_new IS NULL;
            ALTER TABLE trip_activities DROP COLUMN trip_id;
            ALTER TABLE trip_activities RENAME COLUMN trip_id_new TO trip_id;
        END IF;
    END IF;
END $$;

-- Fix data type mismatches - ensure trip_id in budgets is UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'budgets' AND column_name = 'trip_id'
    ) THEN
        IF (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'budgets' AND column_name = 'trip_id'
        ) = 'integer' THEN
            ALTER TABLE budgets ADD COLUMN trip_id_new UUID;
            UPDATE budgets SET trip_id_new = gen_random_uuid() WHERE trip_id_new IS NULL;
            ALTER TABLE budgets DROP COLUMN trip_id;
            ALTER TABLE budgets RENAME COLUMN trip_id_new TO trip_id;
        END IF;
    END IF;
END $$;

-- Fix data type mismatches - ensure trip_id in expenses is UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'trip_id'
    ) THEN
        IF (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'trip_id'
        ) = 'integer' THEN
            ALTER TABLE expenses ADD COLUMN trip_id_new UUID;
            UPDATE trip_activities SET trip_id_new = gen_random_uuid() WHERE trip_id_new IS NULL;
            ALTER TABLE expenses DROP COLUMN trip_id;
            ALTER TABLE expenses RENAME COLUMN trip_id_new TO trip_id;
        END IF;
    END IF;
END $$;

-- Fix data type mismatches - ensure trip_id in shared_trips is UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shared_trips' AND column_name = 'trip_id'
    ) THEN
        IF (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'shared_trips' AND column_name = 'trip_id'
        ) = 'integer' THEN
            ALTER TABLE shared_trips ADD COLUMN trip_id_new UUID;
            UPDATE shared_trips SET trip_id_new = gen_random_uuid() WHERE trip_id_new IS NULL;
            ALTER TABLE shared_trips DROP COLUMN trip_id;
            ALTER TABLE shared_trips RENAME COLUMN trip_id_new TO trip_id;
        END IF;
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key for activities.city_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'activities' AND constraint_name LIKE '%city_id%'
    ) THEN
        ALTER TABLE activities ADD CONSTRAINT fk_activities_city_id 
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for trip_cities.trip_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'trip_cities' AND constraint_name LIKE '%trip_id%'
    ) THEN
        ALTER TABLE trip_cities ADD CONSTRAINT fk_trip_cities_trip_id 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for trip_activities.trip_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'trip_activities' AND constraint_name LIKE '%trip_id%'
    ) THEN
        ALTER TABLE trip_activities ADD CONSTRAINT fk_trip_activities_trip_id 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for budgets.trip_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'budgets' AND constraint_name LIKE '%trip_id%'
    ) THEN
        ALTER TABLE budgets ADD CONSTRAINT fk_budgets_trip_id 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for expenses.trip_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'expenses' AND constraint_name LIKE '%trip_id%'
    ) THEN
        ALTER TABLE expenses ADD CONSTRAINT fk_expenses_trip_id 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for shared_trips.trip_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'shared_trips' AND constraint_name LIKE '%trip_id%'
    ) THEN
        ALTER TABLE shared_trips ADD CONSTRAINT fk_shared_trips_trip_id 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Show the updated table structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('password_resets', 'activities', 'trip_cities', 'trip_activities', 'budgets', 'expenses', 'shared_trips')
ORDER BY table_name, ordinal_position;
