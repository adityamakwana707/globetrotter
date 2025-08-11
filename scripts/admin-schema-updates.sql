-- Add missing columns to cities table for admin management
ALTER TABLE cities ADD COLUMN IF NOT EXISTS population INTEGER;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to activities table for admin management  
ALTER TABLE activities ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS min_group_size INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS max_group_size INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
