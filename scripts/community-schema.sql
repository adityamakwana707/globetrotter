-- Community Posts Schema for GlobeTrotter
-- This allows users to share their travel experiences and reviews

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    display_id SERIAL UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    post_type VARCHAR(50) DEFAULT 'experience' CHECK (post_type IN ('experience', 'review', 'tip', 'recommendation')),
    
    -- Related content
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL,
    activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
    
    -- Post metadata
    images TEXT[], -- Array of image URLs
    tags VARCHAR(100)[], -- Array of tags
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    
    -- Moderation
    is_published BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community post likes
CREATE TABLE IF NOT EXISTS community_post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Community post comments
CREATE TABLE IF NOT EXISTS community_post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES community_post_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community post comment likes
CREATE TABLE IF NOT EXISTS community_comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES community_post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

-- Community post follows (for notifications)
CREATE TABLE IF NOT EXISTS community_post_follows (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_trip_id ON community_posts(trip_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_city_id ON community_posts(city_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_activity_id ON community_posts(activity_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_published ON community_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured ON community_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_likes ON community_posts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_rating ON community_posts(rating DESC);

-- Indexes for engagement tables
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post ON community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user ON community_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user ON community_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON community_post_comments(parent_comment_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_community_posts_search ON community_posts USING gin(to_tsvector('english', title || ' ' || content || ' ' || COALESCE(array_to_string(tags, ' '), '')));

-- Trigger for updating updated_at
CREATE TRIGGER update_community_posts_updated_at 
    BEFORE UPDATE ON community_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at 
    BEFORE UPDATE ON community_post_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE community_posts IS 'User-generated content sharing travel experiences, reviews, and tips';
COMMENT ON TABLE community_post_likes IS 'Likes for community posts';
COMMENT ON TABLE community_post_comments IS 'Comments on community posts with threading support';
COMMENT ON TABLE community_comment_likes IS 'Likes for comments';
COMMENT ON TABLE community_post_follows IS 'User follows for post notifications';
