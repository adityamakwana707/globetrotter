-- Insert sample data for GlobeTrotter application

-- Sample cities
INSERT INTO cities (name, country, latitude, longitude, timezone, description) VALUES
('Paris', 'France', 48.8566, 2.3522, 'Europe/Paris', 'The City of Light, known for its art, fashion, and culture'),
('Tokyo', 'Japan', 35.6762, 139.6503, 'Asia/Tokyo', 'A bustling metropolis blending traditional and modern culture'),
('New York', 'United States', 40.7128, -74.0060, 'America/New_York', 'The city that never sleeps'),
('London', 'United Kingdom', 51.5074, -0.1278, 'Europe/London', 'Historic city with royal heritage and modern attractions'),
('Bali', 'Indonesia', -8.3405, 115.0920, 'Asia/Makassar', 'Tropical paradise with beautiful beaches and temples'),
('Rome', 'Italy', 41.9028, 12.4964, 'Europe/Rome', 'The Eternal City with ancient history and amazing cuisine'),
('Barcelona', 'Spain', 41.3851, 2.1734, 'Europe/Madrid', 'Vibrant city known for Gaudí architecture and Mediterranean culture'),
('Sydney', 'Australia', -33.8688, 151.2093, 'Australia/Sydney', 'Harbor city with iconic Opera House and beautiful beaches');

-- Sample activities for Paris
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Eiffel Tower Visit', 'Iconic iron tower and symbol of Paris', 'Sightseeing', '€25-50', 4.5, 3, (SELECT id FROM cities WHERE name = 'Paris'), 48.8584, 2.2945),
('Louvre Museum', 'World famous art museum home to the Mona Lisa', 'Museum', '€15-25', 4.7, 4, (SELECT id FROM cities WHERE name = 'Paris'), 48.8606, 2.3376),
('Seine River Cruise', 'Scenic boat tour along the Seine River', 'Tour', '€15-30', 4.3, 2, (SELECT id FROM cities WHERE name = 'Paris'), 48.8566, 2.3522),
('Montmartre Walking Tour', 'Explore the artistic district of Montmartre', 'Walking Tour', '€20-40', 4.4, 3, (SELECT id FROM cities WHERE name = 'Paris'), 48.8867, 2.3431);

-- Sample activities for Tokyo
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Senso-ji Temple', 'Ancient Buddhist temple in Asakusa district', 'Cultural', 'Free', 4.6, 2, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.7148, 139.7967),
('Tokyo Skytree', 'Tallest structure in Japan with panoramic views', 'Sightseeing', '¥2000-3000', 4.4, 2, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.7101, 139.8107),
('Tsukiji Fish Market', 'Famous fish market with fresh sushi', 'Food', '¥3000-5000', 4.5, 3, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.6654, 139.7707),
('Shibuya Crossing', 'World famous pedestrian crossing', 'Sightseeing', 'Free', 4.2, 1, (SELECT id FROM cities WHERE name = 'Tokyo'), 35.6598, 139.7006);

-- Sample activities for New York
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Statue of Liberty', 'Iconic symbol of freedom and democracy', 'Sightseeing', '$25-50', 4.5, 4, (SELECT id FROM cities WHERE name = 'New York'), 40.6892, -74.0445),
('Central Park', 'Large public park in Manhattan', 'Nature', 'Free', 4.7, 3, (SELECT id FROM cities WHERE name = 'New York'), 40.7829, -73.9654),
('Broadway Show', 'World-class theater performances', 'Entertainment', '$100-300', 4.8, 3, (SELECT id FROM cities WHERE name = 'New York'), 40.7590, -73.9845),
('9/11 Memorial', 'Memorial honoring victims of September 11 attacks', 'Memorial', '$25-30', 4.6, 2, (SELECT id FROM cities WHERE name = 'New York'), 40.7115, -74.0134);

-- Sample activities for London
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Tower of London', 'Historic castle and home of Crown Jewels', 'Historical', '£25-30', 4.4, 3, (SELECT id FROM cities WHERE name = 'London'), 51.5081, -0.0759),
('British Museum', 'World-famous museum of art and artifacts', 'Museum', 'Free', 4.5, 4, (SELECT id FROM cities WHERE name = 'London'), 51.5194, -0.1270),
('London Eye', 'Giant observation wheel on South Bank', 'Sightseeing', '£25-35', 4.2, 1, (SELECT id FROM cities WHERE name = 'London'), 51.5033, -0.1196),
('Westminster Abbey', 'Gothic abbey church', 'Religious', '£20-25', 4.4, 2, (SELECT id FROM cities WHERE name = 'London'), 51.4994, -0.1273);

-- Sample activities for Bali
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Tanah Lot Temple', 'Rock formation and Hindu temple', 'Religious', 'Rp50000', 4.3, 2, (SELECT id FROM cities WHERE name = 'Bali'), -8.6212, 115.0868),
('Ubud Monkey Forest', 'Nature reserve and Hindu temple complex', 'Nature', 'Rp80000', 4.1, 2, (SELECT id FROM cities WHERE name = 'Bali'), -8.5069, 115.2581),
('Kuta Beach', 'Popular beach for surfing and sunbathing', 'Beach', 'Free', 4.0, 4, (SELECT id FROM cities WHERE name = 'Bali'), -8.7183, 115.1686),
('Mount Batur Sunrise Trek', 'Volcano hiking experience', 'Adventure', 'Rp500000', 4.4, 8, (SELECT id FROM cities WHERE name = 'Bali'), -8.2421, 115.3725);

-- Sample activities for Rome
INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude) VALUES
('Colosseum', 'Ancient Roman amphitheater', 'Historical', '€16-20', 4.5, 2, (SELECT id FROM cities WHERE name = 'Rome'), 41.8902, 12.4922),
('Vatican Museums', 'Papal museums with Sistine Chapel', 'Museum', '€17-25', 4.6, 4, (SELECT id FROM cities WHERE name = 'Rome'), 41.9065, 12.4536),
('Trevi Fountain', 'Famous baroque fountain', 'Sightseeing', 'Free', 4.3, 1, (SELECT id FROM cities WHERE name = 'Rome'), 41.9009, 12.4833),
('Roman Forum', 'Ancient Roman public square', 'Historical', '€16-20', 4.4, 3, (SELECT id FROM cities WHERE name = 'Rome'), 41.8925, 12.4853);
