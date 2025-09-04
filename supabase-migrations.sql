-- ===================================================================
-- Database Schema for Takeo - Innovator's Place
-- Run this in your Supabase SQL Editor to set up the database
-- ===================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- PROJECTS TABLE
-- ===================================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    media_url TEXT NULL,
    code_embed_url TEXT NULL,
    author_id TEXT NOT NULL, -- Clerk user ID
    author_name TEXT NOT NULL,
    author_avatar_url TEXT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================================
-- COMMENTS TABLE
-- ===================================================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL, -- Clerk user ID
    author_name TEXT NOT NULL,
    author_avatar_url TEXT NULL,
    content TEXT NOT NULL,
    parent_id UUID NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================================
-- VOTES TABLE
-- ===================================================================
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk user ID
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, user_id) -- One vote per user per project
);

-- ===================================================================
-- INDEXES for better performance
-- ===================================================================
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_author_id ON projects(author_id);
CREATE INDEX idx_projects_upvotes ON projects(upvotes DESC);

CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

CREATE INDEX idx_votes_project_id ON votes(project_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- ===================================================================
-- TRIGGERS for updated_at timestamps
-- ===================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- TRIGGER to update comments_count on projects
-- ===================================================================
CREATE OR REPLACE FUNCTION update_project_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE projects SET comments_count = comments_count + 1 WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE projects SET comments_count = comments_count - 1 WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_project_comments_count();

-- ===================================================================
-- TRIGGER to update vote counts on projects
-- ===================================================================
CREATE OR REPLACE FUNCTION update_project_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'up' THEN
            UPDATE projects SET upvotes = upvotes + 1 WHERE id = NEW.project_id;
        ELSIF NEW.vote_type = 'down' THEN
            UPDATE projects SET downvotes = downvotes + 1 WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle vote change
        IF OLD.vote_type = 'up' THEN
            UPDATE projects SET upvotes = upvotes - 1 WHERE id = OLD.project_id;
        ELSIF OLD.vote_type = 'down' THEN
            UPDATE projects SET downvotes = downvotes - 1 WHERE id = OLD.project_id;
        END IF;
        
        IF NEW.vote_type = 'up' THEN
            UPDATE projects SET upvotes = upvotes + 1 WHERE id = NEW.project_id;
        ELSIF NEW.vote_type = 'down' THEN
            UPDATE projects SET downvotes = downvotes + 1 WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'up' THEN
            UPDATE projects SET upvotes = upvotes - 1 WHERE id = OLD.project_id;
        ELSIF OLD.vote_type = 'down' THEN
            UPDATE projects SET downvotes = downvotes - 1 WHERE id = OLD.project_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_project_vote_counts();

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Everyone can view projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'sub' = author_id OR 
        (auth.jwt() ->> 'sub') IS NOT NULL
    );

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.jwt() ->> 'sub' = author_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.jwt() ->> 'sub' = author_id);

-- Comments policies
CREATE POLICY "Everyone can view comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON comments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = author_id);

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.jwt() ->> 'sub' = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.jwt() ->> 'sub' = author_id);

-- Votes policies
CREATE POLICY "Users can view all votes" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON votes
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own votes" ON votes
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own votes" ON votes
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- ===================================================================
-- SAMPLE DATA (Optional - for testing)
-- ===================================================================
-- You can uncomment and modify these with actual Clerk user IDs for testing

/*
INSERT INTO projects (
    title, 
    short_description, 
    full_description, 
    thumbnail_url, 
    media_url,
    code_embed_url,
    author_id, 
    author_name, 
    author_avatar_url
) VALUES 
(
    'Raspberry Pi Weather Station',
    'DIY weather station with sensors and a live dashboard.',
    'A complete weather station built on Raspberry Pi with DHT22 and BMP280 sensors. It streams data to a web dashboard and stores historical metrics.',
    '/project-thumbnail.png',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://codepen.io/team/codepen/pen/PNaGbb',
    'your_clerk_user_id_here',
    'Your Name',
    '/diverse-avatars.png'
);
*/

-- ===================================================================
-- CLERK INTEGRATION SETUP
-- ===================================================================
-- NOTE: After running this migration, you need to:
-- 1. In your Supabase dashboard, go to Authentication > Providers
-- 2. Enable "Custom OAuth Provider" or configure Clerk integration
-- 3. Set up the JWT template in Clerk dashboard:
--    - Go to Configure > JWT Templates
--    - Create a new template named "supabase"
--    - Set the issuer to your Supabase project URL
--    - Add the following claims:
--      {
--        "aud": "authenticated",
--        "role": "authenticated"
--      }
