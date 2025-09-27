-- ===================================================================
-- FINAL FIX FOR VOTE RLS POLICIES
-- This uses the proper Supabase auth functions that work with Clerk
-- ===================================================================

-- 1. Drop all existing vote policies
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can insert votes" ON votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "vote_select" ON votes;
DROP POLICY IF EXISTS "vote_insert" ON votes;
DROP POLICY IF EXISTS "vote_update" ON votes;
DROP POLICY IF EXISTS "vote_delete" ON votes;

-- 2. Create simple, working policies using auth.uid()
CREATE POLICY "votes_select_all" ON votes
    FOR SELECT USING (true);

CREATE POLICY "votes_insert_authenticated" ON votes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = user_id
    );

CREATE POLICY "votes_update_own" ON votes
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = user_id
    );

CREATE POLICY "votes_delete_own" ON votes
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = user_id
    );

-- 3. Ensure RLS is enabled
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 4. Test auth functions (run this while authenticated)
SELECT 
    'Auth Debug:' as info,
    auth.uid() as user_uuid,
    auth.uid()::text as user_text,
    auth.role() as user_role;

-- 5. Show final policies
SELECT 
    '✅ Final vote policies:' as status,
    policyname, 
    cmd as operation,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'votes'
ORDER BY policyname;

SELECT '🎉 Vote RLS policies fixed with proper auth functions! 🎉' as result;
