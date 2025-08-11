-- Sample data for GlobeTrotter Admin Dashboard Testing

-- Create an admin user (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role) VALUES 
('admin@globetrotter.com', '$2b$12$ru7W.J1Xo.EHLLBKsGMDDeN.Qv3Q92tgq64HoJGAAcihRxu5rQonq', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  password = '$2b$12$ru7W.J1Xo.EHLLBKsGMDDeN.Qv3Q92tgq64HoJGAAcihRxu5rQonq';

-- Sample cities data
INSERT INTO cities (name, country, latitude, longitude, timezone, description, cost_index, popularity_score) VALUES
('Paris', 'France', 48.8566, 2.3522, 'Europe/Paris', 'The City of Light', 80, 95),
('Tokyo', 'Japan', 35.6762, 139.6503, 'Asia/Tokyo', 'Japan''s vibrant capital', 85, 90),
('New York', 'United States', 40.7128, -74.0060, 'America/New_York', 'The Big Apple', 90, 88),
('London', 'United Kingdom', 51.5074, -0.1278, 'Europe/London', 'Historic British capital', 85, 87),
('Barcelona', 'Spain', 41.3851, 2.1734, 'Europe/Madrid', 'Catalan cultural hub', 70, 85),
('Rome', 'Italy', 41.9028, 12.4964, 'Europe/Rome', 'The Eternal City', 75, 83),
('Dubai', 'UAE', 25.2048, 55.2708, 'Asia/Dubai', 'Modern desert metropolis', 95, 80),
('Sydney', 'Australia', -33.8688, 151.2093, 'Australia/Sydney', 'Harbor city Down Under', 85, 78),
('Bangkok', 'Thailand', 13.7563, 100.5018, 'Asia/Bangkok', 'Thai cultural center', 50, 75),
('Istanbul', 'Turkey', 41.0082, 28.9784, 'Europe/Istanbul', 'Bridge between continents', 60, 73)
ON CONFLICT DO NOTHING;

-- Sample activities data
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
-- Paris activities
('Eiffel Tower Visit', 'Iconic iron tower and symbol of Paris', 'Landmarks', '$20-40', 4.6, 2, 1, 48.8584, 2.2945),
('Louvre Museum', 'World''s largest art museum', 'Museums', '$15-25', 4.7, 4, 1, 48.8606, 2.3376),
('Seine River Cruise', 'Scenic boat tour along the Seine', 'Tours', '$15-30', 4.4, 1, 1, 48.8566, 2.3522),

-- Tokyo activities  
('Tokyo Skytree', 'World''s tallest tower with city views', 'Landmarks', '$25-35', 4.5, 2, 2, 35.7101, 139.8107),
('Senso-ji Temple', 'Ancient Buddhist temple in Asakusa', 'Cultural', '$0-10', 4.3, 1, 2, 35.7148, 139.7967),
('Tsukiji Fish Market', 'Famous fish market and sushi experience', 'Food & Drink', '$30-60', 4.5, 3, 2, 35.6654, 139.7707),

-- New York activities
('Statue of Liberty', 'Symbol of freedom and democracy', 'Landmarks', '$25-45', 4.4, 3, 3, 40.6892, -74.0445),
('Central Park', 'Massive urban park in Manhattan', 'Nature', '$0-20', 4.6, 2, 3, 40.7829, -73.9654),
('9/11 Memorial', 'Memorial to September 11 attacks', 'Museums', '$25-35', 4.7, 2, 3, 40.7115, -74.0134),

-- London activities
('Big Ben & Parliament', 'Iconic clock tower and government buildings', 'Landmarks', '$0-15', 4.5, 1, 4, 51.4994, -0.1245),
('British Museum', 'World-class museum of human history', 'Museums', '$0-20', 4.6, 3, 4, 51.5194, -0.1270),
('London Eye', 'Giant observation wheel on Thames', 'Entertainment', '$25-40', 4.3, 1, 4, 51.5033, -0.1195)
ON CONFLICT DO NOTHING;

-- Sample trips for testing
INSERT INTO trips (user_id, name, description, start_date, end_date, status, is_public) 
SELECT 
  u.id,
  CASE (ROW_NUMBER() OVER ()) % 5
    WHEN 0 THEN 'European Adventure'
    WHEN 1 THEN 'Asian Discovery'
    WHEN 2 THEN 'American Road Trip'
    WHEN 3 THEN 'Mediterranean Cruise'
    ELSE 'City Break Weekend'
  END,
  'Sample trip for testing admin dashboard',
  CURRENT_DATE + (ROW_NUMBER() OVER ()) * INTERVAL '30 days',
  CURRENT_DATE + (ROW_NUMBER() OVER ()) * INTERVAL '37 days',
  CASE (ROW_NUMBER() OVER ()) % 3
    WHEN 0 THEN 'planning'
    WHEN 1 THEN 'active'
    ELSE 'completed'
  END,
  (ROW_NUMBER() OVER ()) % 4 = 0
FROM users u
WHERE u.role = 'user'
AND u.id IN (SELECT id FROM users WHERE role = 'user' ORDER BY created_at LIMIT 10);

-- Sample budgets
INSERT INTO budgets (trip_id, category, planned_amount, spent_amount, currency)
SELECT 
  t.id,
  CASE (ROW_NUMBER() OVER ()) % 4
    WHEN 0 THEN 'Accommodation'
    WHEN 1 THEN 'Transportation'
    WHEN 2 THEN 'Food & Dining'
    ELSE 'Activities'
  END,
  (500 + (ROW_NUMBER() OVER ()) * 100)::DECIMAL,
  CASE t.status
    WHEN 'completed' THEN (400 + (ROW_NUMBER() OVER ()) * 80)::DECIMAL
    WHEN 'active' THEN (200 + (ROW_NUMBER() OVER ()) * 50)::DECIMAL
    ELSE 0
  END,
  'USD'
FROM trips t
LIMIT 50;

-- Link some cities to trips
INSERT INTO trip_cities (trip_id, city_id, order_index, arrival_date, departure_date)
SELECT 
  t.id,
  ((ROW_NUMBER() OVER ()) % 10) + 1,
  1,
  t.start_date,
  t.start_date + INTERVAL '3 days'
FROM trips t
LIMIT 20;

-- Link some activities to trips
INSERT INTO trip_activities (trip_id, activity_id, trip_city_id, scheduled_date, order_index, estimated_cost)
SELECT 
  tc.trip_id,
  ((ROW_NUMBER() OVER ()) % 10) + 1,
  tc.id,
  tc.arrival_date + INTERVAL '1 day',
  1,
  (25 + (ROW_NUMBER() OVER ()) * 10)::DECIMAL
FROM trip_cities tc
LIMIT 30;

-- Refresh materialized views
REFRESH MATERIALIZED VIEW popular_cities;
REFRESH MATERIALIZED VIEW user_analytics;
REFRESH MATERIALIZED VIEW platform_stats;
REFRESH MATERIALIZED VIEW popular_activities;

-- Update some users' last login times for realistic data
UPDATE users 
SET last_login_at = CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '30 days')
WHERE role = 'user';

-- Final message
SELECT 'Sample admin data has been inserted successfully!' as message;
