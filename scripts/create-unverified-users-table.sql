-- Create unverified_users table for users who haven't verified their email yet
CREATE TABLE IF NOT EXISTS unverified_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_unverified_users_email ON unverified_users(email);

-- Add index on created_at for cleanup operations
CREATE INDEX IF NOT EXISTS idx_unverified_users_created_at ON unverified_users(created_at);

-- Add comment
COMMENT ON TABLE unverified_users IS 'Temporary storage for users who have registered but not verified their email';
