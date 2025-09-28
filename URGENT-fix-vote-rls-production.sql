-- ===================================================================
-- 🚨 URGENT PRODUCTION FIX: Vote RLS Policies 
-- This fixes the 500 error in voting by cleaning up conflicting RLS policies
-- ===================================================================

-- 1. 🧹 Drop ALL existing conflicting vote policies
DROP POLICY IF EXISTS "votes_public_select" ON votes;
DROP POLICY IF EXISTS "votes_insert_sub" ON votes;  
DROP POLICY IF EXISTS "votes_update_sub" ON votes;
DROP POLICY IF EXISTS "votes_delete_sub" ON votes;
DROP POLICY IF EXISTS "Everyone can view votes" ON votes;
DROP POLICY IF EXISTS "votes_select_policy" ON votes;
DROP POLICY IF EXISTS "votes_insert_policy" ON votes;
DROP POLICY IF EXISTS "votes_update_policy" ON votes;
DROP POLICY IF EXISTS "votes_delete_policy" ON votes;
DROP POLICY IF EXISTS "votes_allow_public_read" ON votes;
DROP POLICY IF EXISTS "votes_allow_clerk_insert" ON votes;
DROP POLICY IF EXISTS "votes_allow_clerk_update" ON votes;
DROP POLICY IF EXISTS "votes_allow_clerk_delete" ON votes;
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can insert votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;

-- 2. ✅ Create CLEAN RLS policies for Supabase Auth
CREATE POLICY "clean_votes_select" ON votes
    FOR SELECT USING (true);

CREATE POLICY "clean_votes_insert" ON votes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = user_id
    );

CREATE POLICY "clean_votes_update" ON votes
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = user_id
    );

CREATE POLICY "clean_votes_delete" ON votes
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = user_id
    );

-- 3. ✅ Ensure RLS is enabled
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 4. 🔍 Verification: Show current auth info
SELECT 
    '🔐 Current Auth Status:' as info,
    auth.uid() as user_uuid,
    auth.uid()::text as user_text,
    auth.role() as user_role,
    current_setting('request.jwt.claims', true)::json as jwt_claims;

-- 5. 📋 Show final clean policies
SELECT 
    '✅ Final Vote Policies:' as status,
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
    '📊 Vote Table Test:' as test,
    COUNT(*) as total_votes,
    COUNT(DISTINCT user_id) as unique_voters
FROM votes;

SELECT '🎉 VOTE RLS POLICIES CLEANED AND FIXED! 🎉' as result;
SELECT '⚠️  Test voting in your deployed app now!' as next_step;
