-- Enhanced Database Schema for GlobeTrotter with Hybrid Design
-- Combines UUID for security + Auto-increment for performance + Strategic indexing

    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users table (UUID for auth, Auto-increment for display)
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        display_id SERIAL UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20),
        city VARCHAR(100),
        country VARCHAR(100),
        profile_image TEXT,
            email_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Trips table (Auto-increment for performance, UUID for auth)
    CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        display_id SERIAL UNIQUE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
        cover_image TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        share_token VARCHAR(64) UNIQUE,
        allow_copy BOOLEAN DEFAULT FALSE,
        share_expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Cities table (Auto-increment for performance)
    CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        display_id SERIAL UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        timezone VARCHAR(50),
        description TEXT,
        image_url TEXT,
        cost_index INTEGER DEFAULT 50, -- 1-100 scale for cost comparison
        popularity_score INTEGER DEFAULT 0, -- For trending cities
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Activities table (Auto-increment for performance)
    CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        display_id SERIAL UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price_range VARCHAR(20),
        rating DECIMAL(3, 2),
        duration_hours INTEGER,
        city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        image_url TEXT,
        website_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Trip cities (many-to-many relationship)
    CREATE TABLE IF NOT EXISTS trip_cities (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        arrival_date DATE,
        departure_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trip_id, city_id)
    );

    -- Trip activities (many-to-many relationship)
    CREATE TABLE IF NOT EXISTS trip_activities (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        trip_city_id INTEGER REFERENCES trip_cities(id) ON DELETE CASCADE,
        scheduled_date DATE,
        scheduled_time TIME,
        order_index INTEGER,
        notes TEXT,
        estimated_cost DECIMAL(10, 2),
        actual_cost DECIMAL(10, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Budgets table (Auto-increment for performance)
    CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        planned_amount DECIMAL(10, 2) NOT NULL,
        spent_amount DECIMAL(10, 2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'USD',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Expenses table (Auto-increment for performance)
    CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        budget_id INTEGER REFERENCES budgets(id) ON DELETE SET NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        category VARCHAR(100),
        description TEXT,
        expense_date DATE NOT NULL,
        receipt_image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Shared trips table (UUID for security)
    CREATE TABLE IF NOT EXISTS shared_trips (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        share_token VARCHAR(255) UNIQUE,
        permission_level VARCHAR(20) DEFAULT 'read' CHECK (permission_level IN ('read', 'edit')),
        is_public BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- User sessions table (UUID for security)
    CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- ============================================================================
    -- STRATEGIC INDEXING FOR PERFORMANCE AND SCALABILITY
    -- ============================================================================

    -- Performance indexes for auto-increment keys (fast lookups)
    CREATE INDEX IF NOT EXISTS idx_trips_display_id ON trips(display_id);
    CREATE INDEX IF NOT EXISTS idx_cities_display_id ON cities(display_id);
    CREATE INDEX IF NOT EXISTS idx_activities_display_id ON activities(display_id);
    CREATE INDEX IF NOT EXISTS idx_users_display_id ON users(display_id);

    -- Security indexes for UUID keys (auth operations)
    CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
    CREATE INDEX IF NOT EXISTS idx_trip_cities_trip_id ON trip_cities(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trip_activities_trip_id ON trip_activities(trip_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_trip_id ON budgets(trip_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
    CREATE INDEX IF NOT EXISTS idx_shared_trips_trip_id ON shared_trips(trip_id);
    CREATE INDEX IF NOT EXISTS idx_shared_trips_token ON shared_trips(share_token);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

    -- Composite indexes for common query patterns
    CREATE INDEX IF NOT EXISTS idx_trips_user_status ON trips(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_trips_public_status ON trips(is_public, status);
    CREATE INDEX IF NOT EXISTS idx_trip_cities_trip_order ON trip_cities(trip_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_trip_activities_trip_date ON trip_activities(trip_id, scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_expenses_trip_date ON expenses(trip_id, expense_date);
    CREATE INDEX IF NOT EXISTS idx_budgets_trip_category ON budgets(trip_id, category);

    -- Search and filtering indexes
    CREATE INDEX IF NOT EXISTS idx_cities_name_country ON cities(name, country);
    CREATE INDEX IF NOT EXISTS idx_cities_country_popularity ON cities(country, popularity_score);
    CREATE INDEX IF NOT EXISTS idx_activities_city_category ON activities(city_id, category);
    CREATE INDEX IF NOT EXISTS idx_activities_price_rating ON activities(price_range, rating);

    -- Full-text search indexes for advanced search
    CREATE INDEX IF NOT EXISTS idx_cities_search ON cities USING gin(to_tsvector('english', name || ' ' || country || ' ' || COALESCE(description, '')));
    CREATE INDEX IF NOT EXISTS idx_activities_search ON activities USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(category, '')));
    CREATE INDEX IF NOT EXISTS idx_trips_search ON trips USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

    -- Performance indexes for date-based queries
    CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date DESC);
    CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

    -- Spatial indexes for location-based queries (if using PostGIS)
    -- CREATE INDEX IF NOT EXISTS idx_cities_location ON cities USING gist(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
    -- CREATE INDEX IF NOT EXISTS idx_activities_location ON activities USING gist(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

    -- ============================================================================
    -- TRIGGERS FOR AUTOMATIC UPDATES
    -- ============================================================================

    -- Create updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create triggers for updated_at
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- ============================================================================
    -- MATERIALIZED VIEWS FOR ANALYTICS (OPTIONAL - FOR LARGE SCALE)
    -- ============================================================================

    -- Popular cities view (refreshed periodically)
    CREATE MATERIALIZED VIEW IF NOT EXISTS popular_cities AS
    SELECT 
        c.id,
        c.display_id,
        c.name,
        c.country,
        c.popularity_score,
        COUNT(tc.trip_id) as trip_count,
        AVG(t.end_date - t.start_date) as avg_trip_duration
    FROM cities c
    LEFT JOIN trip_cities tc ON c.id = tc.city_id
    LEFT JOIN trips t ON tc.trip_id = t.id
    GROUP BY c.id, c.display_id, c.name, c.country, c.popularity_score
    ORDER BY c.popularity_score DESC, trip_count DESC;

    -- Admin analytics view for user engagement
CREATE MATERIALIZED VIEW IF NOT EXISTS user_analytics AS
SELECT 
    u.id,
    u.display_id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.created_at,
    u.last_login_at,
    COUNT(t.id) as total_trips,
    COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_trips,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_trips,
    COALESCE(SUM(b.planned_amount), 0) as total_budget_planned,
    COALESCE(SUM(b.spent_amount), 0) as total_budget_spent,
    MAX(t.created_at) as last_trip_created
FROM users u
LEFT JOIN trips t ON u.id = t.user_id
LEFT JOIN budgets b ON t.id = b.trip_id
GROUP BY u.id, u.display_id, u.email, u.first_name, u.last_name, u.role, u.created_at, u.last_login_at
ORDER BY u.created_at DESC;

-- Platform statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS platform_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
    (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
    (SELECT COUNT(*) FROM users WHERE last_login_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_7d,
    (SELECT COUNT(*) FROM trips) as total_trips,
    (SELECT COUNT(*) FROM trips WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_trips_30d,
    (SELECT COUNT(*) FROM trips WHERE status = 'active') as active_trips,
    (SELECT COUNT(*) FROM cities) as total_cities,
    (SELECT COUNT(*) FROM activities) as total_activities,
    (SELECT COALESCE(SUM(planned_amount), 0) FROM budgets) as total_budget_planned,
    (SELECT COALESCE(SUM(spent_amount), 0) FROM budgets) as total_budget_spent;

-- Popular activities view
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_activities AS
SELECT 
    a.id,
    a.display_id,
    a.name,
    a.category,
    a.city_id,
    c.name as city_name,
    c.country,
    a.rating,
    a.price_range,
    COUNT(ta.trip_id) as trip_count,
    AVG(ta.estimated_cost) as avg_estimated_cost,
    AVG(ta.actual_cost) as avg_actual_cost
FROM activities a
LEFT JOIN trip_activities ta ON a.id = ta.activity_id
LEFT JOIN cities c ON a.city_id = c.id
GROUP BY a.id, a.display_id, a.name, a.category, a.city_id, c.name, c.country, a.rating, a.price_range
ORDER BY trip_count DESC, a.rating DESC;

-- Create index on materialized views
CREATE INDEX IF NOT EXISTS idx_popular_cities_score ON popular_cities(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_role ON user_analytics(role);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created ON user_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_trips ON user_analytics(total_trips DESC);
CREATE INDEX IF NOT EXISTS idx_popular_activities_count ON popular_activities(trip_count DESC);
CREATE INDEX IF NOT EXISTS idx_popular_activities_category ON popular_activities(category);

    -- ============================================================================
    -- COMMENTS FOR DOCUMENTATION
    -- ============================================================================

    COMMENT ON TABLE users IS 'User accounts with hybrid ID system: UUID for auth, SERIAL for display';
    COMMENT ON TABLE trips IS 'User trips with hybrid ID system: SERIAL for performance, UUID for user references';
    COMMENT ON TABLE cities IS 'Cities with performance-optimized SERIAL IDs and search indexes';
    COMMENT ON TABLE activities IS 'Activities with performance-optimized SERIAL IDs and category filtering';
    COMMENT ON INDEX idx_trips_display_id IS 'Fast lookup for public trip URLs';
    COMMENT ON INDEX idx_cities_search IS 'Full-text search for city discovery';
    COMMENT ON INDEX idx_trips_user_status IS 'Fast filtering of user trips by status';
    COMMENT ON MATERIALIZED VIEW popular_cities IS 'Cached view of popular cities for dashboard performance';
