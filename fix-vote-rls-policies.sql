-- ===================================================================
-- DEFINITIVE FIX for Vote RLS Policies
-- This script will fix the Row Level Security policies for the votes table
-- Run this in your Supabase SQL Editor
-- ===================================================================

-- 1. Drop all existing vote policies to start fresh
DROP POLICY IF EXISTS "Users can view all votes" ON votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can insert votes" ON votes;

-- 2. Create new, working RLS policies for votes

-- Allow everyone to read votes (needed for displaying vote counts)
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT USING (true);

-- Allow authenticated users to insert votes
-- This checks that the JWT 'sub' field matches the user_id in the vote record
CREATE POLICY "Authenticated users can insert votes" ON votes
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = user_id
    );

-- Allow users to update their own votes (change from up to down or vice versa)
CREATE POLICY "Users can update their own votes" ON votes
    FOR UPDATE USING (
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = user_id
    );

-- Allow users to delete their own votes (remove vote entirely)
CREATE POLICY "Users can delete their own votes" ON votes
    FOR DELETE USING (
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = user_id
    );

-- 3. Verify RLS is enabled
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 4. Test query to verify JWT structure (run this to debug if needed)
-- Uncomment the line below to see what your JWT looks like:
-- SELECT auth.jwt();

-- 5. Verification queries
-- These will help you confirm the policies are working:

-- Check current policies
SELECT schemaname, tablename, policyname, cmd, permissive, qual, with_check
FROM pg_policies 
WHERE tablename = 'votes'
ORDER BY policyname;

-- Test if you can see votes (should work for everyone)
SELECT COUNT(*) as total_votes FROM votes;

SELECT 'Vote RLS policies have been fixed! ✅' as status;
