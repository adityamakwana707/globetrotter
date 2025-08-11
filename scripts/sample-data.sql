-- Insert sample data for GlobeTrotter application
-- Generated on: August 11, 2025

-- Sample cities with enhanced descriptions
INSERT INTO cities (name, country, latitude, longitude, timezone, description) VALUES
('Paris', 'France', 48.8566, 2.3522, 'Europe/Paris', 'The City of Light, known for its art, fashion, and culture. Home to iconic landmarks like the Eiffel Tower and Louvre.'),
('Tokyo', 'Japan', 35.6762, 139.6503, 'Asia/Tokyo', 'A bustling metropolis blending traditional and modern culture. Experience ancient temples alongside futuristic technology.'),
('New York', 'United States', 40.7128, -74.0060, 'America/New_York', 'The city that never sleeps. Broadway shows, world-class museums, and incredible skyline views.'),
('London', 'United Kingdom', 51.5074, -0.1278, 'Europe/London', 'Historic city with royal heritage and modern attractions. From Big Ben to modern Shard, history meets innovation.'),
('Bali', 'Indonesia', -8.3405, 115.0920, 'Asia/Makassar', 'Tropical paradise with beautiful beaches and temples. Perfect blend of spirituality, nature, and relaxation.'),
('Rome', 'Italy', 41.9028, 12.4964, 'Europe/Rome', 'The Eternal City with ancient history and amazing cuisine. Walk through 2000+ years of history.'),
('Barcelona', 'Spain', 41.3851, 2.1734, 'Europe/Madrid', 'Vibrant city known for Gaudí architecture and Mediterranean culture. Art, beaches, and incredible food scene.'),
('Sydney', 'Australia', -33.8688, 151.2093, 'Australia/Sydney', 'Harbor city with iconic Opera House and beautiful beaches. Gateway to Australian adventures.'),
('Dubai', 'UAE', 25.2048, 55.2708, 'Asia/Dubai', 'Futuristic city of luxury and innovation. From desert safaris to world-class shopping and dining.'),
('Amsterdam', 'Netherlands', 52.3676, 4.9041, 'Europe/Amsterdam', 'City of canals, bikes, and cultural treasures. Rich history, vibrant nightlife, and artistic heritage.'),
('Bangkok', 'Thailand', 13.7563, 100.5018, 'Asia/Bangkok', 'Vibrant capital known for ornate shrines, street food, and bustling markets. Gateway to Southeast Asia.'),
('Santorini', 'Greece', 36.3932, 25.4615, 'Europe/Athens', 'Stunning Greek island with white-washed buildings, blue domes, and breathtaking sunsets.'),
('Singapore', 'Singapore', 1.3521, 103.8198, 'Asia/Singapore', 'Modern city-state blending cultures, cuisines, and cutting-edge architecture in tropical setting.'),
('Marrakech', 'Morocco', 31.6295, -7.9811, 'Africa/Casablanca', 'Imperial city with vibrant souks, stunning palaces, and rich Berber culture in the Atlas Mountains foothills.'),
('Rio de Janeiro', 'Brazil', -22.9068, -43.1729, 'America/Sao_Paulo', 'Cidade Maravilhosa with stunning beaches, Christ the Redeemer, and vibrant carnival culture.');

-- Sample users with different roles and backgrounds
INSERT INTO users (id, name, email, password_hash, role, avatar_url, bio, created_at, last_login) VALUES
(1, 'Admin User', 'admin@globetrotter.com', '$2a$10$hashedpassword123', 'admin', 'https://i.pravatar.cc/150?u=admin', 'Platform administrator managing the GlobeTrotter community.', '2024-01-15 10:30:00', '2025-08-11 09:15:00'),
(2, 'Sarah Johnson', 'sarah.johnson@email.com', '$2a$10$hashedpassword456', 'user', 'https://i.pravatar.cc/150?u=sarah', 'Travel enthusiast and photographer. Love exploring hidden gems and sharing travel stories!', '2024-03-20 14:22:00', '2025-08-10 18:45:00'),
(3, 'Marco Rodriguez', 'marco.rodriguez@email.com', '$2a$10$hashedpassword789', 'user', 'https://i.pravatar.cc/150?u=marco', 'Adventure seeker from Spain. Passionate about mountain climbing and cultural immersion.', '2024-05-12 11:15:00', '2025-08-09 20:30:00'),
(4, 'Emily Chen', 'emily.chen@email.com', '$2a$10$hashedpassword101', 'moderator', 'https://i.pravatar.cc/150?u=emily', 'Travel moderator and food blogger. Helping travelers discover authentic local experiences.', '2024-02-08 16:45:00', '2025-08-11 07:20:00'),
(5, 'David Thompson', 'david.thompson@email.com', '$2a$10$hashedpassword202', 'user', 'https://i.pravatar.cc/150?u=david', 'Business traveler turned leisure explorer. Expert in efficient travel planning and budget optimization.', '2024-06-30 09:30:00', '2025-08-08 15:10:00'),
(6, 'Priya Patel', 'priya.patel@email.com', '$2a$10$hashedpassword303', 'user', 'https://i.pravatar.cc/150?u=priya', 'Solo female traveler advocating for safe and empowering travel experiences worldwide.', '2024-04-18 13:20:00', '2025-08-10 21:15:00'),
(7, 'James Wilson', 'james.wilson@email.com', '$2a$10$hashedpassword404', 'user', 'https://i.pravatar.cc/150?u=james', 'Family travel planner and budget travel expert. Making travel accessible for everyone.', '2024-07-22 10:45:00', '2025-08-09 16:30:00'),
(8, 'Isabella Costa', 'isabella.costa@email.com', '$2a$10$hashedpassword505', 'user', 'https://i.pravatar.cc/150?u=isabella', 'Luxury travel consultant and cultural enthusiast. Curating extraordinary experiences around the globe.', '2024-01-25 12:10:00', '2025-08-11 11:25:00');

-- Sample activities for Paris
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Eiffel Tower Visit', 'Iconic iron tower and symbol of Paris with stunning city views', 'Sightseeing', '€25-50', 4.5, 3, (SELECT id FROM cities WHERE name = 'Paris'), 48.8584, 2.2945),
('Louvre Museum', 'World famous art museum home to the Mona Lisa and countless masterpieces', 'Museum', '€15-25', 4.7, 4, (SELECT id FROM cities WHERE name = 'Paris'), 48.8606, 2.3376),
('Seine River Cruise', 'Scenic boat tour along the Seine River with commentary', 'Tour', '€15-30', 4.3, 2, (SELECT id FROM cities WHERE name = 'Paris'), 48.8566, 2.3522),
('Montmartre Walking Tour', 'Explore the artistic district of Montmartre and Sacré-Cœur', 'Walking Tour', '€20-40', 4.4, 3, (SELECT id FROM cities WHERE name = 'Paris'), 48.8867, 2.3431),
('Arc de Triomphe', 'Iconic triumphal arch with panoramic views of Champs-Élysées', 'Sightseeing', '€13-20', 4.2, 1, (SELECT id FROM cities WHERE name = 'Paris'), 48.8738, 2.2950),
('Notre-Dame Cathedral', 'Gothic cathedral masterpiece (exterior visit during restoration)', 'Historical', 'Free', 4.1, 1, (SELECT id FROM cities WHERE name = 'Paris'), 48.8530, 2.3499),
('Latin Quarter Food Tour', 'Culinary journey through historic Latin Quarter', 'Food', '€60-80', 4.6, 3, (SELECT id FROM cities WHERE name = 'Paris'), 48.8503, 2.3440);

-- Sample activities for Tokyo
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Senso-ji Temple', 'Ancient Buddhist temple in Asakusa district with traditional shopping street', 'Cultural', 'Free', 4.6, 2, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.7148, 139.7967),
('Tokyo Skytree', 'Tallest structure in Japan with panoramic views and shopping complex', 'Sightseeing', '¥2000-3000', 4.4, 2, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.7101, 139.8107),
('Tsukiji Outer Market', 'Famous fish market with fresh sushi and street food', 'Food', '¥3000-5000', 4.5, 3, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.6654, 139.7707),
('Shibuya Crossing', 'World famous pedestrian crossing and shopping district', 'Sightseeing', 'Free', 4.2, 1, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.6598, 139.7006),
('Meiji Shrine', 'Peaceful Shinto shrine dedicated to Emperor Meiji', 'Cultural', 'Free', 4.3, 2, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.6761, 139.6993),
('Robot Restaurant Show', 'Unique entertainment experience with robots and neon lights', 'Entertainment', '¥8000-12000', 3.9, 2, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.6949, 139.7030),
('TeamLab Borderless', 'Digital art museum with immersive interactive exhibits', 'Museum', '¥3200-4000', 4.7, 4, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.6252, 139.7756);

-- Sample activities for New York
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Statue of Liberty', 'Iconic symbol of freedom with ferry ride and museum', 'Sightseeing', '$25-50', 4.5, 4, (SELECT id FROM cities WHERE name = 'New York'), 40.6892, -74.0445),
('Central Park', 'Large public park perfect for walking, picnics, and boat rides', 'Nature', 'Free', 4.7, 3, (SELECT id FROM cities WHERE name = 'New York'), 40.7829, -73.9654),
('Broadway Show', 'World-class theater performances in the Theater District', 'Entertainment', '$100-300', 4.8, 3, (SELECT id FROM cities WHERE name = 'New York'), 40.7590, -73.9845),
('9/11 Memorial', 'Moving memorial honoring victims of September 11 attacks', 'Memorial', '$25-30', 4.6, 2, (SELECT id FROM cities WHERE name = 'New York'), 40.7115, -74.0134),
('Empire State Building', 'Art Deco skyscraper with iconic city views', 'Sightseeing', '$37-60', 4.3, 2, (SELECT id FROM cities WHERE name = 'New York'), 40.7484, -73.9857),
('Metropolitan Museum', 'One of the world largest and most comprehensive art museums', 'Museum', '$25-30', 4.6, 4, (SELECT id FROM cities WHERE name = 'New York'), 40.7794, -73.9632),
('High Line Walk', 'Elevated linear park built on former railway line', 'Nature', 'Free', 4.4, 2, (SELECT id FROM cities WHERE name = 'New York'), 40.7480, -74.0048);

-- Sample activities for London
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Tower of London', 'Historic castle and home of Crown Jewels with Yeoman Warder tours', 'Historical', '£25-30', 4.4, 3, (SELECT id FROM cities WHERE name = 'London'), 51.5081, -0.0759),
('British Museum', 'World-famous museum of art and artifacts spanning human history', 'Museum', 'Free', 4.5, 4, (SELECT id FROM cities WHERE name = 'London'), 51.5194, -0.1270),
('London Eye', 'Giant observation wheel with breathtaking views of London skyline', 'Sightseeing', '£25-35', 4.2, 1, (SELECT id FROM cities WHERE name = 'London'), 51.5033, -0.1196),
('Westminster Abbey', 'Gothic abbey church where monarchs are crowned', 'Religious', '£20-25', 4.4, 2, (SELECT id FROM cities WHERE name = 'London'), 51.4994, -0.1273),
('Buckingham Palace', 'Official residence of British monarchs with Changing of Guard', 'Historical', 'Free-£30', 4.1, 2, (SELECT id FROM cities WHERE name = 'London'), 51.5014, -0.1419),
('Thames River Cruise', 'Scenic boat journey past London landmarks', 'Tour', '£15-25', 4.3, 2, (SELECT id FROM cities WHERE name = 'London'), 51.5074, -0.1278),
('Camden Market', 'Eclectic market with food, crafts, and vintage finds', 'Shopping', 'Free entry', 4.0, 3, (SELECT id FROM cities WHERE name = 'London'), 51.5434, -0.1459);

-- Sample activities for Bali
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Tanah Lot Temple', 'Stunning rock formation temple especially beautiful at sunset', 'Religious', 'Rp50000', 4.3, 2, (SELECT id FROM cities WHERE name = 'Bali'), -8.6212, 115.0868),
('Ubud Monkey Forest', 'Nature reserve and Hindu temple complex with playful monkeys', 'Nature', 'Rp80000', 4.1, 2, (SELECT id FROM cities WHERE name = 'Bali'), -8.5069, 115.2581),
('Kuta Beach', 'Popular beach for surfing, sunbathing, and vibrant nightlife', 'Beach', 'Free', 4.0, 4, (SELECT id FROM cities WHERE name = 'Bali'), -8.7183, 115.1686),
('Mount Batur Sunrise Trek', 'Active volcano hiking experience with spectacular sunrise views', 'Adventure', 'Rp500000', 4.4, 8, (SELECT id FROM cities WHERE name = 'Bali'), -8.2421, 115.3725),
('Tegallalang Rice Terraces', 'Stunning stepped rice paddies perfect for photography', 'Nature', 'Rp10000', 4.2, 2, (SELECT id FROM cities WHERE name = 'Bali'), -8.4305, 115.2713),
('Uluwatu Temple', 'Clifftop temple with ocean views and traditional Kecak dance', 'Cultural', 'Rp50000', 4.4, 3, (SELECT id FROM cities WHERE name = 'Bali'), -8.8291, 115.0864),
('Bali Cooking Class', 'Learn traditional Balinese cuisine with market tour', 'Food', 'Rp400000', 4.6, 6, (SELECT id FROM cities WHERE name = 'Bali'), -8.3405, 115.0920);

-- Sample activities for Rome
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Colosseum', 'Ancient Roman amphitheater with gladiator history tours', 'Historical', '€16-25', 4.5, 2, (SELECT id FROM cities WHERE name = 'Rome'), 41.8902, 12.4922),
('Vatican Museums', 'Papal museums with Sistine Chapel and Michelangelo masterpieces', 'Museum', '€17-30', 4.6, 4, (SELECT id FROM cities WHERE name = 'Rome'), 41.9065, 12.4536),
('Trevi Fountain', 'Baroque fountain where coins thrown grant return to Rome', 'Sightseeing', 'Free', 4.3, 1, (SELECT id FROM cities WHERE name = 'Rome'), 41.9009, 12.4833),
('Roman Forum', 'Ancient Roman public square and heart of the empire', 'Historical', '€16-25', 4.4, 3, (SELECT id FROM cities WHERE name = 'Rome'), 41.8925, 12.4853),
('Pantheon', 'Best-preserved Roman building with impressive dome architecture', 'Historical', 'Free', 4.5, 1, (SELECT id FROM cities WHERE name = 'Rome'), 41.8986, 12.4769),
('Trastevere Food Tour', 'Culinary exploration of Rome charming neighborhood', 'Food', '€60-80', 4.5, 4, (SELECT id FROM cities WHERE name = 'Rome'), 41.8896, 12.4697),
('Spanish Steps', 'Famous stairway connecting Piazza di Spagna with shopping district', 'Sightseeing', 'Free', 4.1, 1, (SELECT id FROM cities WHERE name = 'Rome'), 41.9060, 12.4823);

-- Additional activities for new cities
-- Barcelona activities
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Sagrada Familia', 'Gaudí iconic unfinished basilica masterpiece', 'Architecture', '€20-35', 4.7, 2, (SELECT id FROM cities WHERE name = 'Barcelona'), 41.4036, 2.1744),
('Park Güell', 'Colorful mosaic park designed by Antoni Gaudí', 'Nature', '€10-15', 4.4, 3, (SELECT id FROM cities WHERE name = 'Barcelona'), 41.4145, 2.1527),
('Las Ramblas Walk', 'Famous tree-lined pedestrian street with street performers', 'Walking Tour', 'Free', 4.0, 2, (SELECT id FROM cities WHERE name = 'Barcelona'), 41.3818, 2.1772),
('Gothic Quarter Tour', 'Medieval streets and historic architecture exploration', 'Historical', '€20-30', 4.3, 3, (SELECT id FROM cities WHERE name = 'Barcelona'), 41.3841, 2.1775),
('Barceloneta Beach', 'Popular city beach perfect for swimming and beach bars', 'Beach', 'Free', 4.1, 4, (SELECT id FROM cities WHERE name = 'Barcelona'), 41.3755, 2.1838);

-- Sydney activities
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Sydney Opera House', 'Iconic performing arts venue with guided tours', 'Architecture', 'AUD$43-65', 4.6, 2, (SELECT id FROM cities WHERE name = 'Sydney'), -33.8568, 151.2153),
('Sydney Harbour Bridge', 'Climb the iconic bridge for panoramic harbor views', 'Adventure', 'AUD$174-388', 4.5, 3, (SELECT id FROM cities WHERE name = 'Sydney'), -33.8523, 151.2108),
('Bondi Beach', 'World-famous beach perfect for surfing and sunbathing', 'Beach', 'Free', 4.3, 4, (SELECT id FROM cities WHERE name = 'Sydney'), -33.8915, 151.2767),
('Royal Botanic Gardens', 'Beautiful gardens with harbor views and diverse flora', 'Nature', 'Free', 4.4, 3, (SELECT id FROM cities WHERE name = 'Sydney'), -33.8641, 151.2165),
('Darling Harbour', 'Waterfront precinct with dining, shopping, and entertainment', 'Entertainment', 'Free entry', 4.2, 3, (SELECT id FROM cities WHERE name = 'Sydney'), -33.8737, 151.2017);

-- Dubai activities
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Burj Khalifa', 'World tallest building with observation decks', 'Sightseeing', 'AED149-500', 4.6, 2, (SELECT id FROM cities WHERE name = 'Dubai'), 25.1972, 55.2744),
('Dubai Mall', 'Massive shopping and entertainment complex', 'Shopping', 'Free entry', 4.3, 4, (SELECT id FROM cities WHERE name = 'Dubai'), 25.1975, 55.2796),
('Desert Safari', 'Thrilling 4x4 adventure with camel riding and BBQ dinner', 'Adventure', 'AED200-400', 4.4, 6, (SELECT id FROM cities WHERE name = 'Dubai'), 25.0657, 55.1713),
('Dubai Fountains', 'Spectacular water and light show at Burj Khalifa Lake', 'Entertainment', 'Free', 4.5, 1, (SELECT id FROM cities WHERE name = 'Dubai'), 25.1946, 55.2756),
('Gold Souk', 'Traditional market famous for gold and jewelry shopping', 'Shopping', 'Free entry', 4.1, 2, (SELECT id FROM cities WHERE name = 'Dubai'), 25.2697, 55.2979);

-- Sample trips with realistic data
INSERT INTO trips (user_id, title, description, destination_city_id, start_date, end_date, budget, status, privacy, created_at) VALUES
(2, 'European Art & Culture Adventure', 'A 10-day journey through Paris and Rome exploring world-class museums, historic landmarks, and culinary delights. Perfect blend of art, history, and gastronomy.', (SELECT id FROM cities WHERE name = 'Paris'), '2025-09-15', '2025-09-25', 3500.00, 'confirmed', 'public', '2025-07-20 14:30:00'),
(3, 'Japan Cultural Immersion', 'Experiencing traditional and modern Japan in Tokyo. From ancient temples to cutting-edge technology, this trip covers the best of Japanese culture.', (SELECT id FROM cities WHERE name = 'Tokyo'), '2025-10-01', '2025-10-08', 2800.00, 'planning', 'public', '2025-07-25 16:45:00'),
(4, 'NYC Food & Broadway Weekend', 'A quick but intense New York experience focusing on Broadway shows, world-class dining, and iconic sightseeing.', (SELECT id FROM cities WHERE name = 'New York'), '2025-08-20', '2025-08-24', 1800.00, 'confirmed', 'public', '2025-07-15 11:20:00'),
(5, 'London Business & Leisure', 'Combining business meetings with leisure exploration of London historic sites, museums, and traditional pubs.', (SELECT id FROM cities WHERE name = 'London'), '2025-09-05', '2025-09-12', 2200.00, 'planning', 'private', '2025-07-30 09:15:00'),
(6, 'Bali Spiritual Retreat', 'Solo travel focused on yoga, meditation, and spiritual discovery in Bali beautiful temples and nature settings.', (SELECT id FROM cities WHERE name = 'Bali'), '2025-11-10', '2025-11-20', 1600.00, 'planning', 'public', '2025-08-01 13:25:00'),
(7, 'Rome Family History Tour', 'Educational family trip exploring Ancient Rome with kids-friendly activities and interactive museum experiences.', (SELECT id FROM cities WHERE name = 'Rome'), '2025-10-15', '2025-10-22', 4200.00, 'planning', 'public', '2025-08-05 10:40:00'),
(8, 'Barcelona Architecture & Beaches', 'Luxury exploration of Gaudí masterpieces combined with Mediterranean beach relaxation and fine dining.', (SELECT id FROM cities WHERE name = 'Barcelona'), '2025-09-20', '2025-09-27', 3800.00, 'confirmed', 'public', '2025-07-18 15:55:00'),
(2, 'Sydney Summer Adventure', 'Active trip exploring Sydney beaches, harbor activities, and outdoor adventures during Australian summer.', (SELECT id FROM cities WHERE name = 'Sydney'), '2025-12-20', '2025-12-30', 3200.00, 'planning', 'public', '2025-08-08 12:10:00');

-- Sample itineraries for the trips
INSERT INTO itineraries (trip_id, day_number, date, title, description, created_at) VALUES
-- European Art & Culture Adventure (Trip 1)
(1, 1, '2025-09-15', 'Arrival in Paris', 'Arrive at CDG Airport, check into hotel near Louvre, evening stroll along Seine River', '2025-07-20 14:35:00'),
(1, 2, '2025-09-16', 'Classic Paris Sightseeing', 'Visit Eiffel Tower, Arc de Triomphe, and evening dinner cruise on Seine', '2025-07-20 14:35:00'),
(1, 3, '2025-09-17', 'Art & Culture Day', 'Full day at Louvre Museum, afternoon in Montmartre district, visit Sacré-Cœur', '2025-07-20 14:35:00'),
(1, 4, '2025-09-18', 'Paris Hidden Gems', 'Latin Quarter food tour, Notre-Dame area, evening at local bistro', '2025-07-20 14:35:00'),
(1, 5, '2025-09-19', 'Travel to Rome', 'Morning train to Rome, check-in, evening walk around Trastevere', '2025-07-20 14:35:00'),
(1, 6, '2025-09-20', 'Ancient Rome', 'Colosseum tour, Roman Forum exploration, Palatine Hill visit', '2025-07-20 14:35:00'),
(1, 7, '2025-09-21', 'Vatican City', 'Vatican Museums, Sistine Chapel, St. Peter Basilica tour', '2025-07-20 14:35:00'),
(1, 8, '2025-09-22', 'Rome Highlights', 'Trevi Fountain, Pantheon, Spanish Steps, gelato tasting', '2025-07-20 14:35:00'),
(1, 9, '2025-09-23', 'Roman Food Experience', 'Trastevere food tour, cooking class, local market visit', '2025-07-20 14:35:00'),
(1, 10, '2025-09-24', 'Leisure Day', 'Villa Borghese gardens, last-minute shopping, farewell dinner', '2025-07-20 14:35:00');

-- Japan Cultural Immersion (Trip 2)
INSERT INTO itineraries (trip_id, day_number, date, title, description, created_at) VALUES
(2, 1, '2025-10-01', 'Tokyo Arrival', 'Land at Narita, take JR train to Shibuya, explore crossing and nearby areas', '2025-07-25 16:50:00'),
(2, 2, '2025-10-02', 'Traditional Tokyo', 'Senso-ji Temple, traditional Asakusa district, evening in Ginza', '2025-07-25 16:50:00'),
(2, 3, '2025-10-03', 'Modern Tokyo', 'Tokyo Skytree, TeamLab Borderless, high-tech Akihabara district', '2025-07-25 16:50:00'),
(2, 4, '2025-10-04', 'Cultural Immersion', 'Meiji Shrine, Harajuku youth culture, traditional tea ceremony', '2025-07-25 16:50:00'),
(2, 5, '2025-10-05', 'Food & Markets', 'Tsukiji Outer Market tour, sushi breakfast, ramen tasting tour', '2025-07-25 16:50:00'),
(2, 6, '2025-10-06', 'Day Trip to Nikko', 'UNESCO World Heritage shrines and temples, natural beauty', '2025-07-25 16:50:00'),
(2, 7, '2025-10-07', 'Entertainment Tokyo', 'Robot Restaurant show, karaoke night, Shinjuku nightlife', '2025-07-25 16:50:00'),
(2, 8, '2025-10-08', 'Departure Day', 'Last-minute shopping in Shibuya, departure from Haneda Airport', '2025-07-25 16:50:00');

-- NYC Food & Broadway Weekend (Trip 3)
INSERT INTO itineraries (trip_id, day_number, date, title, description, created_at) VALUES
(3, 1, '2025-08-20', 'NYC Arrival', 'JFK arrival, check into Times Square hotel, evening Broadway show', '2025-07-15 11:25:00'),
(3, 2, '2025-08-21', 'Classic NYC', 'Statue of Liberty, 9/11 Memorial, evening food tour in Little Italy', '2025-07-15 11:25:00'),
(3, 3, '2025-08-22', 'Culture & Food', 'Metropolitan Museum, Central Park picnic, fine dining in Upper East Side', '2025-07-15 11:25:00'),
(3, 4, '2025-08-23', 'Modern NYC', 'High Line walk, Chelsea Market, second Broadway show', '2025-07-15 11:25:00'),
(3, 5, '2025-08-24', 'Final Morning', 'Empire State Building, last-minute shopping, departure', '2025-07-15 11:25:00');

-- Refresh materialized views with sample data
REFRESH MATERIALIZED VIEW popular_cities;
REFRESH MATERIALIZED VIEW user_analytics;
REFRESH MATERIALIZED VIEW platform_stats;

-- Sample itinerary activities (linking activities to specific itinerary days)
-- European Art & Culture Adventure activities
INSERT INTO itinerary_activities (itinerary_id, activity_id, scheduled_time, notes, created_at) VALUES
-- Day 2: Classic Paris Sightseeing
(2, (SELECT id FROM activities WHERE name = 'Eiffel Tower Visit' AND city_id = (SELECT id FROM cities WHERE name = 'Paris')), '10:00:00', 'Book skip-the-line tickets in advance', '2025-07-20 14:40:00'),
(2, (SELECT id FROM activities WHERE name = 'Arc de Triomphe' AND city_id = (SELECT id FROM cities WHERE name = 'Paris')), '14:30:00', 'Climb to the top for Champs-Élysées views', '2025-07-20 14:40:00'),
(2, (SELECT id FROM activities WHERE name = 'Seine River Cruise' AND city_id = (SELECT id FROM cities WHERE name = 'Paris')), '19:00:00', 'Evening dinner cruise with city lights', '2025-07-20 14:40:00'),

-- Day 3: Art & Culture Day
(3, (SELECT id FROM activities WHERE name = 'Louvre Museum' AND city_id = (SELECT id FROM cities WHERE name = 'Paris')), '09:30:00', 'Pre-booked tickets, focus on highlights including Mona Lisa', '2025-07-20 14:40:00'),
(3, (SELECT id FROM activities WHERE name = 'Montmartre Walking Tour' AND city_id = (SELECT id FROM cities WHERE name = 'Paris')), '15:00:00', 'Artist district tour including Sacré-Cœur', '2025-07-20 14:40:00'),

-- Day 4: Paris Hidden Gems
(4, (SELECT id FROM activities WHERE name = 'Latin Quarter Food Tour' AND city_id = (SELECT id FROM cities WHERE name = 'Paris')), '11:00:00', 'Authentic French cuisine experience', '2025-07-20 14:40:00'),
(4, (SELECT id FROM activities WHERE name = 'Notre-Dame Cathedral' AND city_id = (SELECT id FROM cities WHERE name = 'Paris')), '16:00:00', 'Exterior visit during restoration work', '2025-07-20 14:40:00'),

-- Day 6: Ancient Rome
(6, (SELECT id FROM activities WHERE name = 'Colosseum' AND city_id = (SELECT id FROM cities WHERE name = 'Rome')), '09:00:00', 'Skip-the-line tour with underground access', '2025-07-20 14:40:00'),
(6, (SELECT id FROM activities WHERE name = 'Roman Forum' AND city_id = (SELECT id FROM cities WHERE name = 'Rome')), '12:00:00', 'Combined ticket with Colosseum', '2025-07-20 14:40:00'),

-- Day 7: Vatican City
(7, (SELECT id FROM activities WHERE name = 'Vatican Museums' AND city_id = (SELECT id FROM cities WHERE name = 'Rome')), '08:00:00', 'Early morning to avoid crowds, includes Sistine Chapel', '2025-07-20 14:40:00'),

-- Day 8: Rome Highlights
(8, (SELECT id FROM activities WHERE name = 'Trevi Fountain' AND city_id = (SELECT id FROM cities WHERE name = 'Rome')), '10:00:00', 'Morning visit before crowds arrive', '2025-07-20 14:40:00'),
(8, (SELECT id FROM activities WHERE name = 'Pantheon' AND city_id = (SELECT id FROM cities WHERE name = 'Rome')), '11:30:00', 'Marvel at ancient Roman engineering', '2025-07-20 14:40:00'),
(8, (SELECT id FROM activities WHERE name = 'Spanish Steps' AND city_id = (SELECT id FROM cities WHERE name = 'Rome')), '15:00:00', 'Great for people watching and photos', '2025-07-20 14:40:00'),

-- Day 9: Roman Food Experience
(9, (SELECT id FROM activities WHERE name = 'Trastevere Food Tour' AND city_id = (SELECT id FROM cities WHERE name = 'Rome')), '10:00:00', 'Local specialties and wine tasting', '2025-07-20 14:40:00');

-- Japan Cultural Immersion activities
INSERT INTO itinerary_activities (itinerary_id, activity_id, scheduled_time, notes, created_at) VALUES
-- Day 2: Traditional Tokyo
(12, (SELECT id FROM activities WHERE name = 'Senso-ji Temple' AND city_id = (SELECT id FROM cities WHERE name = 'Tokyo')), '09:00:00', 'Early morning visit for peaceful experience', '2025-07-25 16:55:00'),

-- Day 3: Modern Tokyo
(13, (SELECT id FROM activities WHERE name = 'Tokyo Skytree' AND city_id = (SELECT id FROM cities WHERE name = 'Tokyo')), '10:00:00', 'Clear day for best views', '2025-07-25 16:55:00'),
(13, (SELECT id FROM activities WHERE name = 'TeamLab Borderless' AND city_id = (SELECT id FROM cities WHERE name = 'Tokyo')), '16:00:00', 'Advanced booking required', '2025-07-25 16:55:00'),

-- Day 4: Cultural Immersion
(14, (SELECT id FROM activities WHERE name = 'Meiji Shrine' AND city_id = (SELECT id FROM cities WHERE name = 'Tokyo')), '08:30:00', 'Morning prayers and peaceful atmosphere', '2025-07-25 16:55:00'),

-- Day 5: Food & Markets
(15, (SELECT id FROM activities WHERE name = 'Tsukiji Outer Market' AND city_id = (SELECT id FROM cities WHERE name = 'Tokyo')), '06:00:00', 'Fresh sushi breakfast experience', '2025-07-25 16:55:00'),

-- Day 7: Entertainment Tokyo
(17, (SELECT id FROM activities WHERE name = 'Robot Restaurant Show' AND city_id = (SELECT id FROM cities WHERE name = 'Tokyo')), '20:00:00', 'Unique Tokyo entertainment experience', '2025-07-25 16:55:00');

-- NYC Food & Broadway Weekend activities
INSERT INTO itinerary_activities (itinerary_id, activity_id, scheduled_time, notes, created_at) VALUES
-- Day 2: Classic NYC
(20, (SELECT id FROM activities WHERE name = 'Statue of Liberty' AND city_id = (SELECT id FROM cities WHERE name = 'New York')), '09:00:00', 'Ferry from Battery Park, crown access pre-booked', '2025-07-15 11:30:00'),
(20, (SELECT id FROM activities WHERE name = '9/11 Memorial' AND city_id = (SELECT id FROM cities WHERE name = 'New York')), '14:00:00', 'Moving tribute, allow extra time for reflection', '2025-07-15 11:30:00'),

-- Day 3: Culture & Food
(21, (SELECT id FROM activities WHERE name = 'Metropolitan Museum' AND city_id = (SELECT id FROM cities WHERE name = 'New York')), '10:00:00', 'Focus on Egyptian Art and American Wing', '2025-07-15 11:30:00'),
(21, (SELECT id FROM activities WHERE name = 'Central Park' AND city_id = (SELECT id FROM cities WHERE name = 'New York')), '15:00:00', 'Picnic lunch and people watching', '2025-07-15 11:30:00'),

-- Day 4: Modern NYC
(22, (SELECT id FROM activities WHERE name = 'High Line Walk' AND city_id = (SELECT id FROM cities WHERE name = 'New York')), '11:00:00', 'Elevated park with Hudson River views', '2025-07-15 11:30:00'),
(22, (SELECT id FROM activities WHERE name = 'Broadway Show' AND city_id = (SELECT id FROM cities WHERE name = 'New York')), '20:00:00', 'Second show of the weekend', '2025-07-15 11:30:00'),

-- Day 5: Final Morning
(23, (SELECT id FROM activities WHERE name = 'Empire State Building' AND city_id = (SELECT id FROM cities WHERE name = 'New York')), '09:00:00', 'Classic NYC skyline views before departure', '2025-07-15 11:30:00');

-- Insert some sample user preferences and trip reviews
INSERT INTO trip_reviews (trip_id, user_id, rating, comment, helpful_votes, created_at) VALUES
(1, 3, 5, 'Amazing European adventure! The itinerary was perfectly planned and the combination of Paris and Rome was incredible. Highly recommend the food tours!', 12, '2025-07-22 16:20:00'),
(1, 4, 5, 'Sarah planned this trip brilliantly. Every detail was covered and the cultural experiences were authentic and enriching.', 8, '2025-07-23 14:15:00'),
(2, 2, 5, 'Marco cultural immersion trip to Tokyo was eye-opening. Great balance of traditional and modern Japan. TeamLab was mind-blowing!', 15, '2025-07-28 11:40:00'),
(3, 5, 4, 'Fantastic NYC weekend! The Broadway shows were incredible and the food recommendations were spot-on. Could have used one more day.', 6, '2025-07-17 19:30:00'),
(3, 6, 5, 'Perfect quick NYC getaway. Emily planned everything perfectly for a short but memorable trip.', 4, '2025-07-18 09:25:00');

-- Add some sample trip collaborators
INSERT INTO trip_collaborators (trip_id, user_id, role, permissions, invited_at, accepted_at) VALUES
(1, 8, 'viewer', ARRAY['view'], '2025-07-20 15:00:00', '2025-07-20 18:30:00'),
(2, 7, 'editor', ARRAY['view', 'edit'], '2025-07-25 17:00:00', '2025-07-26 10:15:00'),
(7, 6, 'editor', ARRAY['view', 'edit'], '2025-08-05 11:00:00', '2025-08-05 13:45:00');

-- Final materialized view refresh
REFRESH MATERIALIZED VIEW popular_cities;
REFRESH MATERIALIZED VIEW user_analytics;
REFRESH MATERIALIZED VIEW platform_stats;
