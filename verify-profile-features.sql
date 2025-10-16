-- ===================================================================
-- Verify Profile Editing Features Database Setup
-- Run this to check if all columns exist
-- ===================================================================

-- Check if user_profiles table has all required columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Expected columns:
-- ✅ id (uuid)
-- ✅ user_id (text)
-- ✅ username (text) - NEW
-- ✅ display_name (text)
-- ✅ bio (text)
-- ✅ website (text)
-- ✅ twitter (text)
-- ✅ github (text)
-- ✅ linkedin (text)
-- ✅ avatar_url (text)
-- ✅ location (text)
-- ✅ is_onboarded (boolean)
-- ✅ created_at (timestamptz)
-- ✅ updated_at (timestamptz)

-- Check constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass;

-- Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles';

-- Test query to see if username column exists
SELECT 
    id, 
    user_id, 
    username,
    display_name,
    bio,
    website,
    twitter,
    github,
    linkedin,
    avatar_url,
    location
FROM user_profiles
LIMIT 1;

-- If you get an error saying "column 'username' does not exist", 
-- you need to run: add-username-to-user-profiles.sql

