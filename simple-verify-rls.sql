-- ===================================================================
-- 🔍 SIMPLE: Production RLS Verification (PostgreSQL Compatible)
-- This version works on all PostgreSQL versions
-- ===================================================================

-- 1. 📋 Check vote table RLS policies
SELECT 
    '📋 Vote Table Policies:' as check_type,
    policyname as policy_name,
    cmd as operation,
    permissive as is_permissive
FROM pg_policies 
WHERE tablename = 'votes'
ORDER BY policyname;

-- 2. 🔐 Test authentication functions
SELECT 
    '🔐 Auth Functions:' as check_type,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    (auth.uid() IS NOT NULL) as has_user_id;

-- 3. 📊 Vote table access test
SELECT 
    '📊 Vote Table Access:' as check_type,
    COUNT(*) as total_votes,
    COUNT(DISTINCT user_id) as unique_users;

-- This should work if you can access the votes table
SELECT * FROM votes ORDER BY created_at DESC LIMIT 3;

-- 4. ✅ Policy count summary
SELECT 
    '✅ Policy Summary:' as check_type,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ CORRECT: 4 clean policies'
        WHEN COUNT(*) > 10 THEN '❌ ERROR: Too many conflicting policies'
        ELSE '⚠️ WARNING: Unexpected policy count'
    END as status
FROM pg_policies 
WHERE tablename = 'votes';

-- 5. 🎯 Expected policies check
SELECT 
    '🎯 Expected Policies:' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'clean_votes_select') 
         AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'clean_votes_insert')
         AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'clean_votes_update') 
         AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'clean_votes_delete')
        THEN '✅ SUCCESS: All 4 clean policies found'
        ELSE '❌ FAILURE: Missing clean policies - run URGENT-fix-vote-rls-production.sql'
    END as result;

SELECT '🎉 Verification complete!' as final_message;
