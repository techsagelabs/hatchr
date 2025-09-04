-- ===================================================================
-- User Profiles Extension for Takeo
-- Run this to add user profile functionality
-- ===================================================================

-- Create user profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE, -- Clerk user ID
    display_name TEXT,
    bio TEXT,
    website TEXT,
    twitter TEXT,
    github TEXT,
    linkedin TEXT,
    avatar_url TEXT,
    location TEXT,
    is_onboarded BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_onboarded ON user_profiles(is_onboarded);

-- RLS Policies for user profiles
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = user_id
    );

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (
        (auth.jwt() ->> 'sub') = user_id
    );

CREATE POLICY "Users can delete their own profile" ON user_profiles
    FOR DELETE USING (
        (auth.jwt() ->> 'sub') = user_id
    );

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create user profile
CREATE OR REPLACE FUNCTION get_or_create_user_profile(clerk_user_id TEXT, user_name TEXT, user_avatar TEXT DEFAULT NULL)
RETURNS user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile user_profiles;
BEGIN
    -- Try to get existing profile
    SELECT * INTO profile FROM user_profiles WHERE user_id = clerk_user_id;
    
    -- If not found, create new profile
    IF NOT FOUND THEN
        INSERT INTO user_profiles (user_id, display_name, avatar_url)
        VALUES (clerk_user_id, user_name, user_avatar)
        RETURNING * INTO profile;
    END IF;
    
    RETURN profile;
END;
$$;

-- Add onboarding tracking to the projects table (for completion analytics)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_first_project BOOLEAN DEFAULT false;

-- Create a view for enhanced user data (combines Clerk + profile data)
CREATE OR REPLACE VIEW enhanced_users AS
SELECT 
    up.user_id,
    up.display_name,
    up.bio,
    up.website,
    up.twitter,
    up.github,
    up.linkedin,
    up.avatar_url,
    up.location,
    up.is_onboarded,
    up.created_at as profile_created_at,
    up.updated_at as profile_updated_at,
    COUNT(p.id) as project_count,
    MAX(p.created_at) as last_project_date
FROM user_profiles up
LEFT JOIN projects p ON p.author_id = up.user_id
GROUP BY up.id;

-- Sample data (optional - for testing)
/*
INSERT INTO user_profiles (user_id, display_name, bio, website, github, is_onboarded) VALUES
('sample_user_1', 'John Doe', 'Full-stack developer who loves building cool stuff', 'https://johndoe.dev', 'johndoe', true),
('sample_user_2', 'Jane Smith', 'Designer & developer. Always learning new things!', 'https://janesmith.design', 'janesmith', true);
*/

-- Verify the setup
SELECT 'User profiles table created successfully' as status;
SELECT * FROM user_profiles LIMIT 1;
