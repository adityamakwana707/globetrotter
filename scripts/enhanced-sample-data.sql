-- Enhanced Sample Data for GlobeTrotter with Hybrid ID System
-- Includes cost indexes, popularity scores, and realistic data

-- Insert sample users with hybrid ID system and admin roles
INSERT INTO users (email, password, first_name, last_name, phone_number, city, country, email_verified, role, last_login_at) VALUES
('john.doe@example.com', '$2a$12$LQv3c1yqBw3Vr1.4nF7/Ae7qP8Q9rZ5sT6uX2vY8wA3bC4dE5fG6h', 'John', 'Doe', '+1-555-0123', 'New York', 'USA', true, 'user', '2024-01-15 10:30:00'),
('jane.smith@example.com', '$2a$12$LQv3c1yqBw3Vr1.4nF7/Ae7qP8Q9rZ5sT6uX2vY8wA3bC4dE5fG6h', 'Jane', 'Smith', '+1-555-0124', 'London', 'UK', true, 'user', '2024-01-14 15:45:00'),
('alex.johnson@example.com', '$2a$12$LQv3c1yqBw3Vr1.4nF7/Ae7qP8Q9rZ5sT6uX2vY8wA3bC4dE5fG6h', 'Alex', 'Johnson', '+1-555-0125', 'Sydney', 'Australia', true, 'user', '2024-01-13 09:20:00'),
('maria.garcia@example.com', '$2a$12$LQv3c1yqBw3Vr1.4nF7/Ae7qP8Q9rZ5sT6uX2vY8wA3bC4dE5fG6h', 'Maria', 'Garcia', '+34-600-123456', 'Barcelona', 'Spain', true, 'moderator', '2024-01-12 14:15:00'),
('admin@globetrotter.com', '$2a$12$LQv3c1yqBw3Vr1.4nF7/Ae7qP8Q9rZ5sT6uX2vY8wA3bC4dE5fG6h', 'Admin', 'User', '+1-555-0001', 'San Francisco', 'USA', true, 'admin', '2024-01-15 16:00:00');

-- Insert cities with enhanced data (cost_index and popularity_score)
INSERT INTO cities (name, country, latitude, longitude, timezone, description, image_url, cost_index, popularity_score) VALUES
-- Top Tier Destinations (High Cost, High Popularity)
('Paris', 'France', 48.8566, 2.3522, 'Europe/Paris', 'The City of Light, famous for the Eiffel Tower, Louvre Museum, and romantic atmosphere.', '/images/cities/paris.jpg', 85, 95),
('London', 'United Kingdom', 51.5074, -0.1278, 'Europe/London', 'Historic capital with Big Ben, Tower Bridge, and world-class museums.', '/images/cities/london.jpg', 88, 92),
('New York', 'United States', 40.7128, -74.0060, 'America/New_York', 'The Big Apple - iconic skyline, Broadway shows, and Central Park.', '/images/cities/new-york.jpg', 90, 94),
('Tokyo', 'Japan', 35.6762, 139.6503, 'Asia/Tokyo', 'Modern metropolis blending traditional culture with cutting-edge technology.', '/images/cities/tokyo.jpg', 82, 91),
('Sydney', 'Australia', -33.8688, 151.2093, 'Australia/Sydney', 'Harbor city with Opera House, Harbour Bridge, and beautiful beaches.', '/images/cities/sydney.jpg', 80, 88),

-- Mid Tier Destinations (Medium Cost, High Popularity)
('Barcelona', 'Spain', 41.3851, 2.1734, 'Europe/Madrid', 'Vibrant city with Gaudí architecture, beaches, and fantastic food scene.', '/images/cities/barcelona.jpg', 65, 89),
('Rome', 'Italy', 41.9028, 12.4964, 'Europe/Rome', 'Eternal City with Colosseum, Vatican, and incredible historical sites.', '/images/cities/rome.jpg', 70, 90),
('Amsterdam', 'Netherlands', 52.3676, 4.9041, 'Europe/Amsterdam', 'Canal city with museums, cycling culture, and liberal atmosphere.', '/images/cities/amsterdam.jpg', 75, 85),
('Prague', 'Czech Republic', 50.0755, 14.4378, 'Europe/Prague', 'Medieval charm with stunning architecture and affordable luxury.', '/images/cities/prague.jpg', 45, 83),
('Istanbul', 'Turkey', 41.0082, 28.9784, 'Europe/Istanbul', 'Where East meets West - rich history, amazing food, and vibrant culture.', '/images/cities/istanbul.jpg', 40, 86),

-- Budget-Friendly Destinations (Low Cost, Growing Popularity)
('Bangkok', 'Thailand', 13.7563, 100.5018, 'Asia/Bangkok', 'Street food paradise with temples, markets, and vibrant nightlife.', '/images/cities/bangkok.jpg', 30, 87),
('Lisbon', 'Portugal', 38.7223, -9.1393, 'Europe/Lisbon', 'Charming coastal capital with trams, pastries, and colorful architecture.', '/images/cities/lisbon.jpg', 50, 84),
('Budapest', 'Hungary', 47.4979, 19.0402, 'Europe/Budapest', 'Thermal baths, stunning parliament, and affordable elegance.', '/images/cities/budapest.jpg', 42, 81),
('Mexico City', 'Mexico', 19.4326, -99.1332, 'America/Mexico_City', 'Cultural hub with incredible museums, food, and vibrant neighborhoods.', '/images/cities/mexico-city.jpg', 35, 79),
('Bali', 'Indonesia', -8.3405, 115.0920, 'Asia/Makassar', 'Tropical paradise with temples, rice terraces, and wellness retreats.', '/images/cities/bali.jpg', 25, 93),

-- Emerging Destinations (Various Costs, Growing Popularity)
('Dubai', 'United Arab Emirates', 25.2048, 55.2708, 'Asia/Dubai', 'Futuristic city with luxury shopping, modern architecture, and desert adventures.', '/images/cities/dubai.jpg', 78, 82),
('Cape Town', 'South Africa', -33.9249, 18.4241, 'Africa/Johannesburg', 'Stunning landscapes with Table Mountain, wine regions, and rich history.', '/images/cities/cape-town.jpg', 38, 76),
('Reykjavik', 'Iceland', 64.1466, -21.9426, 'Atlantic/Reykjavik', 'Gateway to natural wonders - Northern Lights, geysers, and Blue Lagoon.', '/images/cities/reykjavik.jpg', 85, 78),
('Singapore', 'Singapore', 1.3521, 103.8198, 'Asia/Singapore', 'Garden city with incredible food, modern architecture, and efficient transport.', '/images/cities/singapore.jpg', 85, 87),
('Vienna', 'Austria', 48.2082, 16.3738, 'Europe/Vienna', 'Imperial elegance with palaces, coffee culture, and classical music.', '/images/cities/vienna.jpg', 68, 80);

-- Insert activities with enhanced data
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude, image_url, website_url) VALUES
-- Paris Activities
('Eiffel Tower Visit', 'Iconic iron tower with panoramic city views from multiple levels', 'Sightseeing', '$$$', 4.6, 3, 1, 48.8584, 2.2945, '/images/activities/eiffel-tower.jpg', 'https://www.toureiffel.paris'),
('Louvre Museum', 'World''s largest art museum housing the Mona Lisa and countless masterpieces', 'Museums', '$$', 4.5, 4, 1, 48.8606, 2.3376, '/images/activities/louvre.jpg', 'https://www.louvre.fr'),
('Seine River Cruise', 'Romantic boat ride along the Seine with views of major landmarks', 'Tours', '$$', 4.3, 2, 1, 48.8566, 2.3522, '/images/activities/seine-cruise.jpg', NULL),
('Montmartre Walking Tour', 'Explore the artistic neighborhood with Sacré-Cœur and street artists', 'Tours', '$', 4.4, 3, 1, 48.8867, 2.3431, '/images/activities/montmartre.jpg', NULL),
('French Cooking Class', 'Learn to cook traditional French dishes with a professional chef', 'Food & Dining', '$$$', 4.7, 4, 1, 48.8566, 2.3522, '/images/activities/cooking-class.jpg', NULL),

-- London Activities
('Tower of London', 'Historic castle housing the Crown Jewels and centuries of history', 'Sightseeing', '$$$', 4.4, 3, 2, 51.5081, -0.0759, '/images/activities/tower-london.jpg', 'https://www.hrp.org.uk/tower-of-london'),
('British Museum', 'World-renowned museum with artifacts from ancient civilizations', 'Museums', '$$', 4.5, 4, 2, 51.5194, -0.1270, '/images/activities/british-museum.jpg', 'https://www.britishmuseum.org'),
('West End Show', 'World-class theater productions in London''s famous theater district', 'Entertainment', '$$$$', 4.8, 3, 2, 51.5130, -0.1319, '/images/activities/west-end.jpg', NULL),
('Camden Market', 'Eclectic market with vintage finds, street food, and live music', 'Shopping', '$', 4.2, 2, 2, 51.5434, -0.1420, '/images/activities/camden-market.jpg', NULL),
('Thames Pub Crawl', 'Traditional pub experience along the historic Thames riverside', 'Food & Dining', '$$', 4.3, 4, 2, 51.5074, -0.1278, '/images/activities/pub-crawl.jpg', NULL),

-- New York Activities
('Statue of Liberty', 'Symbol of freedom with ferry ride and crown access available', 'Sightseeing', '$$$', 4.5, 4, 3, 40.6892, -74.0445, '/images/activities/statue-liberty.jpg', 'https://www.nps.gov/stli'),
('Central Park', 'Iconic urban park perfect for walking, boating, and people-watching', 'Outdoor', 'Free', 4.6, 3, 3, 40.7829, -73.9654, '/images/activities/central-park.jpg', NULL),
('Broadway Show', 'World-famous theater district with top-tier musical productions', 'Entertainment', '$$$$', 4.8, 3, 3, 40.7590, -73.9845, '/images/activities/broadway.jpg', NULL),
('9/11 Memorial', 'Moving tribute to those lost with museum and memorial pools', 'Museums', '$$', 4.7, 3, 3, 40.7115, -74.0134, '/images/activities/911-memorial.jpg', 'https://www.911memorial.org'),
('Food Tour', 'Culinary adventure through diverse neighborhoods and cuisines', 'Food & Dining', '$$$', 4.5, 4, 3, 40.7128, -74.0060, '/images/activities/food-tour.jpg', NULL),

-- Tokyo Activities
('Senso-ji Temple', 'Ancient Buddhist temple in historic Asakusa district', 'Cultural', 'Free', 4.3, 2, 4, 35.7148, 139.7967, '/images/activities/sensoji.jpg', NULL),
('Tsukiji Fish Market', 'World''s largest fish market with incredible sushi breakfast', 'Food & Dining', '$$', 4.4, 3, 4, 35.6654, 139.7707, '/images/activities/tsukiji.jpg', NULL),
('Tokyo Skytree', 'Tallest structure in Japan with breathtaking city views', 'Sightseeing', '$$$', 4.2, 2, 4, 35.7101, 139.8107, '/images/activities/skytree.jpg', 'https://www.tokyo-skytree.jp'),
('Shibuya Crossing', 'World''s busiest pedestrian crossing and urban experience', 'Sightseeing', 'Free', 4.1, 1, 4, 35.6598, 139.7006, '/images/activities/shibuya.jpg', NULL),
('Karaoke Night', 'Traditional Japanese karaoke experience in private rooms', 'Entertainment', '$$', 4.6, 3, 4, 35.6762, 139.6503, '/images/activities/karaoke.jpg', NULL),

-- Sydney Activities
('Sydney Opera House', 'Architectural masterpiece with world-class performances', 'Entertainment', '$$$', 4.5, 3, 5, -33.8568, 151.2153, '/images/activities/opera-house.jpg', 'https://www.sydneyoperahouse.com'),
('Harbour Bridge Climb', 'Thrilling climb to the top of the iconic bridge', 'Adventure', '$$$$', 4.8, 4, 5, -33.8523, 151.2108, '/images/activities/bridge-climb.jpg', 'https://www.bridgeclimb.com'),
('Bondi Beach', 'Famous beach perfect for surfing, swimming, and coastal walks', 'Outdoor', 'Free', 4.4, 4, 5, -33.8915, 151.2767, '/images/activities/bondi-beach.jpg', NULL),
('Blue Mountains Day Trip', 'Scenic mountain region with hiking trails and scenic railways', 'Outdoor', '$$', 4.5, 8, 5, -33.7022, 150.3111, '/images/activities/blue-mountains.jpg', NULL),
('Wine Tasting Tour', 'Explore nearby wine regions with tastings and vineyard tours', 'Food & Dining', '$$$', 4.6, 6, 5, -33.8688, 151.2093, '/images/activities/wine-tour.jpg', NULL);

-- Insert more activities for other cities (abbreviated for space)
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
-- Barcelona
('Sagrada Familia', 'Gaudí''s unfinished masterpiece and Barcelona''s most famous landmark', 'Sightseeing', '$$$', 4.7, 2, 6, 41.4036, 2.1744),
('Park Güell', 'Whimsical park designed by Gaudí with colorful mosaics and city views', 'Outdoor', '$$', 4.4, 3, 6, 41.4145, 2.1527),
('Las Ramblas Walk', 'Famous pedestrian street with street performers and local atmosphere', 'Sightseeing', 'Free', 4.1, 2, 6, 41.3818, 2.1700),
('Tapas Tour', 'Authentic Spanish tapas experience in local neighborhoods', 'Food & Dining', '$$', 4.6, 4, 6, 41.3851, 2.1734),

-- Rome
('Colosseum', 'Ancient amphitheater and symbol of Imperial Rome', 'Sightseeing', '$$$', 4.6, 3, 7, 41.8902, 12.4922),
('Vatican Museums', 'Incredible art collection including the Sistine Chapel', 'Museums', '$$$', 4.5, 4, 7, 41.9029, 12.4534),
('Trevi Fountain', 'Baroque fountain where tradition says to throw a coin for return', 'Sightseeing', 'Free', 4.5, 1, 7, 41.9009, 12.4833),
('Roman Food Tour', 'Culinary journey through authentic Roman cuisine', 'Food & Dining', '$$', 4.7, 4, 7, 41.9028, 12.4964),

-- Bangkok
('Grand Palace', 'Ornate complex of buildings that served as royal residence', 'Cultural', '$$', 4.4, 3, 11, 13.7500, 100.4915),
('Floating Market', 'Traditional market on boats selling fresh produce and local food', 'Shopping', '$', 4.3, 4, 11, 13.7563, 100.5018),
('Thai Massage', 'Traditional therapeutic massage in authentic spa setting', 'Wellness', '$', 4.6, 2, 11, 13.7563, 100.5018),
('Street Food Tour', 'Explore Bangkok''s incredible street food scene with local guide', 'Food & Dining', '$', 4.8, 4, 11, 13.7563, 100.5018);

-- Create some sample trips for demonstration
INSERT INTO trips (user_id, name, description, start_date, end_date, status, is_public) VALUES
((SELECT id FROM users WHERE email = 'john.doe@example.com'), 'European Adventure', 'Two-week journey through Europe''s most beautiful cities', '2024-06-15', '2024-06-29', 'planning', true),
((SELECT id FROM users WHERE email = 'jane.smith@example.com'), 'Asian Discovery', 'Exploring the vibrant cultures of Asia', '2024-07-01', '2024-07-14', 'planning', false),
((SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 'American Road Trip', 'Coast to coast adventure across America', '2024-05-01', '2024-05-15', 'completed', true),
((SELECT id FROM users WHERE email = 'maria.garcia@example.com'), 'Mediterranean Cruise', 'Relaxing cruise through Mediterranean ports', '2024-08-10', '2024-08-20', 'active', false);

-- Add cities to trips
INSERT INTO trip_cities (trip_id, city_id, order_index, arrival_date, departure_date) VALUES
-- European Adventure
(1, 1, 1, '2024-06-15', '2024-06-18'), -- Paris
(1, 2, 2, '2024-06-18', '2024-06-22'), -- London
(1, 7, 3, '2024-06-22', '2024-06-26'), -- Rome
(1, 6, 4, '2024-06-26', '2024-06-29'), -- Barcelona

-- Asian Discovery
(2, 4, 1, '2024-07-01', '2024-07-07'), -- Tokyo
(2, 11, 2, '2024-07-07', '2024-07-14'), -- Bangkok

-- American Road Trip
(3, 3, 1, '2024-05-01', '2024-05-08'), -- New York
(3, 5, 2, '2024-05-08', '2024-05-15'); -- Sydney (for demo purposes)

-- Add activities to trips
INSERT INTO trip_activities (trip_id, activity_id, trip_city_id, scheduled_date, scheduled_time, order_index, estimated_cost, notes) VALUES
-- European Adventure - Paris
(1, 1, 1, '2024-06-15', '10:00:00', 1, 25.00, 'Book tickets in advance'),
(1, 2, 1, '2024-06-16', '09:00:00', 2, 17.00, 'Skip-the-line tickets recommended'),
(1, 3, 1, '2024-06-17', '19:00:00', 3, 35.00, 'Sunset cruise'),

-- European Adventure - London
(1, 6, 2, '2024-06-19', '10:00:00', 1, 28.00, 'Crown Jewels tour'),
(1, 7, 2, '2024-06-20', '14:00:00', 2, 15.00, 'Free admission'),
(1, 8, 2, '2024-06-21', '19:30:00', 3, 85.00, 'Book well in advance');

-- Create sample budgets
INSERT INTO budgets (trip_id, category, planned_amount, currency) VALUES
(1, 'Accommodation', 1200.00, 'EUR'),
(1, 'Transportation', 800.00, 'EUR'),
(1, 'Food & Dining', 600.00, 'EUR'),
(1, 'Activities', 400.00, 'EUR'),
(1, 'Shopping', 300.00, 'EUR'),
(1, 'Emergency', 200.00, 'EUR'),

(2, 'Accommodation', 800.00, 'USD'),
(2, 'Transportation', 600.00, 'USD'),
(2, 'Food & Dining', 400.00, 'USD'),
(2, 'Activities', 300.00, 'USD');

-- Create sample expenses
INSERT INTO expenses (trip_id, budget_id, user_id, amount, currency, category, description, expense_date) VALUES
(3, NULL, (SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 150.00, 'USD', 'Transportation', 'Flight to New York', '2024-05-01'),
(3, NULL, (SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 85.00, 'USD', 'Accommodation', 'Hotel night 1', '2024-05-01'),
(3, NULL, (SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 45.00, 'USD', 'Food & Dining', 'Dinner at local restaurant', '2024-05-01'),
(3, NULL, (SELECT id FROM users WHERE email = 'alex.johnson@example.com'), 25.00, 'USD', 'Activities', 'Statue of Liberty tickets', '2024-05-02');

-- Refresh materialized views
REFRESH MATERIALIZED VIEW popular_cities;
REFRESH MATERIALIZED VIEW user_analytics;
REFRESH MATERIALIZED VIEW platform_stats;
REFRESH MATERIALIZED VIEW popular_activities;
