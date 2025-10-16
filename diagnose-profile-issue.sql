-- ===================================================================
-- Diagnose Profile Update Issue
-- Run this to see what's wrong with your user_profiles table
-- ===================================================================

-- 1. Check if username column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
  AND column_name = 'username';

-- 2. Check for NULL usernames
SELECT 
    COUNT(*) as total_users,
    COUNT(username) as users_with_username,
    COUNT(*) - COUNT(username) as users_without_username
FROM user_profiles;

-- 3. Check for duplicate usernames
SELECT 
    username, 
    COUNT(*) as count
FROM user_profiles
WHERE username IS NOT NULL
GROUP BY username
HAVING COUNT(*) > 1;

-- 4. Check constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
  AND conname LIKE '%username%';

-- 5. Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles'
  AND indexname LIKE '%username%';

-- 6. Show current user profiles (for debugging)
SELECT 
    id,
    LEFT(user_id, 20) as user_id,
    username,
    display_name,
    bio,
    created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

