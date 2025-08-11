-- Add sample comments to test the comments functionality
INSERT INTO community_post_comments (
    post_id, 
    user_id, 
    content, 
    likes_count
) VALUES 
(
    1, -- Post ID for "Amazing Experience in Paris!"
    (SELECT id FROM users WHERE email = 'nirmaldarekar.ix.kcgandhi@gmail.com' LIMIT 1),
    'I completely agree! Paris is magical. The Eiffel Tower at night is even more spectacular. Did you try the macarons from Ladurée?',
    2
),
(
    1, -- Reply to the same post
    (SELECT id FROM users WHERE email = 'admin@globetrotter.com' LIMIT 1),
    'Great tips! I would also recommend visiting Montmartre early in the morning for the best views and fewer crowds.',
    1
),
(
    2, -- Post ID for "Tokyo Travel Tips for First-Timers"
    (SELECT id FROM users WHERE email = 'nirmaldarekar90@gmail.com' LIMIT 1),
    'These are excellent tips! I would also add: download Google Translate app with camera feature - it helps a lot with reading menus and signs.',
    3
),
(
    3, -- Post ID for "Best Beach Resort in Bali"
    (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1),
    'Sounds amazing! What was the name of the resort? I''m planning a trip to Bali next year.',
    0
);

-- Check the comments
SELECT 
    cc.id,
    cc.content,
    cc.likes_count,
    u.email as author_email,
    cp.title as post_title
FROM community_post_comments cc
LEFT JOIN users u ON cc.user_id = u.id
LEFT JOIN community_posts cp ON cc.post_id = cp.id
ORDER BY cc.created_at DESC;
