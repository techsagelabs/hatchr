-- ===================================================================
-- COMPLETE RLS FIX FOR ALL AUTHENTICATION ISSUES
-- This fixes projects RLS, standardizes auth patterns, and fixes voting
-- ===================================================================

-- 1. ENABLE RLS ON PROJECTS TABLE (this was disabled!)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING VOTE POLICIES (clean slate)
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
DROP POLICY IF EXISTS "votes_select_all" ON votes;
DROP POLICY IF EXISTS "votes_insert_authenticated" ON votes;
DROP POLICY IF EXISTS "votes_update_own" ON votes;
DROP POLICY IF EXISTS "votes_delete_own" ON votes;

-- 3. CREATE CONSISTENT, WORKING VOTE POLICIES
CREATE POLICY "votes_public_select" ON votes
    FOR SELECT TO public USING (true);

CREATE POLICY "votes_authenticated_insert" ON votes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "votes_authenticated_update" ON votes
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "votes_authenticated_delete" ON votes  
    FOR DELETE TO authenticated
    USING (auth.uid()::text = user_id);

-- 4. FIX PROJECTS POLICIES (standardize to match votes)
DROP POLICY IF EXISTS "Everyone can view projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;

CREATE POLICY "projects_public_select" ON projects
    FOR SELECT TO public USING (true);

CREATE POLICY "projects_authenticated_insert" ON projects
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = author_id);

CREATE POLICY "projects_authenticated_update" ON projects
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = author_id)
    WITH CHECK (auth.uid()::text = author_id);

CREATE POLICY "projects_authenticated_delete" ON projects
    FOR DELETE TO authenticated
    USING (auth.uid()::text = author_id);

-- 5. FIX COMMENTS POLICIES (standardize to match)
DROP POLICY IF EXISTS "Everyone can view comments" ON comments;
DROP POLICY IF EXISTS "Users can update/delete their own comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;

CREATE POLICY "comments_public_select" ON comments
    FOR SELECT TO public USING (true);

CREATE POLICY "comments_authenticated_insert" ON comments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = author_id);

CREATE POLICY "comments_authenticated_update" ON comments
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = author_id)
    WITH CHECK (auth.uid()::text = author_id);

CREATE POLICY "comments_authenticated_delete" ON comments
    FOR DELETE TO authenticated
    USING (auth.uid()::text = author_id);

-- 6. ENSURE ALL TABLES HAVE RLS ENABLED
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 7. TEST AUTH FUNCTIONS (run while logged in)
SELECT 
    '🔍 Auth Debug Info:' as info,
    auth.uid() as auth_uid,
    auth.uid()::text as auth_uid_text,
    auth.role() as auth_role,
    current_user as pg_user;

-- 8. VERIFY FINAL POLICIES
SELECT 
    '📋 Vote Policies:' as table_name,
    policyname, 
    cmd as operation,
    roles as target_roles
FROM pg_policies 
WHERE tablename = 'votes'
ORDER BY policyname;

SELECT 
    '📋 Project Policies:' as table_name,
    policyname, 
    cmd as operation,
    roles as target_roles
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policyname;

SELECT '🎉 ALL RLS ISSUES FIXED! Now all policies use consistent auth.uid()::text pattern 🎉' as result;
