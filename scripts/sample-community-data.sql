-- Sample data for community posts
-- First, let's check if we have users
SELECT id, email FROM users LIMIT 5;

-- Insert sample community posts (replace user_id with actual user IDs)
INSERT INTO community_posts (
    user_id, 
    title, 
    content, 
    post_type, 
    city_id, 
    tags, 
    rating,
    is_published,
    likes_count,
    comments_count,
    views_count
) VALUES 
(
    (SELECT id FROM users LIMIT 1), 
    'Amazing Experience in Paris!', 
    'Just spent a wonderful week in Paris. The Eiffel Tower at sunset was absolutely breathtaking! The city has so much to offer - from the amazing food to the rich history. I highly recommend visiting the Louvre Museum early in the morning to avoid crowds. The croissants from the local bakery near our hotel were the best I''ve ever had!',
    'experience',
    (SELECT id FROM cities WHERE name ILIKE '%Paris%' LIMIT 1),
    ARRAY['paris', 'eiffel-tower', 'museums', 'food', 'travel'],
    5,
    true,
    12,
    3,
    45
),
(
    (SELECT id FROM users LIMIT 1), 
    'Tokyo Travel Tips for First-Timers', 
    'Here are my top tips for visiting Tokyo: 1) Get a JR Pass for unlimited train travel 2) Try the ramen in Shibuya district 3) Visit Senso-ji Temple early morning 4) Don''t miss the fish market tour 5) Learn basic Japanese phrases. The city is incredibly clean and organized, and people are very helpful even with language barriers.',
    'tip',
    (SELECT id FROM cities WHERE name ILIKE '%Tokyo%' LIMIT 1),
    ARRAY['tokyo', 'japan', 'tips', 'culture', 'food'],
    NULL,
    true,
    8,
    5,
    67
),
(
    (SELECT id FROM users LIMIT 1), 
    'Best Beach Resort in Bali', 
    'Stayed at an amazing beachfront resort in Seminyak. The staff was incredibly friendly, the food was authentic and delicious, and the sunset views were unmatched. The infinity pool overlooking the ocean was perfect for relaxation. Highly recommend for couples or anyone looking for a peaceful getaway.',
    'review',
    (SELECT id FROM cities WHERE name ILIKE '%Bali%' OR name ILIKE '%Denpasar%' LIMIT 1),
    ARRAY['bali', 'beach', 'resort', 'relaxation', 'sunset'],
    4,
    true,
    15,
    7,
    89
),
(
    (SELECT id FROM users LIMIT 1), 
    'Hidden Gem: Small Café in Rome', 
    'Found this incredible little café tucked away in Trastevere. They serve the most authentic Italian coffee and their tiramisu is to die for! It''s away from the tourist crowds and frequented by locals. Perfect spot for a quiet morning coffee while planning your day in Rome.',
    'recommendation',
    (SELECT id FROM cities WHERE name ILIKE '%Rome%' LIMIT 1),
    ARRAY['rome', 'coffee', 'local', 'hidden-gem', 'food'],
    5,
    true,
    6,
    2,
    23
);

-- Check if the data was inserted
SELECT 
    cp.id,
    cp.title,
    cp.post_type,
    cp.likes_count,
    cp.created_at,
    u.email as author_email,
    c.name as city_name
FROM community_posts cp
LEFT JOIN users u ON cp.user_id = u.id
LEFT JOIN cities c ON cp.city_id = c.id
ORDER BY cp.created_at DESC;
