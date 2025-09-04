-- ===================================================================
-- RLS Policy Fix for Clerk Integration
-- Run this AFTER the main migration to fix the RLS policies
-- ===================================================================

-- Drop existing policies and recreate them with better Clerk integration
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own votes" ON votes;

-- Projects policies - Fixed for Clerk
CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (
        -- Check if user is authenticated and matches author_id
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = author_id
    );

-- Comments policies - Fixed for Clerk  
CREATE POLICY "Users can insert their own comments" ON comments
    FOR INSERT WITH CHECK (
        -- Check if user is authenticated and matches author_id
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = author_id
    );

-- Votes policies - Fixed for Clerk
CREATE POLICY "Users can insert their own votes" ON votes
    FOR INSERT WITH CHECK (
        -- Check if user is authenticated and matches user_id
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = user_id
    );

-- Test the JWT structure (Optional - for debugging)
-- You can run this to see what the JWT looks like:
-- SELECT auth.jwt();

-- If you're still having issues, you can create a more permissive policy temporarily:
-- WARNING: Only use this for testing, not production!
/*
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Temporary permissive policy for projects" ON projects
    FOR INSERT WITH CHECK (
        -- Allow any authenticated user to insert
        (auth.jwt() ->> 'sub') IS NOT NULL
    );
*/
