-- ===================================================================
-- 🔍 VERIFY: Production RLS Policies Status
-- Run this in your Supabase SQL Editor to verify the fix was applied
-- ===================================================================

-- 1. 📋 Check current vote policies (should show only 4 clean policies)
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

-- 2. 🔐 Check current authentication context
SELECT 
    '🔐 Current Auth Context:' as info,
    auth.uid() as auth_uid,
    auth.uid()::text as auth_uid_text,
    auth.role() as auth_role,
    current_setting('request.jwt.claims', true)::json as jwt_claims;

-- 3. 📊 Test vote table permissions
SELECT 
    '📊 Vote Table Access Test:' as test,
    COUNT(*) as total_votes,
    COUNT(DISTINCT user_id) as unique_voters,
    MIN(created_at) as first_vote,
    MAX(created_at) as latest_vote
FROM votes;

-- 4. 🧪 Test RLS policy logic (this should work if you're authenticated)
-- Replace 'your-actual-user-id' with your real user ID from the debug page
-- SELECT 
--     '🧪 RLS Policy Test:' as test,
--     COUNT(*) as user_votes
-- FROM votes 
-- WHERE user_id = auth.uid()::text;

-- 5. 📈 Show table statistics
SELECT 
    '📈 Table Stats:' as info,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE tablename = 'votes';

SELECT '✅ RLS Policy Verification Complete' as result;
SELECT 'If you see 13+ policies above, the fix was NOT applied. Re-run URGENT-fix-vote-rls-production.sql' as important_note;
