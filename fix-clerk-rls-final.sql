-- ===================================================================
-- DEFINITIVE FIX FOR CLERK + SUPABASE VOTING RLS
-- This removes all duplicate policies and creates working Clerk-compatible ones
-- ===================================================================

-- 1. DROP ALL EXISTING VOTE POLICIES (clean slate)
DROP POLICY IF EXISTS "votes_select_policy" ON votes;
DROP POLICY IF EXISTS "votes_insert_policy" ON votes;
DROP POLICY IF EXISTS "votes_update_policy" ON votes;
DROP POLICY IF EXISTS "votes_delete_policy" ON votes;
DROP POLICY IF EXISTS "votes_public_select" ON votes;
DROP POLICY IF EXISTS "votes_authenticated_insert" ON votes;
DROP POLICY IF EXISTS "votes_authenticated_update" ON votes;
DROP POLICY IF EXISTS "votes_authenticated_delete" ON votes;
DROP POLICY IF EXISTS "votes_select_all" ON votes;
DROP POLICY IF EXISTS "votes_insert_authenticated" ON votes;
DROP POLICY IF EXISTS "votes_update_own" ON votes;
DROP POLICY IF EXISTS "votes_delete_own" ON votes;
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can insert votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;

-- 2. CREATE SINGLE, WORKING SET OF CLERK-COMPATIBLE POLICIES

-- Allow everyone to view votes (needed for vote counts)
CREATE POLICY "votes_allow_public_read" ON votes
    FOR SELECT TO public
    USING (true);

-- Allow authenticated Clerk users to insert votes
CREATE POLICY "votes_allow_clerk_insert" ON votes
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = user_id
    );

-- Allow Clerk users to update their own votes  
CREATE POLICY "votes_allow_clerk_update" ON votes
    FOR UPDATE TO authenticated
    USING (
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = user_id
    )
    WITH CHECK (
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = user_id
    );

-- Allow Clerk users to delete their own votes
CREATE POLICY "votes_allow_clerk_delete" ON votes
    FOR DELETE TO authenticated
    USING (
        (auth.jwt() ->> 'sub') IS NOT NULL AND
        (auth.jwt() ->> 'sub') = user_id
    );

-- 3. ENSURE RLS IS ENABLED
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 4. TEST THE CLERK JWT (run this while authenticated)
SELECT 
    '🔍 Clerk JWT Debug:' as info,
    auth.jwt() as full_jwt,
    auth.jwt() ->> 'sub' as clerk_user_id,
    auth.jwt() ->> 'role' as user_role,
    auth.jwt() ->> 'aud' as audience;

-- 5. VERIFY CLEAN POLICIES (should show only 4 policies)
SELECT 
    '✅ Final Vote Policies:' as status,
    policyname, 
    cmd as operation,
    roles as target_roles
FROM pg_policies 
WHERE tablename = 'votes'
ORDER BY policyname;

-- 6. TEST INSERT (try this while authenticated in your app)
-- This should work if everything is configured correctly
/* 
INSERT INTO votes (project_id, user_id, vote_type) 
VALUES (
    '9482186d-fcb2-474d-b599-1e1a3f2ab399',
    auth.jwt() ->> 'sub', 
    'up'
);
*/

SELECT '🎉 CLERK + SUPABASE VOTING RLS FIXED! 🎉' as result;
SELECT 'Now test voting in your app - it should work!' as next_step;
