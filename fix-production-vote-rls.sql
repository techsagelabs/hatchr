-- ===================================================================
-- 🚨 PRODUCTION FIX: Vote RLS Policies for Supabase Auth
-- This fixes voting functionality in production after Clerk → Supabase migration
-- ===================================================================

-- 1. 🧹 Clean slate - Drop ALL existing vote policies
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can insert votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;
DROP POLICY IF EXISTS "vote_select" ON votes;
DROP POLICY IF EXISTS "vote_insert" ON votes;
DROP POLICY IF EXISTS "vote_update" ON votes;
DROP POLICY IF EXISTS "vote_delete" ON votes;
DROP POLICY IF EXISTS "votes_select_all" ON votes;
DROP POLICY IF EXISTS "votes_insert_authenticated" ON votes;
DROP POLICY IF EXISTS "votes_update_own" ON votes;
DROP POLICY IF EXISTS "votes_delete_own" ON votes;

-- 2. 🛡️ Create CORRECT RLS policies for Supabase Auth
CREATE POLICY "votes_select_policy" ON votes
    FOR SELECT USING (true);

CREATE POLICY "votes_insert_policy" ON votes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = user_id
    );

CREATE POLICY "votes_update_policy" ON votes
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = user_id
    );

CREATE POLICY "votes_delete_policy" ON votes
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = user_id
    );

-- 3. ✅ Ensure RLS is enabled
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 4. 🔍 Debug authentication (run these to verify)
SELECT 
    '🔐 Auth Debug Info:' as info,
    auth.uid() as auth_uid,
    auth.uid()::text as auth_uid_text,
    auth.role() as auth_role,
    current_setting('request.jwt.claims', true)::json as jwt_claims;

-- 5. 📋 Show all current vote policies
SELECT 
    '📋 Current Vote Policies:' as status,
    policyname, 
    cmd as operation,
    permissive,
    qual as using_clause,
    with_check as check_clause
FROM pg_policies 
WHERE tablename = 'votes'
ORDER BY policyname;

-- 6. 📊 Test vote table access
SELECT 
    '📊 Vote Table Access Test:' as test,
    COUNT(*) as total_votes,
    COUNT(DISTINCT user_id) as unique_voters,
    COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
    COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes
FROM votes;

-- 7. 🎯 Test specific user vote access (replace with actual user ID)
-- SELECT 
--     '🎯 User-specific test:' as test,
--     COUNT(*) as user_votes,
--     auth.uid()::text as current_user_id
-- FROM votes 
-- WHERE user_id = auth.uid()::text;

SELECT '🎉 PRODUCTION VOTE RLS POLICIES FIXED! 🎉' as result;
SELECT '⚠️  Remember to test voting functionality in your deployed app!' as reminder;
