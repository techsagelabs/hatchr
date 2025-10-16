-- ===================================================================
-- Debug Profile Creation Issue
-- Run these queries step-by-step to find the problem
-- ===================================================================

-- STEP 1: Check if user_profiles table exists and has correct columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Expected columns:
-- id, user_id, username, display_name, bio, website, twitter, github, 
-- linkedin, avatar_url, location, is_onboarded, created_at, updated_at

-- STEP 2: Check current profiles (shows what's in the table)
SELECT 
    id,
    user_id,
    username,
    display_name,
    avatar_url,
    created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 5;

-- STEP 3: Check RLS policies (are they blocking updates?)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'user_profiles';

-- STEP 4: Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_profiles';

-- STEP 5: Test if you can insert a test profile (replace with your user_id)
-- DO NOT RUN THIS YET - just shows what insert looks like
/*
INSERT INTO user_profiles (user_id, username, display_name, avatar_url)
VALUES ('your-user-id-here', 'test_user', 'Test User', 'https://example.com/avatar.jpg')
ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now()
RETURNING *;
*/

-- STEP 6: Check for any NULL usernames (should be none after migration)
SELECT COUNT(*) as null_username_count
FROM user_profiles
WHERE username IS NULL;

-- STEP 7: Check constraints on user_profiles
SELECT
    conname as constraint_name,
    contype as type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
ORDER BY conname;

-- STEP 8: Check if JWT auth is working (shows current user)
SELECT auth.uid() as current_user_id, auth.jwt() as jwt_claims;

-- STEP 9: Check if your specific user has a profile
-- Replace 'YOUR_USER_ID' with your actual user ID from Supabase Auth
SELECT * FROM user_profiles WHERE user_id = auth.uid();

